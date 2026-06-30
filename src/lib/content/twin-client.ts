import type { TwinAssistInput, TwinAssistResult } from "@/lib/content/twin-assist";

export async function requestTwinAssist(input: TwinAssistInput): Promise<TwinAssistResult> {
  const response = await fetch("/api/content/twin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && typeof payload.connectUrl === "string") {
    window.location.assign(payload.connectUrl);
    throw new Error("Receiz login required");
  }

  if (!response.ok || payload.ok === false || !payload.draft) {
    throw new Error(String(payload.message ?? payload.error ?? "Receiz Twin assist failed"));
  }

  return payload.draft as TwinAssistResult;
}
