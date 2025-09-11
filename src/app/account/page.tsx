import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountManagement } from "@/components/account/AccountManagement";

export default async function AccountPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AccountManagement user={user} />
    </div>
  );
}
