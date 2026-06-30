import { platform } from "../platform";

export type PwaManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
};

export type PwaManifestShortcut = {
  name: string;
  short_name: string;
  description?: string;
  url: string;
  icons?: PwaManifestIcon[];
};

export type PwaManifest = {
  name: string;
  short_name: string;
  description: string;
  id: string;
  start_url: string;
  scope: string;
  display: "standalone";
  orientation: "portrait-primary";
  background_color: string;
  theme_color: string;
  categories: string[];
  icons: PwaManifestIcon[];
  shortcuts: PwaManifestShortcut[];
};

const icon = (size: number, purpose = "any maskable"): PwaManifestIcon => ({
  src: `/icons/icon-${size}.png`,
  sizes: `${size}x${size}`,
  type: "image/png",
  purpose
});

export function buildPwaManifest(): PwaManifest {
  const shortcutIcon = [icon(192)];

  return {
    name: platform.productName,
    short_name: "Receiz.app",
    description: "Installable proof-sealed commerce, rewards, checkout, domains, and admin studio powered by Receiz.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7fbfa",
    theme_color: "#07111f",
    categories: ["business", "shopping", "productivity"],
    icons: [icon(180), icon(192), icon(512)],
    shortcuts: [
      {
        name: "Admin Studio",
        short_name: "Admin",
        description: "Open the no-code commerce console.",
        url: "/admin",
        icons: shortcutIcon
      },
      {
        name: "Products",
        short_name: "Products",
        description: "Open the public product catalog.",
        url: "/products",
        icons: shortcutIcon
      },
      {
        name: "Journal",
        short_name: "Blog",
        description: "Open the brand blog and proof content.",
        url: "/blog",
        icons: shortcutIcon
      }
    ]
  };
}
