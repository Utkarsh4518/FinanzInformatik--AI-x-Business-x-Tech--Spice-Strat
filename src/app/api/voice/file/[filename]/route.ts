import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const voiceUploadDir = path.join(process.cwd(), "public", "uploads", "voice");

function getContentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".webm":
      return "audio/webm";
    case ".m4a":
      return "audio/mp4";
    default:
      return "application/octet-stream";
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<unknown> }) {
  const params = (await context.params) as { filename?: string };
  const filename = params.filename;

  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid audio filename." }, { status: 400 });
  }

  const filePath = path.join(voiceUploadDir, filename);

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": getContentType(filename),
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Audio file not found." }, { status: 404 });
  }
}
