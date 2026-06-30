import { PublicStorefront } from "@/features/storefront/PublicStorefront";
import { loadStorefrontState } from "@/lib/storefront/server-state";

export default async function HomePage() {
  const { hostContext, state } = await loadStorefrontState();

  return <PublicStorefront initialHostContext={hostContext} initialState={state} />;
}
