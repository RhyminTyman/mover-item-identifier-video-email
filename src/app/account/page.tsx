import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountManagement } from "@/components/account/AccountManagement";

export default async function AccountPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AccountManagement />
    </div>
  );
}
