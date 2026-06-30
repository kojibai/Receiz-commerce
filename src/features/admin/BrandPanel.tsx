"use client";

import { BrandMark, Button, Panel, SectionHeader } from "@/components/ui";
import type { CommerceState } from "@/types/domain";

export function BrandPanel({
  state,
  onBrandUpdate,
  onSaveTheme
}: {
  state: CommerceState;
  onBrandUpdate: (value: Partial<CommerceState["brand"]>) => void;
  onSaveTheme: () => void;
}) {
  return (
    <Panel className="admin-panel brand-panel">
      <SectionHeader title="Brand theme" action={<Button onClick={onSaveTheme} variant="outline">Save theme</Button>} />
      <div className="brand-editor">
        <div>
          <span className="field-label">Logo</span>
          <div className="logo-edit-row">
            <BrandMark label={state.brand.logoText} />
            <label className="logo-text-field">
              <span>Logo text</span>
              <input value={state.brand.logoText} onChange={(event) => onBrandUpdate({ logoText: event.target.value })} />
            </label>
          </div>
          <label>
            <span>Brand name</span>
            <input value={state.brand.name} onChange={(event) => onBrandUpdate({ name: event.target.value })} />
          </label>
          <label>
            <span>Tagline</span>
            <input value={state.brand.tagline} onChange={(event) => onBrandUpdate({ tagline: event.target.value })} />
          </label>
          <label>
            <span>Font</span>
            <select value={state.brand.fontFamily} onChange={(event) => onBrandUpdate({ fontFamily: event.target.value })}>
              <option>Inter</option>
              <option>Geist</option>
              <option>System</option>
              <option>Editorial</option>
            </select>
          </label>
          <label>
            <span>Corner radius</span>
            <select
              value={state.brand.cornerRadius}
              onChange={(event) => onBrandUpdate({ cornerRadius: event.target.value as CommerceState["brand"]["cornerRadius"] })}
            >
              <option value="compact">Compact</option>
              <option value="balanced">Balanced</option>
              <option value="soft">Soft</option>
            </select>
          </label>
          <label>
            <span>Button style</span>
            <select
              value={state.brand.buttonStyle}
              onChange={(event) => onBrandUpdate({ buttonStyle: event.target.value as CommerceState["brand"]["buttonStyle"] })}
            >
              <option value="filled">Filled</option>
              <option value="outline">Outline</option>
              <option value="minimal">Minimal</option>
            </select>
          </label>
        </div>
        <div className="color-list">
          {[
            ["Primary", state.brand.primaryColor],
            ["Secondary", state.brand.secondaryColor],
            ["Accent", state.brand.accentColor],
            ["Neutral", state.brand.neutralColor],
            ["Background", state.brand.backgroundColor]
          ].map(([label, color]) => {
            const key = `${label.toLowerCase()}Color` as keyof CommerceState["brand"];
            return (
            <div className="color-row" key={label}>
              <span style={{ background: color }} />
              <strong>{label}</strong>
              <input
                aria-label={`${label} color`}
                type="color"
                value={color}
                onChange={(event) => onBrandUpdate({ [key]: event.target.value } as Partial<CommerceState["brand"]>)}
              />
              <em>{color}</em>
            </div>
          );
          })}
        </div>
      </div>
    </Panel>
  );
}
