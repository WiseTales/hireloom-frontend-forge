import type { Metadata } from "next";
// @ts-ignore - CSS import handled by Next.js
import "./globals.css";

export const metadata: Metadata = {
  title: "Hireloom Careers",
  description: "Multi-tenant career portals platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
