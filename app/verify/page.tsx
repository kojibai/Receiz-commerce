import { ProofVerifier } from "@/features/verify/ProofVerifier";

export default async function VerifyPage({
  searchParams
}: {
  searchParams: Promise<{ claim?: string; pulse?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page-shell verify-surface-shell">
      <ProofVerifier claim={params.claim} pulse={params.pulse} />
    </main>
  );
}
