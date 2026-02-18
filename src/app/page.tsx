import { redirect } from 'next/navigation';

export default function Page() {
  // Redirect to the dashboard as the main entry point.
  redirect('/dashboard');
}
