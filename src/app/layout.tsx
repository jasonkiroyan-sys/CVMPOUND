import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVMPOUND",
  description: "CVMPOUND gym — track your lifts, recognize equipment, train with an AI coach.",
  // Installable web app: when added to a phone's home screen it always
  // launches on the Equipment tab ("/"), regardless of which page was open.
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CVMPOUND" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
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
