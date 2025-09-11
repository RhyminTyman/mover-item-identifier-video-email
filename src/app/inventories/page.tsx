import { redirect } from 'next/navigation';

export default function InventoriesPage() {
  // Redirect to dashboard since all pages now require authentication
  redirect('/dashboard');
}
