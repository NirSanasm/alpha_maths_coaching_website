import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { sql } from "@/lib/db";
import { Submission } from "@/lib/types";

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const isAuth = await getAdminSessionFromCookies();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const searchPattern = search ? `%${search}%` : null;

  try {
    const rows = await sql`
      SELECT *
      FROM submissions
      WHERE
        (${searchPattern}::text IS NULL OR full_name ILIKE ${searchPattern} OR contact_number ILIKE ${searchPattern} OR form_no ILIKE ${searchPattern})
        AND (${category || null}::text IS NULL OR course_category = ${category})
        AND (${status || null}::text IS NULL OR status = ${status})
      ORDER BY created_at DESC;
    `;

    const submissions = rows as unknown as Submission[];

    const headers = [
      "Form No",
      "Full Name",
      "Date of Birth",
      "Gender",
      "Father Name",
      "Guardian Name",
      "Address",
      "Current Class",
      "School",
      "Contact Number",
      "WhatsApp Number",
      "Course Category",
      "Status",
      "Admin Notes",
      "Submission Date",
    ];

    const csvLines = [headers.join(",")];

    for (const s of submissions) {
      const line = [
        escapeCsvCell(s.form_no),
        escapeCsvCell(s.full_name),
        escapeCsvCell(s.dob ? new Date(s.dob).toISOString().split("T")[0] : ""),
        escapeCsvCell(s.gender),
        escapeCsvCell(s.father_name),
        escapeCsvCell(s.guardian_name || ""),
        escapeCsvCell(s.address),
        escapeCsvCell(s.current_class),
        escapeCsvCell(s.school),
        escapeCsvCell(s.contact_number),
        escapeCsvCell(s.whatsapp_number),
        escapeCsvCell(s.course_category),
        escapeCsvCell(s.status),
        escapeCsvCell(s.admin_notes || ""),
        escapeCsvCell(new Date(s.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })),
      ];
      csvLines.push(line.join(","));
    }

    const csvContent = "\uFEFF" + csvLines.join("\r\n"); // UTF-8 BOM for Excel compatibility
    const filename = `AMA_Submissions_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("CSV Export error:", err);
    return NextResponse.json({ error: "Failed to export submissions" }, { status: 500 });
  }
}
