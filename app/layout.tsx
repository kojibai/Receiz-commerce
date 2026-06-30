import type { Metadata } from "next";
import { platform } from "@/lib/platform";
import "./globals.css";

export const metadata: Metadata = {
  title: platform.productName,
  description: "Launch a proof-sealed ecommerce site with Receiz ID, checkout, rewards, assets, and domains."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
