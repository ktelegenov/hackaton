import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contractor Vision",
  description: "Generate renovation concepts from listing URLs."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
