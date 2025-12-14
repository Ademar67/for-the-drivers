import "./globals.css";
import { FirebaseClientProvider } from "@/firebase";

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
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
      </body>
    </html>
  );
}
