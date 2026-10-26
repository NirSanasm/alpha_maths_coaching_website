import { neon } from "@neondatabase/serverless";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE_URL = "http://localhost:3005";
const sql = neon(process.env.DATABASE_URL);
const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
const bucket = process.env.ASSETS_BUCKET || "assets";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log("==================================================");
  console.log("   ALPHA MATHEMATICS ACADEMY — END-TO-END VERIFICATION");
  console.log("==================================================\n");

  // Clean rate limits before running tests
  await sql`DELETE FROM admin_login_rate_limits;`;
  await sql`DELETE FROM rate_limits;`;

  // TEST 1: Unauthenticated protection
  console.log("--- TEST 1: Unauthenticated Protection & Security Headers ---");
  const unauthPageRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
  assert(
    unauthPageRes.status === 307 || unauthPageRes.status === 302,
    `Unauthenticated /admin redirects to login (Status: ${unauthPageRes.status})`
  );
  const location = unauthPageRes.headers.get("location");
  assert(
    location && location.includes("/admin/login"),
    `/admin redirect target is /admin/login (Target: ${location})`
  );

  const unauthApiRes = await fetch(`${BASE_URL}/api/admin/submissions`);
  assert(
    unauthApiRes.status === 401,
    `Unauthenticated /api/admin/submissions returns 401 (Status: ${unauthApiRes.status})`
  );

  const unauthPhotoRes = await fetch(`${BASE_URL}/api/admin/photo/admissions/nonexistent.jpg`);
  assert(
    unauthPhotoRes.status === 401,
    `Unauthenticated photo route returns 401 (Status: ${unauthPhotoRes.status})`
  );

  // Security headers check
  assert(
    unauthPageRes.headers.get("x-frame-options") === "DENY",
    "Security header X-Frame-Options: DENY present"
  );
  assert(
    unauthPageRes.headers.get("x-content-type-options") === "nosniff",
    "Security header X-Content-Type-Options: nosniff present"
  );

  // TEST 2: Validation Tests
  console.log("\n--- TEST 2: Server-side Validation Rejections ---");
  
  // 2a. Bad phone number
  const badPhoneForm = new FormData();
  badPhoneForm.append("fullName", "Test Student");
  badPhoneForm.append("dob", "2010-05-15");
  badPhoneForm.append("gender", "Male");
  badPhoneForm.append("fatherName", "Test Father");
  badPhoneForm.append("address", "Bishnupur Ward 1");
  badPhoneForm.append("currentClass", "Class VIII");
  badPhoneForm.append("school", "Mahei Leikol");
  badPhoneForm.append("contactNumber", "12345"); // BAD PHONE
  badPhoneForm.append("whatsappNumber", "9366285519");
  badPhoneForm.append("courseCategory", "A - Class IX");
  badPhoneForm.append("declaration", "true");

  const badPhoneRes = await fetch(`${BASE_URL}/api/admissions`, {
    method: "POST",
    body: badPhoneForm,
  });
  const badPhoneData = await badPhoneRes.json();
  assert(
    badPhoneRes.status === 400 && badPhoneData.error.toLowerCase().includes("mobile"),
    `Rejects invalid phone number (400: ${badPhoneData.error})`
  );

  // 2b. Non-image file
  const badFileForm = new FormData();
  badFileForm.append("fullName", "Test Student");
  badFileForm.append("dob", "2010-05-15");
  badFileForm.append("gender", "Male");
  badFileForm.append("fatherName", "Test Father");
  badFileForm.append("address", "Bishnupur Ward 1");
  badFileForm.append("currentClass", "Class VIII");
  badFileForm.append("school", "Mahei Leikol");
  badFileForm.append("contactNumber", "9366285519");
  badFileForm.append("whatsappNumber", "9366285519");
  badFileForm.append("courseCategory", "A - Class IX");
  badFileForm.append("declaration", "true");
  badFileForm.append(
    "photo",
    new Blob(["fake binary payload"], { type: "application/octet-stream" }),
    "malicious.bin"
  );

  const badFileRes = await fetch(`${BASE_URL}/api/admissions`, {
    method: "POST",
    body: badFileForm,
  });
  const badFileData = await badFileRes.json();
  assert(
    badFileRes.status === 400 && badFileData.error.includes("Invalid photo format"),
    `Rejects non-image file type (400: ${badFileData.error})`
  );

  // 2c. Oversized file (>2MB)
  const oversizedBuffer = new Uint8Array(2.5 * 1024 * 1024);
  const oversizedForm = new FormData();
  oversizedForm.append("fullName", "Test Student");
  oversizedForm.append("dob", "2010-05-15");
  oversizedForm.append("gender", "Male");
  oversizedForm.append("fatherName", "Test Father");
  oversizedForm.append("address", "Bishnupur Ward 1");
  oversizedForm.append("currentClass", "Class VIII");
  oversizedForm.append("school", "Mahei Leikol");
  oversizedForm.append("contactNumber", "9366285519");
  oversizedForm.append("whatsappNumber", "9366285519");
  oversizedForm.append("courseCategory", "A - Class IX");
  oversizedForm.append("declaration", "true");
  oversizedForm.append(
    "photo",
    new Blob([oversizedBuffer], { type: "image/jpeg" }),
    "huge_photo.jpg"
  );

  const oversizedRes = await fetch(`${BASE_URL}/api/admissions`, {
    method: "POST",
    body: oversizedForm,
  });
  const oversizedData = await oversizedRes.json();
  assert(
    oversizedRes.status === 400 && oversizedData.error.includes("exceeds maximum limit"),
    `Rejects oversized photo > 2MB (400: ${oversizedData.error})`
  );

  // TEST 3: Successful Submission with Photo
  console.log("\n--- TEST 3: Successful Admission Submission with Photo ---");
  const testStudentName = "THOKCHOM SANATHABA SINGH";
  const dummyPhotoBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  ); // 1x1 transparent png
  const validForm = new FormData();
  validForm.append("fullName", testStudentName);
  validForm.append("dob", "2011-03-20");
  validForm.append("gender", "Male");
  validForm.append("fatherName", "Thokchom Inao Singh");
  validForm.append("guardianName", "Thokchom Memi Devi");
  validForm.append("address", "Bishnupur Bazar Ward No. 2, Near SBI");
  validForm.append("currentClass", "Class VIII (Going to IX)");
  validForm.append("school", "Bishnupur Higher Secondary School");
  validForm.append("contactNumber", "9366285519");
  validForm.append("whatsappNumber", "9366285519");
  validForm.append("courseCategory", "A - Class IX");
  validForm.append("declaration", "true");
  validForm.append(
    "photo",
    new Blob([dummyPhotoBytes], { type: "image/png" }),
    "sanathaba_passport.png"
  );

  const submitRes = await fetch(`${BASE_URL}/api/admissions`, {
    method: "POST",
    body: validForm,
  });
  const submitData = await submitRes.json();
  assert(submitRes.ok && submitData.success, `Admission submitted successfully (Form No: ${submitData.formNo})`);

  const createdFormNo = submitData.formNo;

  // TEST 4: Confirm row in Postgres & object in Neon Storage
  console.log("\n--- TEST 4: Database & Object Storage Verification ---");
  const rows = await sql`
    SELECT * FROM submissions WHERE form_no = ${createdFormNo} LIMIT 1;
  `;
  assert(rows.length === 1, `Postgres row exists for Form No ${createdFormNo}`);
  const record = rows[0];
  assert(record.full_name === testStudentName, `Full name stored as block letters: ${record.full_name}`);
  assert(record.photo_key && record.photo_key.startsWith("admissions/"), `Photo object key stored: ${record.photo_key}`);

  // Storage check
  const headRes = await s3.send(
    new HeadObjectCommand({ Bucket: bucket, Key: record.photo_key })
  );
  assert(headRes.$metadata.httpStatusCode === 200, `Object exists in Neon bucket "${bucket}": ${record.photo_key}`);

  // TEST 5: Admin Login Authentication
  console.log("\n--- TEST 5: Admin Login Security & JWT Session ---");
  // 5a. Wrong password
  const wrongLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "wrong_password_123" }),
  });
  const wrongLoginBody = await wrongLoginRes.json();
  assert(
    wrongLoginRes.status === 401,
    `Wrong password rejected with 401 (Got: ${wrongLoginRes.status}, Error: ${wrongLoginBody.error})`
  );

  // 5b. Correct password
  const correctLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  assert(correctLoginRes.ok, `Correct password accepted (200 OK)`);

  const setCookieHeader = correctLoginRes.headers.get("set-cookie");
  assert(setCookieHeader && setCookieHeader.includes("ama_admin_session"), `Signed JWT session cookie returned in Set-Cookie`);
  const sessionCookie = setCookieHeader.split(";")[0];

  // TEST 6: Authenticated Dashboard API & Photo Streaming
  console.log("\n--- TEST 6: Authenticated Admin Dashboard & Photo Streaming ---");
  const adminListRes = await fetch(`${BASE_URL}/api/admin/submissions?search=${encodeURIComponent(createdFormNo)}`, {
    headers: { Cookie: sessionCookie },
  });
  const adminListData = await adminListRes.json();
  assert(adminListRes.ok, `Admin submissions list fetched successfully`);
  assert(
    adminListData.submissions.some((s) => s.form_no === createdFormNo),
    `New submission appears in admin submissions list`
  );
  assert(adminListData.stats.total >= 1, `Stats count total updated (${adminListData.stats.total})`);

  // Photo streaming check
  const streamPhotoRes = await fetch(`${BASE_URL}/api/admin/photo/${record.photo_key}`, {
    headers: { Cookie: sessionCookie },
  });
  assert(streamPhotoRes.ok, `Authenticated photo stream returns 200 OK`);
  assert(streamPhotoRes.headers.get("content-type") === "image/png", `Photo content-type is image/png`);
  const photoArrayBuffer = await streamPhotoRes.arrayBuffer();
  assert(photoArrayBuffer.byteLength > 0, `Photo streamed bytes received (${photoArrayBuffer.byteLength} bytes)`);

  // TEST 7: Status & Notes Update
  console.log("\n--- TEST 7: Status & Notes Mutation Persistence ---");
  const updateRes = await fetch(`${BASE_URL}/api/admin/submissions/${record.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      status: "Admitted",
      adminNotes: "Verification completed at Bishnupur center. Admitted to Batch A.",
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.ok && updateData.submission.status === "Admitted", `Status updated to "Admitted"`);
  assert(
    updateData.submission.admin_notes.includes("Verification completed"),
    `Admin notes persisted: "${updateData.submission.admin_notes}"`
  );

  // TEST 8: CSV Export
  console.log("\n--- TEST 8: CSV Export ---");
  const csvRes = await fetch(`${BASE_URL}/api/admin/submissions/export`, {
    headers: { Cookie: sessionCookie },
  });
  assert(csvRes.ok, `CSV export endpoint returned 200 OK`);
  const csvText = await csvRes.text();
  assert(csvText.includes(createdFormNo), `CSV export contains the generated Form No (${createdFormNo})`);
  assert(csvText.includes(testStudentName), `CSV export contains student name (${testStudentName})`);

  // TEST 9: Cascade Deletion
  console.log("\n--- TEST 9: Cascade Deletion (Database & Storage) ---");
  const deleteRes = await fetch(`${BASE_URL}/api/admin/submissions/${record.id}`, {
    method: "DELETE",
    headers: { Cookie: sessionCookie },
  });
  assert(deleteRes.ok, `Delete API returned success 200 OK`);

  const checkDb = await sql`SELECT * FROM submissions WHERE id = ${record.id}::uuid;`;
  assert(checkDb.length === 0, `Record successfully deleted from Postgres`);

  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: record.photo_key }));
    assert(false, `Photo object should have been deleted from storage!`);
  } catch (err) {
    assert(err.name === "NotFound" || err.$metadata?.httpStatusCode === 404, `Photo successfully removed from Neon Object Storage (404 Not Found)`);
  }

  console.log("\n==================================================");
  console.log("   🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
