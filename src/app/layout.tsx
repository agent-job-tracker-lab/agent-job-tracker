import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Job Tracker",
  description: "Agent Job Tracker development environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
