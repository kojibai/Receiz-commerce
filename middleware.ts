import { NextRequest, NextResponse } from "next/server";
import { isPlatformHost, shouldBypassTenantRouting, tenantSlugFromHost } from "@/lib/hosting/domain-utils";
import { platform } from "@/lib/platform";

export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  if (shouldBypassTenantRouting(nextUrl.pathname)) {
    return NextResponse.next();
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const tenantSlug = tenantSlugFromHost(host);
  const isCustomDomain = host ? !isPlatformHost(host) && !tenantSlug : false;

  if (!tenantSlug && !isCustomDomain) {
    return NextResponse.next();
  }

  if (nextUrl.pathname === "/admin" || nextUrl.pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  const rewriteUrl = nextUrl.clone();
  if (tenantSlug) {
    rewriteUrl.searchParams.set("tenant", tenantSlug);
    rewriteUrl.searchParams.set("tenantHost", `${tenantSlug}.${platform.domain}`);
  } else if (host) {
    rewriteUrl.searchParams.set("domain", host);
  }

  const response = NextResponse.rewrite(rewriteUrl);
  if (tenantSlug) response.headers.set("x-receiz-tenant", tenantSlug);
  if (host) response.headers.set("x-receiz-host", host);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
