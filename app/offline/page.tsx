import Link from "next/link";
import { BrandMark, StatusPill } from "@/components/ui";
import { platform } from "@/lib/platform";

export default function OfflinePage() {
  return (
    <main className="detail-shell offline-shell">
      <section className="article-detail offline-card">
        <BrandMark label="receiz" compact />
        <StatusPill tone="neutral">Offline</StatusPill>
        <h1>{platform.name} is ready when the network returns</h1>
        <p className="article-excerpt">
          Storefront pages you opened are available offline. Receiz login, checkout, payments, hosting, and proof writes stay online-only so sealed actions are never queued unsafely.
        </p>
        <Link className="detail-primary-action" href="/">Open cached storefront</Link>
      </section>
    </main>
  );
}
