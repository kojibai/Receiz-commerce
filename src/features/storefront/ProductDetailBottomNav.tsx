"use client";

import { useRouter } from "next/navigation";
import { BottomNav, type MobileView } from "@/features/storefront/StoreShell";

export function ProductDetailBottomNav() {
  const router = useRouter();

  const navigate = (view: MobileView) => {
    router.push(`/#${view}`);
  };

  return <BottomNav activeView="store" onChange={navigate} />;
}
