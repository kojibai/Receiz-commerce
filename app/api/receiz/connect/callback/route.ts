// @receiz-generated receiz.app.contract.v1
// Developer-editable below documented extension points.

import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
  return NextResponse.json({ ok: true, codeReceived: true, authority: "delegated-receiz-connect" });
}
