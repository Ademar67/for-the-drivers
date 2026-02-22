import type { Metadata, Viewport } from "next";
import AppLayout from './AppLayout';

export const metadata: Metadata = {
  title: "Liqui Moly Sales Hub",
  description: "Sales Hub for Liqui Moly team.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Liqui Moly Sales Hub",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
