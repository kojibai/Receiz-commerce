import type { ReceizPortableExecutionTransitionRecoveryV124 } from "@receiz/sdk";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { receizOAuthSecret } from "../receiz/oauth-state";
import type { NativeReserveQuote } from "./native-reserve-execution";

const PURPOSE = "receiz-native-reserve-checkout-custody:v1";
export const MAX_NATIVE_RESERVE_TOKEN_LENGTH = 750_000;
export type NativeReserveCoordinates = Readonly<{
  schema: "receiz.app.native_reserve_coordinates.v1";
  quote: NativeReserveQuote;
  recovery: ReceizPortableExecutionTransitionRecoveryV124;
}>;
function key(secret: string) {
  if (!secret.trim()) throw new Error("reserve_checkout_secret_required");
  return createHash("sha256").update(PURPOSE).update("\0").update(secret).digest();
}

/** Encrypted transport for all original sources, not a payment assertion.
 * Every use must independently recover the complete sources through the SDK. */
export function encodeNativeReserveCoordinates(value: NativeReserveCoordinates, secret = receizOAuthSecret()) {
  const bytes = Buffer.from(JSON.stringify(value));
  if (bytes.length > 550_000) throw new Error("reserve_checkout_recovery_too_large");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  cipher.setAAD(Buffer.from(PURPOSE));
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const token = ["nr1", iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
  if (token.length > MAX_NATIVE_RESERVE_TOKEN_LENGTH) throw new Error("reserve_checkout_recovery_too_large");
  return token;
}

export function readNativeReserveCoordinates(token: string, secret = receizOAuthSecret()): NativeReserveCoordinates {
  if (typeof token !== "string" || token.length > MAX_NATIVE_RESERVE_TOKEN_LENGTH) throw new Error("reserve_checkout_recovery_invalid");
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "nr1" || parts.slice(1).some(part => !/^[A-Za-z0-9_-]+$/.test(part))) {
    throw new Error("reserve_checkout_recovery_invalid");
  }
  try {
    const iv = Buffer.from(parts[1], "base64url"), tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16) throw new Error("invalid_envelope");
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAAD(Buffer.from(PURPOSE));
    decipher.setAuthTag(tag);
    const value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[2], "base64url")), decipher.final()]).toString("utf8"));
    if (!value || value.schema !== "receiz.app.native_reserve_coordinates.v1" || !value.quote || !value.recovery) throw new Error("invalid_envelope");
    return value;
  } catch { throw new Error("reserve_checkout_recovery_invalid"); }
}
