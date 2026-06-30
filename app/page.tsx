import { PublicStorefront } from "@/features/storefront/PublicStorefront";
import { loadStorefrontState, type StorefrontSearchParams } from "@/lib/storefront/server-state";

type HomePageProps = {
  searchParams?: Promise<StorefrontSearchParams>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { hostContext, state } = await loadStorefrontState(await searchParams);

  return <PublicStorefront initialHostContext={hostContext} initialState={state} />;
}
