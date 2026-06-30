import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";
import { Icons } from "@/components/icons";
import type { Product, ProofEvent, Reward } from "@/types/domain";

export function Button({
  children,
  className,
  variant = "secondary",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
}) {
  return (
    <button className={cx("button", `button-${variant}`, className)} {...props}>
      {children}
    </button>
  );
}

export function StatusPill({
  children,
  tone = "green"
}: {
  children: ReactNode;
  tone?: "green" | "gold" | "neutral" | "pink";
}) {
  return <span className={cx("status-pill", `status-${tone}`)}>{children}</span>;
}

export function Panel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
}) {
  return (
    <section className={cx("panel", className)} {...props}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  action
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function BrandMark({
  label = "boost",
  compact = false
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={cx("brand-mark", compact && "brand-mark-compact")}>
      <span>{label}</span>
      <small>coffee</small>
    </div>
  );
}

export function ProductVisual({ product }: { product: Pick<Product, "imageTone" | "name"> }) {
  if (product.imageTone === "mug") {
    return (
      <div className="product-visual mug-visual">
        <div className="mug-cup">
          <span>boost</span>
        </div>
      </div>
    );
  }

  if (product.imageTone === "can") {
    return (
      <div className="product-visual can-visual">
        <div className="can-body">
          <span>boost</span>
        </div>
      </div>
    );
  }

  if (product.imageTone === "card" || product.imageTone === "access") {
    return (
      <div className="product-visual card-visual">
        <BrandMark label="boost" />
      </div>
    );
  }

  if (product.imageTone === "class") {
    return (
      <div className="product-visual class-visual">
        <div className="photo-strip" />
        <span>Brew Class</span>
      </div>
    );
  }

  return (
    <div className="product-visual bag-visual">
      <div className="bag-top" />
      <div className="bag-label">
        <span>boost</span>
        <small>whole bean</small>
      </div>
    </div>
  );
}

export function RewardCard({ reward }: { reward: Reward }) {
  const progress = Math.min(100, Math.round((reward.progress / reward.target) * 100));

  return (
    <div className="reward-card">
      <BrandMark label="boost" />
      <div className="reward-copy">
        <StatusPill tone="gold">Active</StatusPill>
        <h3>{reward.name}</h3>
        <p>{reward.description}</p>
        <span>{reward.requirement}</span>
      </div>
      <div className="progress-wrap">
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <strong>
          {reward.progress} / {reward.target}
        </strong>
      </div>
    </div>
  );
}

export function SealEventTimeline({ events }: { events: ProofEvent[] }) {
  const toneFor = (type: ProofEvent["type"]) => {
    if (type.includes("REWARD")) return "event-reward";
    if (type.includes("ASSET")) return "event-asset";
    if (type.includes("GAME")) return "event-game";
    if (type.includes("ORDER")) return "event-order";
    return "event-object";
  };

  return (
    <div className="event-list">
      {events.slice(0, 5).map((event) => (
        <div className="event-row" key={event.id}>
          <span className={cx("event-icon", toneFor(event.type))}>
            <Icons.seal size={15} />
          </span>
          <div>
            <strong>{event.title}</strong>
            <p>{event.detail}</p>
          </div>
          <small>{event.timestampLabel}</small>
        </div>
      ))}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {delta ? <small>{delta}</small> : null}
    </div>
  );
}
