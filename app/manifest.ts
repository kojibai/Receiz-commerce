import type { MetadataRoute } from "next";
import { buildPwaManifest } from "@/lib/pwa/manifest";

export default function manifest(): MetadataRoute.Manifest {
  return buildPwaManifest() as MetadataRoute.Manifest;
}
