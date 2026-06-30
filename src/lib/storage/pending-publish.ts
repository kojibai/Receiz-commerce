export const PENDING_PUBLISH_SUFFIX = "pending-publish-v1";

export function pendingPublishStorageKey(storageKey: string) {
  return `${storageKey}:${PENDING_PUBLISH_SUFFIX}`;
}

export function shouldResumePendingPublish(search: string) {
  return new URLSearchParams(search).get("receiz") === "connected";
}
