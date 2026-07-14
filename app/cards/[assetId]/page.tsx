import { WildsCardPage } from "@/features/play/WildsCardPage";

export default async function CardPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  return <WildsCardPage assetId={decodeURIComponent(assetId)} />;
}
