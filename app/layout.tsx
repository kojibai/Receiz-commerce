import type { Metadata, Viewport } from "next";
import { platform } from "@/lib/platform";
import { PwaController } from "@/features/pwa/PwaController";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: platform.productName,
  title: platform.productName,
  description: "Launch a proof-sealed ecommerce site with Receiz ID, checkout, rewards, assets, and domains.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Receiz.app"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Receiz.app"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07111f"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaController />
      </body>
    </html>
  );
}
