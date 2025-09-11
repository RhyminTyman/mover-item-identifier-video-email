import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/user";
import { CustomerDashboard } from "@/components/dashboard/CustomerDashboard";
import { SalesDashboard } from "@/components/dashboard/SalesDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const userRole = await getUserRole(user.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {userRole === "customer" && <CustomerDashboard />}
      {userRole === "sales" && <SalesDashboard />}
      {userRole === "admin" && <AdminDashboard />}
    </div>
  );
}
