import { describeReceizCapabilities, type ReceizCapabilityKey } from "@receiz/sdk";

export type ReceizSdkCapabilities = {
  twin: boolean;
  world: boolean;
};

export const receizCapabilityDescriptor = describeReceizCapabilities();

function sdkRailReady(rail: Extract<ReceizCapabilityKey, "twin" | "world">) {
  return receizCapabilityDescriptor.rails.some(
    (candidate) => candidate.key === rail && candidate.stability === "stable" && candidate.compatibility.browser
  );
}

export const receizSdkCapabilities: ReceizSdkCapabilities = {
  twin: process.env.NEXT_PUBLIC_RECEIZ_TWIN_ENABLED !== "false" && sdkRailReady("twin"),
  world: process.env.NEXT_PUBLIC_RECEIZ_WORLD_ENABLED !== "false" && sdkRailReady("world")
};

export function hasReceizTwinCapability() {
  return receizSdkCapabilities.twin || receizSdkCapabilities.world;
}
