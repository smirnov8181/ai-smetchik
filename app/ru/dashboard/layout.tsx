import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardAuthGate } from "@/components/dashboard-auth-gate";
import { FooterRu } from "@/components/footer-ru";

async function handleLogout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ru");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF4EC] flex flex-col">
      <DashboardHeader onLogout={handleLogout} />
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-8 pb-20 w-full">
        <DashboardAuthGate>{children}</DashboardAuthGate>
      </main>
      <FooterRu />
    </div>
  );
}
