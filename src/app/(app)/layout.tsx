import { AuthGate } from "@/components/auth/AuthGate";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGate>
      <div className="min-h-screen">
        {children}
      </div>
    </AuthGate>
  );
}