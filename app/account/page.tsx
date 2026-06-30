import { AccountDashboard } from "@/features/account/AccountDashboard";
import { loadStorefrontState } from "@/lib/storefront/server-state";

export default async function AccountPage() {
  const { hostContext, state } = await loadStorefrontState();

  return <AccountDashboard initialHostContext={hostContext} initialState={state} />;
}
