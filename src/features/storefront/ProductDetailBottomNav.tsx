"use client";

import { usePathname, useRouter } from "next/navigation";
import { BottomNav, type MobileView } from "@/features/storefront/StoreShell";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { customerAccountRouteForSurface } from "@/lib/storefront/customer-session";

export function ProductDetailBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navigate = (view: MobileView) => {
    const hostContext = hostContextFromHost(typeof window === "undefined" ? null : window.location.host);
    const accountRoute = view === "account" ? customerAccountRouteForSurface(hostContext, pathname) : null;

    if (accountRoute) {
      router.push(accountRoute);
      return;
    }

    router.push(`/#${view}`);
  };

  return <BottomNav activeView="store" onChange={navigate} />;
}
