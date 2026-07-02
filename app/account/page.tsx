import { AccountDashboard } from "@/features/account/AccountDashboard";
import { loadStorefrontState, type StorefrontSearchParams } from "@/lib/storefront/server-state";
import { redirect } from "next/navigation";

type AccountPageProps = {
  searchParams?: Promise<StorefrontSearchParams>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { hostContext, state } = await loadStorefrontState(await searchParams);

  if (hostContext.surface === "tenant") {
    redirect("/#account");
  }

  return <AccountDashboard initialHostContext={hostContext} initialState={state} />;
}
