import { NextResponse } from "next/server";
import { loadDemoWorkspace } from "@/lib/db/mock-store";

export async function POST() {
  return NextResponse.json({ demo: loadDemoWorkspace() });
}
