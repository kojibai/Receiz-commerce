import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { WildsCardPage } from "@/features/play/WildsCardPage";
import { publicCardRequestOrigin, resolvePublicWildsCardGlobally } from "@/lib/receiz/public-card-server";

export const dynamic = "force-dynamic";

export default async function CompactCardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[a-f0-9]{24}$/.test(code)) notFound();
  const assetId = `wilds:${code}`;
  const requestHeaders = await headers();
  const record = await resolvePublicWildsCardGlobally(assetId, publicCardRequestOrigin(requestHeaders));
  return <WildsCardPage assetId={assetId} initialAsset={record?.asset ?? null} />;
}
