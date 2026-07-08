import fs from "node:fs";
import { createReceizClient } from "@receiz/sdk";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

function originFromEnv() {
  const raw =
    process.env.RECEIZ_WEBHOOK_PUBLIC_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "https://receiz.app";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withProtocol).origin;
}

function tenantHostFromOrigin(origin) {
  return process.env.RECEIZ_WEBHOOK_TENANT_HOST || new URL(origin).host;
}

function eventTypesFromEnv() {
  const configured = process.env.RECEIZ_WEBHOOK_EVENT_TYPES;
  if (configured) {
    return configured
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);
  }

  return [
    "checkout.session.created",
    "checkout.session.completed",
    "payment.created",
    "payment.settled",
    "payment.failed",
    "payment.refunded",
    "order.created",
    "reward.claimed",
    "asset.created",
    "asset.transferred",
    "proof.appended",
    "event_proof.created",
    "sports_card.scored",
    "wallet.ledger_entry",
    "note.claimed",
    "ownership.transferred",
    "market.trade",
    "profile.asset.visible_changed",
    "app_state.published",
    "world.campaign.sent"
  ];
}

function assertJsonResult(result) {
  if (typeof result === "string") {
    const preview = result.replace(/\s+/g, " ").slice(0, 220);
    throw new Error(`Receiz returned text instead of a webhook subscription JSON object: ${preview}`);
  }

  if (!result || typeof result !== "object") {
    throw new Error("Receiz returned an empty webhook subscription response.");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const accessToken = process.env.RECEIZ_ACCESS_TOKEN || process.env.RECEIZ_CONNECT_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error("Missing RECEIZ_ACCESS_TOKEN or RECEIZ_CONNECT_ACCESS_TOKEN for webhook subscription creation.");
}

const origin = originFromEnv();
const webhookUrl = process.env.RECEIZ_WEBHOOK_URL || `${origin}/api/receiz/webhook`;
const tenantHost = tenantHostFromOrigin(origin);
const eventTypes = eventTypesFromEnv();

const receiz = createReceizClient({
  baseUrl: process.env.RECEIZ_BASE_URL || "https://receiz.com",
  accessToken
});

const subscription = await receiz.events.subscribe({
  tenantHost,
  types: eventTypes,
  webhookUrl,
  idempotencyKey: process.env.RECEIZ_WEBHOOK_IDEMPOTENCY_KEY || `receiz-app-events:${tenantHost}:v1`
});

assertJsonResult(subscription);

console.log(
  JSON.stringify(
    {
      ok: true,
      tenantHost,
      webhookUrl,
      eventTypes,
      subscription
    },
    null,
    2
  )
);
