import { NextRequest, NextResponse } from "next/server";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { receizAuthorityRequired, receizRequestSession } from "@/lib/receiz/session";
import { parseCommerceImport, type CommerceImportSourceType } from "@/lib/import/commerce-importer";
import { fetchPublicImportSource, MAX_IMPORT_BYTES } from "@/lib/import/safe-source";
import { platform } from "@/lib/platform";

export const runtime = "nodejs";

const IMPORT_RECORD_SCHEMA = "receiz.app.content_import.v1";

function isSourceType(value: string): value is CommerceImportSourceType {
  return ["shopify", "wordpress", "woocommerce", "wix", "generic_site", "csv", "json"].includes(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Import failed";
}

export async function POST(request: NextRequest) {
  const requestSession = receizRequestSession(request);
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(requestHost);
  const accessToken = requestSession.cookieAccessToken;
  if (!accessToken || requestSession.sessionScope !== hostContext.storageKey) {
    return NextResponse.json(receizAuthorityRequired("/admin"), { status: 401 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMPORT_BYTES + 64_000) {
    return NextResponse.json({ ok: false, error: "import_source_too_large" }, { status: 413 });
  }
  const body = await request.json().catch(() => ({}));
  const sourceTypeValue = String(body.sourceType ?? "generic_site");
  const sourceType = isSourceType(sourceTypeValue) ? sourceTypeValue : "generic_site";
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const rawContent = typeof body.rawContent === "string" ? body.rawContent : "";
  if (Buffer.byteLength(rawContent, "utf8") > MAX_IMPORT_BYTES) {
    return NextResponse.json({ ok: false, error: "import_source_too_large" }, { status: 413 });
  }

  if (!sourceUrl && !rawContent.trim()) {
    return NextResponse.json({ ok: false, error: "missing_import_source" }, { status: 400 });
  }

  try {
    const payload = rawContent.trim() || (await fetchPublicImportSource(sourceUrl, `${platform.productName} importer`));
    const imported = parseCommerceImport({ sourceType, sourceUrl, payload });
    let receizRecord: unknown = { ok: false, skipped: true, error: "receiz_record_failed" };

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
          tenantHost: hostContext.tenantHost ?? hostContext.host,
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
