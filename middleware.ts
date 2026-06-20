import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    // Si el middleware explota por cualquier razón, dejar pasar la request
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/abogados/:path*", "/admin/:path*", "/cliente/:path*", "/login"],
};
