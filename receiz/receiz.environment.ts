// @receiz-generated receiz.app.contract.v1
// Regenerate with receiz app apply; do not edit directly.

const requiredServerNames = ["RECEIZ_BASE_URL", "RECEIZ_CLIENT_ID", "RECEIZ_CLIENT_SECRET", "RECEIZ_REDIRECT_URI"] as const;
export function receizEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const missing = requiredServerNames.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing Receiz environment: ${missing.join(", ")}`);
  return Object.fromEntries(requiredServerNames.map((name) => [name, env[name]!])) as Record<(typeof requiredServerNames)[number], string>;
}
