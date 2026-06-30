"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { CommerceImportInput, CommerceImportResult, CommerceImportSourceType } from "@/lib/import/commerce-importer";

const sourceTypes: Array<{ value: CommerceImportSourceType; label: string; hint: string }> = [
  { value: "shopify", label: "Shopify", hint: "Paste products.json or export JSON." },
  { value: "wordpress", label: "WordPress", hint: "Import WP posts, pages, and Woo products." },
  { value: "woocommerce", label: "WooCommerce", hint: "Import Woo product JSON." },
  { value: "wix", label: "Wix", hint: "Import public site metadata and JSON-LD." },
  { value: "generic_site", label: "Any website", hint: "Import product/article JSON-LD and page metadata." },
  { value: "csv", label: "CSV", hint: "Import title, description, price, inventory." },
  { value: "json", label: "JSON", hint: "Auto-normalize common product/content exports." }
];

export function CommerceImportPanel({
  onImport
}: {
  onImport: (input: Omit<CommerceImportInput, "payload"> & { rawContent?: string }) => Promise<CommerceImportResult>;
}) {
  const [sourceType, setSourceType] = useState<CommerceImportSourceType>("shopify");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CommerceImportResult | null>(null);
  const [error, setError] = useState("");
  const activeType = sourceTypes.find((item) => item.value === sourceType) ?? sourceTypes[0]!;

  const runImport = async () => {
    setImporting(true);
    setError("");

    try {
      const imported = await onImport({ sourceType, sourceUrl, rawContent });
      setResult(imported);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Panel className="admin-panel commerce-import-panel">
      <SectionHeader
        title="Import existing site"
        action={<StatusPill tone={result ? "green" : "neutral"}>{result ? "Imported" : "Migration"}</StatusPill>}
      />
      <div className="import-source-grid">
        {sourceTypes.map((item) => (
          <button
            className={sourceType === item.value ? "import-source-card active" : "import-source-card"}
            key={item.value}
            onClick={() => setSourceType(item.value)}
            type="button"
          >
            <Icons.external size={16} />
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>
      <div className="builder-field-grid">
        <label className="builder-field">
          <span>Source URL</span>
          <input
            placeholder={
              sourceType === "shopify"
                ? "https://brand.myshopify.com/products.json"
                : sourceType === "wordpress"
                  ? "https://brand.com/wp-json/wp/v2/posts"
                  : "https://brand.com"
            }
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </label>
        <label className="builder-field">
          <span>Import type</span>
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value as CommerceImportSourceType)}>
            {sourceTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="builder-field">
        <span>Paste export content</span>
        <textarea
          placeholder={`${activeType.label} export JSON, CSV, or site HTML. Use this when the source blocks automated fetching.`}
          rows={6}
          value={rawContent}
          onChange={(event) => setRawContent(event.target.value)}
        />
      </label>
      {error ? <p className="import-error">{error}</p> : null}
      {result ? (
        <div className="import-result-grid">
          <div><strong>{result.summary.products}</strong><span>Products</span></div>
          <div><strong>{result.summary.blogPosts}</strong><span>Posts</span></div>
          <div><strong>{result.summary.pages}</strong><span>Pages</span></div>
        </div>
      ) : null}
      <div className="import-action-row">
        <p>Imports are staged into your store builders so you can edit, Receiz seal, and publish them to your hosted site.</p>
        <Button disabled={importing || (!sourceUrl && !rawContent.trim())} onClick={runImport} variant="primary">
          {importing ? "Importing..." : "Import content"}
        </Button>
      </div>
    </Panel>
  );
}
