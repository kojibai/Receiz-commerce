import { AccountDashboard } from "@/features/account/AccountDashboard";
import { loadStorefrontState, type StorefrontSearchParams } from "@/lib/storefront/server-state";

type AccountPageProps = {
  searchParams?: Promise<StorefrontSearchParams>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { hostContext, state } = await loadStorefrontState(await searchParams);

  return <AccountDashboard initialHostContext={hostContext} initialState={state} />;
}
