import { NextRequest, NextResponse } from "next/server";
import { createReceizCommerceAdapter, receizCommerceAdapter } from "@/lib/receiz/adapter";

export async function GET(request: NextRequest) {
  const accessToken =
    request.cookies.get("receiz_access_token")?.value ??
    process.env.RECEIZ_ACCESS_TOKEN ??
    process.env.RECEIZ_CONNECT_ACCESS_TOKEN;
  const adapter = accessToken
    ? createReceizCommerceAdapter({ baseUrl: process.env.RECEIZ_BASE_URL, accessToken })
    : receizCommerceAdapter;
  const connection = await adapter.connectReceiz();
  const proofTrail = await receizCommerceAdapter.getProofTrail();

  return NextResponse.json({
    ok: true,
    connection,
    proofTrail
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const proof = await receizCommerceAdapter.verifyObject({
    label: String(body.label ?? "Mock object"),
    objectType: String(body.objectType ?? "custom")
  });

  return NextResponse.json({ ok: true, proof });
}
