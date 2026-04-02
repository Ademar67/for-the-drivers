import { AuthGate } from "@/components/auth/AuthGate";
import { ToastProvider } from "@/components/ui/toast-provider";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGate>
      <ToastProvider>
        <div className="min-h-screen">{children}</div>
      </ToastProvider>
    </AuthGate>
  );
}