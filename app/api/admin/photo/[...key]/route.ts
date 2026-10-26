import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/auth";
import { getObject } from "@/lib/storage";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  // Re-verify session inside route handler
  const isAuth = await getAdminSessionFromCookies();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized photo access." }, { status: 401 });
  }

  const { key } = await params;
  const objectKey = key.join("/");

  if (!objectKey || !objectKey.startsWith("admissions/")) {
    return NextResponse.json({ error: "Invalid photo key" }, { status: 400 });
  }

  try {
    const s3Response = await getObject(objectKey);
    if (!s3Response.Body) {
      return NextResponse.json({ error: "Photo not found in storage" }, { status: 404 });
    }

    const contentType = s3Response.ContentType || "image/jpeg";
    const bodyStream = s3Response.Body as ReadableStream | Readable;

    // Convert to web ReadableStream if Node Readable
    let responseStream: ReadableStream;
    if (bodyStream instanceof Readable) {
      responseStream = new ReadableStream({
        start(controller) {
          bodyStream.on("data", (chunk) => controller.enqueue(chunk));
          bodyStream.on("end", () => controller.close());
          bodyStream.on("error", (err) => controller.error(err));
        },
      });
    } else {
      responseStream = bodyStream as ReadableStream;
    }

    return new Response(responseStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    console.error("Stream photo error:", err);
    return NextResponse.json({ error: "Failed to load photo" }, { status: 404 });
  }
}
