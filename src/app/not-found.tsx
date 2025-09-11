import { redirect } from 'next/navigation';

export default function NotFound() {
  // Redirect to sign-in page for 404 errors
  redirect('/sign-in');
}
