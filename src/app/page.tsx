import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Redirect to dashboard since all pages now require authentication
  redirect('/dashboard');
}