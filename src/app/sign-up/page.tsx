import { redirect } from 'next/navigation';

export default function SignUpPage() {
  // Authentication is disabled. Redirect to the dashboard.
  redirect('/dashboard');
}
