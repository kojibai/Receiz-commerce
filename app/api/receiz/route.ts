import { NextResponse } from "next/server";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";

export async function GET() {
  const connection = await receizCommerceAdapter.connectReceiz();
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
