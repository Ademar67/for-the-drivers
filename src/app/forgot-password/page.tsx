import { redirect } from 'next/navigation';

export default function ForgotPasswordPage() {
  // Authentication is disabled. Redirect to the dashboard.
  redirect('/dashboard');
}
