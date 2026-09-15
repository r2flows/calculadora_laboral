import { NextResponse } from "next/server";

// Healthcheck para Railway — sin auth ni DB.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
