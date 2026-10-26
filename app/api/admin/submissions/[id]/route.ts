import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { sql } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import { updateSubmissionSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await getAdminSessionFromCookies();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const result = await sql`
      SELECT * FROM submissions WHERE id = ${id}::uuid LIMIT 1;
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json({ submission: result[0] });
  } catch (err) {
    console.error("Fetch submission error:", err);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await getAdminSessionFromCookies();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 });
    }

    const { status, adminNotes } = parsed.data;
    const result = await sql`
      UPDATE submissions
      SET
        status = ${status},
        admin_notes = COALESCE(${adminNotes ?? null}, admin_notes),
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, submission: result[0] });
  } catch (err) {
    console.error("Update submission error:", err);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await getAdminSessionFromCookies();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;
  try {
    // 1. Fetch submission to get photo key
    const existing = await sql`
      SELECT photo_key FROM submissions WHERE id = ${id}::uuid LIMIT 1;
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const photoKey = existing[0]?.photo_key;

    // 2. Delete row from database
    await sql`
      DELETE FROM submissions WHERE id = ${id}::uuid;
    `;

    // 3. Clean up object from Neon Object Storage
    if (photoKey) {
      try {
        await deleteObject(photoKey);
      } catch (storageErr) {
        console.error("Failed to delete photo from object storage:", storageErr);
      }
    }

    return NextResponse.json({ success: true, message: "Submission and photo deleted successfully" });
  } catch (err) {
    console.error("Delete submission error:", err);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
