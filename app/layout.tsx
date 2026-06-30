import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receiz Commerce Kit",
  description: "Proof-sealed commerce, rewards, assets, and optional reward games."
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
