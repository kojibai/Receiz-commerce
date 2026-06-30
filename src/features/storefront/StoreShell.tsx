"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { BrandMark, Button, StatusPill } from "@/components/ui";
import type { CommerceState } from "@/types/domain";
import { cx } from "@/lib/utils";

const primaryNav = [
  ["Storefront", Icons.home],
  ["Products", Icons.products],
  ["Rewards", Icons.rewards],
  ["Assets", Icons.assets],
  ["Play", Icons.game],
  ["Account", Icons.user],
  ["Admin", Icons.settings]
] as const;

const secondaryNav = [
  ["Orders", Icons.orders, "24"],
  ["Customers", Icons.users, ""],
  ["Discounts", Icons.gift, ""],
  ["Analytics", Icons.analytics, ""],
  ["Settings", Icons.settings, ""]
] as const;

export function StoreSidebar({ state }: { state: CommerceState }) {
  return (
    <aside className="sidebar">
      <Link className="kit-logo" href="/">
        <span className="receiz-mark">
          <Icons.receiz size={23} />
        </span>
        <strong>Receiz Commerce Kit</strong>
      </Link>

      <nav className="nav-stack" aria-label="Primary">
        {primaryNav.map(([label, Icon], index) => (
          label === "Admin" ? (
            <Link className="nav-link" href="/admin" key={label}>
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ) : (
            <a className={cx("nav-link", index === 0 && "active")} href={`#${label.toLowerCase()}`} key={label}>
              <Icon size={19} />
              <span>{label}</span>
            </a>
          )
        ))}
      </nav>

      <nav className="nav-stack nav-secondary" aria-label="Operations">
        {secondaryNav.map(([label, Icon, count]) => (
          <Link className="nav-link" href="/admin" key={label}>
            <Icon size={18} />
            <span>{label}</span>
            {count ? <em>{count}</em> : null}
          </Link>
        ))}
      </nav>

      <a className="fork-card" href="https://github.com" target="_blank" rel="noreferrer">
        <Icons.github size={23} />
        <strong>Fork this template</strong>
      </a>

      <div className="plan-card">
        <div>
          <strong>Pro plan</strong>
          <span>Manage plan</span>
        </div>
        <p>18 / 50K proofs</p>
        <div className="progress-bar">
          <span style={{ width: "36%" }} />
        </div>
      </div>
    </aside>
  );
}

export function StoreTopbar({ state }: { state: CommerceState }) {
  return (
    <header className="topbar">
      <label className="search-box">
        <Icons.search size={18} />
        <input placeholder="Search products, collections, rewards..." />
      </label>
      <div className="topbar-actions">
        <div className="domain-chip">
          <Icons.globe size={17} />
          <div>
            <strong>{state.hosting.subdomain}</strong>
            <span>Custom domain ready</span>
          </div>
          <Icons.chevronDown size={16} />
        </div>
        <StatusPill tone="green">● Receiz ID connected</StatusPill>
        <button aria-label="Open help" className="icon-button" type="button">
          <Icons.help size={18} />
        </button>
        <button aria-label="View notifications" className="icon-button notification" type="button">
          <Icons.bell size={18} />
          <span>3</span>
        </button>
        <Link className="brand-chip" href="/admin">
          <BrandMark label={state.brand.logoText} compact />
          <div>
            <strong>{state.brand.name}</strong>
            <span>View storefront</span>
          </div>
          <Icons.chevronDown size={16} />
        </Link>
      </div>
    </header>
  );
}

export function MobileHeader({ state }: { state: CommerceState }) {
  return (
    <header className="mobile-header">
      <BrandMark label={state.brand.logoText} compact />
      <div>
        <strong>{state.brand.name}</strong>
        <span>
          <Icons.seal size={15} /> Proof-sealed commerce
        </span>
      </div>
      <div className="mobile-domain">
        <strong>{state.hosting.subdomain}</strong>
            <span>Receiz ID ready</span>
      </div>
      <button aria-label="Open account" className="icon-button" type="button">
        <Icons.user size={21} />
      </button>
      <button aria-label="Open menu" className="icon-button" type="button">
        <Icons.menu size={24} />
      </button>
    </header>
  );
}

export type MobileView = "store" | "rewards" | "assets" | "play" | "account";

export function BottomNav({
  activeView,
  onChange
}: {
  activeView: MobileView;
  onChange: (view: MobileView) => void;
}) {
  const items = [
    ["store", "Store", Icons.store],
    ["rewards", "Rewards", Icons.gift],
    ["assets", "Assets", Icons.assets],
    ["play", "Play", Icons.game],
    ["account", "Account", Icons.user]
  ] as const;

  return (
    <nav className="bottom-nav" aria-label="Mobile">
      {items.map(([view, label, Icon]) => (
        <button
          aria-label={`Open ${label} tab`}
          aria-pressed={activeView === view}
          className={cx(activeView === view && "active")}
          key={view}
          onClick={() => onChange(view)}
          type="button"
        >
          <Icon size={24} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function HeroProduct({
  state,
  onSeal,
  onCheckout
}: {
  state: CommerceState;
  onSeal: () => void;
  onCheckout: () => void;
}) {
  return (
    <section className="hero-panel">
      <div className="hero-brand-card">
        <BrandMark label={state.brand.logoText} />
      </div>
      <div className="hero-copy">
        <h1>{state.brand.name}</h1>
        <p>{state.storefront.heroBody}</p>
        <div className="hero-meta">
          <span>● Receiz enabled</span>
          <span>
            <Icons.seal size={16} /> Verified store
          </span>
          <span>★ 4.9 (342 reviews)</span>
        </div>
        <div className="hero-actions">
          <Button onClick={onCheckout} variant="primary">
            {state.storefront.ctaLabel}
          </Button>
          <Button onClick={onSeal} variant="outline">
            Connect Receiz
          </Button>
        </div>
      </div>
      <div className="hero-product-art">
        <div className="coffee-bag">
          <span>{state.brand.logoText}</span>
          <small>House Blend<br />Whole Bean</small>
        </div>
        <div className="coffee-mug">
          <span>{state.brand.logoText}</span>
        </div>
        <div className="beans beans-a" />
        <div className="beans beans-b" />
      </div>
    </section>
  );
}
