import { NextRequest, NextResponse } from "next/server";
import { admissionFormSchema } from "@/lib/validation";
import { sql } from "@/lib/db";
import { uploadObject } from "@/lib/storage";
import { getClientIp, checkAdmissionRateLimit, recordAdmissionSubmission } from "@/lib/rate-limit";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Check cutoff deadline
    const lastDateStr = process.env.ADMISSION_LAST_DATE || "2026-12-25";
    const lastDate = new Date(`${lastDateStr}T23:59:59.999Z`);
    const now = new Date();

    if (now > lastDate) {
      return NextResponse.json(
        { error: "Admissions for the current academic session have closed on 25-12-2026." },
        { status: 400 }
      );
    }

    // 2. Rate limiting check per client IP
    const clientIp = getClientIp(req.headers);
    const isAllowed = await checkAdmissionRateLimit(clientIp, 5);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Submission rate limit exceeded (maximum 5 submissions per hour). Please try again later." },
        { status: 429 }
      );
    }

    // 3. Extract form data
    const formData = await req.formData();
    const rawData = {
      fullName: formData.get("fullName"),
      dob: formData.get("dob"),
      gender: formData.get("gender"),
      fatherName: formData.get("fatherName"),
      guardianName: formData.get("guardianName") || "",
      address: formData.get("address"),
      currentClass: formData.get("currentClass"),
      school: formData.get("school"),
      contactNumber: formData.get("contactNumber"),
      whatsappNumber: formData.get("whatsappNumber"),
      courseCategory: formData.get("courseCategory"),
      declaration: formData.get("declaration") === "true",
      honeypot: formData.get("website") || "",
    };

    // 4. Honeypot check
    if (rawData.honeypot && String(rawData.honeypot).trim() !== "") {
      // Fake response to thwart automated bot spammers
      return NextResponse.json({
        success: true,
        formNo: "AMA-2027-0000",
        submissionDate: new Date().toISOString(),
      });
    }

    // 5. Zod schema validation
    const parsed = admissionFormSchema.safeParse(rawData);
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: errorMap },
        { status: 400 }
      );
    }

    const validData = parsed.data;

    // 6. Photo processing (optional)
    const photoFile = formData.get("photo") as File | null;
    let photoKey: string | null = null;
    let photoMime: string | null = null;
    let photoSize: number | null = null;

    if (photoFile && typeof photoFile === "object" && photoFile.size > 0) {
      photoSize = photoFile.size;
      photoMime = photoFile.type;

      if (photoSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Passport-size photo exceeds maximum limit of 2MB." },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(photoMime)) {
        return NextResponse.json(
          { error: "Invalid photo format. Only JPG, PNG, and WebP files are accepted." },
          { status: 400 }
        );
      }

      const extension = photoMime === "image/png" ? "png" : photoMime === "image/webp" ? "webp" : "jpg";
      photoKey = `admissions/${crypto.randomUUID()}.${extension}`;

      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Neon Object Storage
      await uploadObject({
        key: photoKey,
        body: buffer,
        contentType: photoMime,
      });
    }

    // 7. Get next sequential form number
    const seqResult = await sql`
      SELECT nextval('form_number_seq') AS seq_num;
    `;
    const nextSeq = seqResult[0]?.seq_num || 1;
    const formNo = `AMA-2027-${String(nextSeq).padStart(4, "0")}`;

    // 8. Insert into Postgres
    const insertResult = await sql`
      INSERT INTO submissions (
        form_no,
        full_name,
        dob,
        gender,
        father_name,
        guardian_name,
        address,
        current_class,
        school,
        contact_number,
        whatsapp_number,
        course_category,
        photo_key,
        photo_mime,
        photo_size,
        status,
        admin_notes
      ) VALUES (
        ${formNo},
        ${validData.fullName},
        ${validData.dob},
        ${validData.gender},
        ${validData.fatherName},
        ${validData.guardianName || null},
        ${validData.address},
        ${validData.currentClass},
        ${validData.school},
        ${validData.contactNumber},
        ${validData.whatsappNumber},
        ${validData.courseCategory},
        ${photoKey},
        ${photoMime},
        ${photoSize},
        'New',
        ''
      )
      RETURNING id, form_no, created_at;
    `;

    // 9. Record submission rate limit
    await recordAdmissionSubmission(clientIp);

    const submissionDate = insertResult[0]?.created_at || new Date().toISOString();

    return NextResponse.json({
      success: true,
      formNo,
      submissionDate,
    });
  } catch (err: unknown) {
    console.error("Admission submission error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your admission. Please try again or contact the academy directly." },
      { status: 500 }
    );
  }
}
