import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";

async function handleLogout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ru/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ru/login");
  }

  return (
    <div className="min-h-screen bg-[#FAF4EC]">
      <DashboardHeader onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
