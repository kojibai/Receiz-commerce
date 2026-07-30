// @receiz-generated receiz.app.contract.v1
// Regenerate with receiz app apply; do not edit directly.

import { NextResponse } from "next/server";
import { receizProjectAdapter } from "../../../../receiz/receiz.adapter";
export async function POST(request: Request) {
  const artifact = await request.blob();
  const result = await receizProjectAdapter.publicClient().verification.verifyArtifact(artifact);
  const status = result.status === "verified-artifact" ? 200 : result.status === "unsupported" ? 415 : 422;
  return NextResponse.json(result, { status });
}
