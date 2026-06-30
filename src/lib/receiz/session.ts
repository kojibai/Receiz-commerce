import type { NextRequest } from "next/server";

export function receizAccessTokenFromRequest(request: NextRequest) {
  return (
    request.cookies.get("receiz_access_token")?.value ??
    process.env.RECEIZ_ACCESS_TOKEN ??
    process.env.RECEIZ_CONNECT_ACCESS_TOKEN
  );
}

export function receizLoginRequired(returnTo = "/admin") {
  return {
    ok: false,
    error: "receiz_login_required",
    connectUrl: `/api/auth/receiz/start?returnTo=${encodeURIComponent(returnTo)}`
  };
}
