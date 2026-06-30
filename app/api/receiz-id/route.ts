import { NextResponse } from "next/server";
import { mockAuth } from "@/lib/auth/mock-auth";

export async function GET() {
  return NextResponse.json({
    ok: true,
    receizId: mockAuth.getReceizIdState(),
    authorizeUrl: mockAuth.getReceizIdAuthorizeUrl()
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
