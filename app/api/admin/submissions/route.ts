import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { sql } from "@/lib/db";
import { Submission } from "@/lib/types";

export async function GET(req: NextRequest) {
  // Dual-layer session verification
  const isAuth = await getAdminSessionFromCookies();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const sort = searchParams.get("sort") === "asc" ? "ASC" : "DESC";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    // 1. Fetch counts & stats
    const statsResult = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE course_category = 'A - Class IX')::int AS class_ix,
        COUNT(*) FILTER (WHERE course_category = 'B - Class X')::int AS class_x,
        COUNT(*) FILTER (WHERE status = 'New')::int AS status_new,
        COUNT(*) FILTER (WHERE status = 'Contacted')::int AS status_contacted,
        COUNT(*) FILTER (WHERE status = 'Admitted')::int AS status_admitted,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int AS status_rejected
      FROM submissions;
    `;

    const stats = {
      total: statsResult[0]?.total ?? 0,
      classIX: statsResult[0]?.class_ix ?? 0,
      classX: statsResult[0]?.class_x ?? 0,
      statusNew: statsResult[0]?.status_new ?? 0,
      statusContacted: statsResult[0]?.status_contacted ?? 0,
      statusAdmitted: statsResult[0]?.status_admitted ?? 0,
      statusRejected: statsResult[0]?.status_rejected ?? 0,
    };

    // 2. Fetch filtered submissions
    const searchPattern = search ? `%${search}%` : null;

    let submissions: Submission[];

    if (sort === "ASC") {
      const rows = await sql`
        SELECT *
        FROM submissions
        WHERE
          (${searchPattern}::text IS NULL OR full_name ILIKE ${searchPattern} OR contact_number ILIKE ${searchPattern} OR form_no ILIKE ${searchPattern})
          AND (${category || null}::text IS NULL OR course_category = ${category})
          AND (${status || null}::text IS NULL OR status = ${status})
        ORDER BY created_at ASC
        LIMIT ${limit} OFFSET ${offset};
      `;
      submissions = rows as unknown as Submission[];
    } else {
      const rows = await sql`
        SELECT *
        FROM submissions
        WHERE
          (${searchPattern}::text IS NULL OR full_name ILIKE ${searchPattern} OR contact_number ILIKE ${searchPattern} OR form_no ILIKE ${searchPattern})
          AND (${category || null}::text IS NULL OR course_category = ${category})
          AND (${status || null}::text IS NULL OR status = ${status})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
      submissions = rows as unknown as Submission[];
    }

    const countRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM submissions
      WHERE
        (${searchPattern}::text IS NULL OR full_name ILIKE ${searchPattern} OR contact_number ILIKE ${searchPattern} OR form_no ILIKE ${searchPattern})
        AND (${category || null}::text IS NULL OR course_category = ${category})
        AND (${status || null}::text IS NULL OR status = ${status});
    `;
    const totalFiltered = countRows[0]?.count ?? 0;

    return NextResponse.json({
      submissions,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      stats,
    });
  } catch (err) {
    console.error("Submissions fetch error:", err);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}
