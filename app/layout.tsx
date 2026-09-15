import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tamatchi",
  description: "A tiny digital cat that lives with you.",
  applicationName: "Tamatchi",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "Tamatchi",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#12141c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="manifest" href="/manifest.webmanifest" /><link rel="apple-touch-icon" href="/icon.svg" /></head><body>{children}</body></html>;
}
