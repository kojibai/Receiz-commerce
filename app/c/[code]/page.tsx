import { notFound } from "next/navigation";
import { WildsCardPage } from "@/features/play/WildsCardPage";

export default async function CompactCardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[a-f0-9]{24}$/.test(code)) notFound();
  return <WildsCardPage assetId={`wilds:${code}`} />;
}
