import { NextResponse } from "next/server";
import { mockAuth } from "@/lib/auth/mock-auth";
import { getRequestOrigin } from "@/lib/url";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);

  return NextResponse.json({
    ok: true,
    receizId: mockAuth.getReceizIdState(),
    authorizeUrl: mockAuth.getReceizIdAuthorizeUrl(origin)
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "sign_in");

  if (action === "create") {
    const account = await mockAuth.createReceizId();
    return NextResponse.json({ ok: true, action, account });
  }

  return NextResponse.json({
    ok: true,
    action,
    account: mockAuth.signInWithReceizId()
  });
}
