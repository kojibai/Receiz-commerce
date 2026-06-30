import type { TwinAssistInput, TwinAssistResult } from "@/lib/content/twin-assist";

export async function requestTwinAssist(input: TwinAssistInput): Promise<TwinAssistResult> {
  const response = await fetch("/api/content/twin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    throw new Error(String(payload.message ?? "Use Receiz ID inside this app before asking Twin."));
  }

  if (!response.ok || payload.ok === false || !payload.draft) {
    throw new Error(String(payload.message ?? payload.error ?? "Receiz Twin assist failed"));
  }

  return payload.draft as TwinAssistResult;
}
