import type { Metadata, Viewport } from "next";
import AppLayout from "./AppLayout";

export const metadata: Metadata = {
  title: "Liqui Moly Sales Hub",
  description: "Sales Hub for Liqui Moly team.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#0054A6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}