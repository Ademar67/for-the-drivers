import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata = {
  title: "Liqui Moly Sales Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">{children}</div>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
