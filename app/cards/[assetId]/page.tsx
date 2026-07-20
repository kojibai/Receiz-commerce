import { headers } from "next/headers";
import { WildsCardPage } from "@/features/play/WildsCardPage";
import { publicCardRequestOrigin, resolvePublicWildsCardGlobally } from "@/lib/receiz/public-card-server";

export const dynamic = "force-dynamic";

export default async function CardPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const requestHeaders = await headers();
  const record = await resolvePublicWildsCardGlobally(decodedAssetId, publicCardRequestOrigin(requestHeaders));
  return <WildsCardPage assetId={decodedAssetId} initialAsset={record?.asset ?? null} />;
}
