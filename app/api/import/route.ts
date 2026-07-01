import { NextRequest, NextResponse } from "next/server";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizAccessTokenFromRequest } from "@/lib/receiz/session";
import { parseCommerceImport, type CommerceImportSourceType } from "@/lib/import/commerce-importer";
import { platform } from "@/lib/platform";

export const runtime = "nodejs";

const IMPORT_RECORD_SCHEMA = "receiz.app.content_import.v1";

function isSourceType(value: string): value is CommerceImportSourceType {
  return ["shopify", "wordpress", "woocommerce", "wix", "generic_site", "csv", "json"].includes(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Import failed";
}

async function fetchSource(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json,text/csv,text/html;q=0.9,*/*;q=0.8",
        "user-agent": `${platform.productName} importer`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Source returned ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const sourceTypeValue = String(body.sourceType ?? "generic_site");
  const sourceType = isSourceType(sourceTypeValue) ? sourceTypeValue : "generic_site";
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const rawContent = typeof body.rawContent === "string" ? body.rawContent : "";

  if (!sourceUrl && !rawContent.trim()) {
    return NextResponse.json({ ok: false, error: "missing_import_source" }, { status: 400 });
  }

  try {
    const payload = rawContent.trim() || (await fetchSource(sourceUrl));
    const imported = parseCommerceImport({ sourceType, sourceUrl, payload });
    const accessToken = receizAccessTokenFromRequest(request);
    let receizRecord: unknown = { ok: false, skipped: true, error: "receiz_authority_required" };

    if (accessToken) {
      try {
        const receiz = createReceizCommerceAdapter({
          baseUrl: process.env.RECEIZ_BASE_URL,
          accessToken
        });
        receizRecord = await receiz.connectRecord({
          schema: IMPORT_RECORD_SCHEMA,
          sourceType,
          sourceUrl: sourceUrl || null,
          importedAt: new Date().toISOString(),
          summary: imported.summary,
          warnings: imported.warnings
        });
      } catch (error) {
        receizRecord = { ok: false, error: errorMessage(error) };
      }
    }

    return NextResponse.json({
      ok: true,
      imported,
      receizRecord
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "import_failed",
        message: errorMessage(error)
      },
      { status: 400 }
    );
  }
}
