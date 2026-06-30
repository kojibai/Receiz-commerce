"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icons } from "@/components/icons";
import { BrandMark, Button } from "@/components/ui";
import type { CommerceState } from "@/types/domain";
import { cx } from "@/lib/utils";
import { brandThemeStyle } from "@/lib/theme";

const nav = [
  ["Dashboard", Icons.home],
  ["Brand", Icons.palette],
  ["Pages", Icons.pages],
  ["Navigation", Icons.sliders],
  ["Products", Icons.products],
  ["Collections", Icons.collections],
  ["Rewards", Icons.rewards],
  ["Assets", Icons.image],
  ["Game", Icons.game],
  ["Customers", Icons.users],
  ["Orders", Icons.orders],
  ["Receiz", Icons.receiz],
  ["Checkout", Icons.creditCard],
  ["Hosting", Icons.globe],
  ["Domains", Icons.lock],
  ["Analytics", Icons.analytics],
  ["Settings", Icons.settings],
  ["Developer", Icons.code]
] as const;

export function AdminShell({
  state,
  children,
  onPublish
}: {
  state: CommerceState;
  children: ReactNode;
  onPublish: () => void;
}) {
  return (
    <main className="admin-app" style={brandThemeStyle(state.brand)}>
      <aside className="sidebar admin-sidebar">
        <Link className="kit-logo" href="/">
          <span className="receiz-mark">
            <Icons.receiz size={23} />
          </span>
          <span>
            <strong>Receiz Commerce Kit</strong>
            <small>Admin Studio</small>
          </span>
        </Link>
        <nav className="nav-stack">
          {nav.map(([label, Icon], index) => (
            <a className={cx("nav-link", index === 0 && "active")} href={`#${label.toLowerCase()}`} key={label}>
              <Icon size={18} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <a className="fork-card" href="https://github.com" target="_blank" rel="noreferrer">
          <Icons.github size={23} />
          <strong>Fork this template</strong>
        </a>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <Link className="brand-selector" href="/">
            <BrandMark label={state.brand.logoText} compact />
            <strong>{state.brand.name}</strong>
            <Icons.chevronDown size={16} />
          </Link>
          <div className="admin-top-actions">
            <Link className="button button-outline" href="/">
              Preview storefront <Icons.external size={15} />
            </Link>
            <Button onClick={onPublish} variant="primary">
              Publish changes <Icons.chevronDown size={15} />
            </Button>
            <button aria-label="Open help" className="icon-button" type="button">
              <Icons.help size={18} />
            </button>
            <button aria-label="View notifications" className="icon-button notification" type="button">
              <Icons.bell size={18} />
              <span>1</span>
            </button>
            <div className="admin-user">
              <div className="avatar">AM</div>
              <div>
                <strong>{state.auth.admin.name}</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
