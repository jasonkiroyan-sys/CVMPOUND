import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVMPOUND",
  description: "CVMPOUND gym — track your lifts, recognize equipment, train with an AI coach.",
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
