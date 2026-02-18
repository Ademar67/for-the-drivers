import { redirect } from 'next/navigation';

export default function Page() {
  // Redirect directly to login as a primary entry point
  redirect('/login');
}
