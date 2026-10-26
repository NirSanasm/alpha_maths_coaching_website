import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testPostgres() {
  console.log("--> Testing Neon Postgres connection...");
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
  console.log("Postgres connected successfully! Server time:", result[0].current_time);
  
  const seqRes = await sql`SELECT nextval('form_number_seq') as next_val`;
  console.log("Postgres sequence working! Sample nextval:", seqRes[0].next_val);
}

async function testObjectStorage() {
  console.log("\n--> Testing Neon Object Storage (S3 API)...");
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
  const testKey = `test/ping-${Date.now()}.txt`;
  const content = "Neon Object Storage verification test payload";

  console.log(`Uploading test object to s3://${bucket}/${testKey}...`);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from(content, "utf-8"),
      ContentType: "text/plain",
    })
  );
  console.log("Upload succeeded!");

  console.log("Fetching test object...");
  const getRes = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: testKey,
    })
  );
  const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf-8");
  };
  const bodyText = await streamToBuffer(getRes.Body);
  if (bodyText !== content) {
    throw new Error(`Content mismatch: expected "${content}", got "${bodyText}"`);
  }
  console.log("Object fetched and verified successfully!");

  console.log("Generating presigned GET URL...");
  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: testKey }),
    { expiresIn: 60 }
  );
  console.log("Presigned URL generated successfully!");

  console.log("Deleting test object...");
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: testKey,
    })
  );
  console.log("Test object deleted successfully!");
}

async function main() {
  try {
    await testPostgres();
    await testObjectStorage();
    console.log("\n=== ALL NEON SERVICES VERIFIED END-TO-END! ===");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

main();
