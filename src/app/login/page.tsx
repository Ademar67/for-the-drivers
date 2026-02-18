import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Authentication is disabled. Redirect to the dashboard.
  redirect('/dashboard');
}
