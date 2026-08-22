import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v123 route boundaries", () => {
  it("publishes read-only canonical world planners", () => {
    const source = readFileSync("app/api/receiz/v123/world/route.ts", "utf8");
    assert.match(source, /planReceizWorldCommandCanonicalV123/);
    assert.match(source, /planReceizWorldTransactionCanonicalV123/);
    assert.match(source, /cache-control.*no-store/i);
    assert.doesNotMatch(source, /executeTransaction|executeMultiWorld/);
  });

  it("pins namespace resolution to authenticated exact heads", () => {
    const source = readFileSync("app/api/receiz/v123/subjects\/namespaces/route.ts", "utf8");
    assert.match(source, /parseReceizNamespaceResolutionV123/);
    assert.match(source, /resolveNamespaces/);
    assert.match(source, /cookieAccessToken/);
    assert.doesNotMatch(source, /privateKey|wrappingKey|receipt/);
  });

  it("exposes value recovery without accepting serialized proof authority", () => {
    const source = readFileSync("app/api/receiz/v123/value/route.ts", "utf8");
    assert.match(source, /executionByIdempotencyKey/);
    assert.match(source, /export async function GET/);
    assert.doesNotMatch(source, /export async function POST/);
    assert.doesNotMatch(source, /request\.json|exchangeProofAuthority|executeSettlement|executeReserve/);
  });
});
