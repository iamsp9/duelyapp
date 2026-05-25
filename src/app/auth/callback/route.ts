import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Force correct redirect origin
  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const protocol =
    process.env.NODE_ENV === "development"
      ? "https"
      : "https";

  if (forwardedHost) {
    return NextResponse.redirect(
      `${protocol}://${forwardedHost}/dashboard`
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/dashboard`
  );
}