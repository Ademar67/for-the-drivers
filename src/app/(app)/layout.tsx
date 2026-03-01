import { AuthGate } from '@/components/auth/AuthGate';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate>{children}</AuthGate>;
}