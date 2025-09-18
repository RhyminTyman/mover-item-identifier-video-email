import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Redirect to dashboard - it will handle onboarding flow
  redirect('/dashboard');
}