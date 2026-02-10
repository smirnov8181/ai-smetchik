import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield, ShieldCheck } from "lucide-react";
import { USDashboardLogout } from "@/components/us-dashboard-logout";

export default async function USDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/us/login");
  }

  return (
    <div className="min-h-screen bg-[#FAF4EC]">
      {/* Header */}
      <header className="border-b border-[#161616]/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/us/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#161616] rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#FAF4EC]" />
            </div>
            <span className="font-bold text-xl text-[#161616]">ContractorCheck</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/us/dashboard/verify/new">
              <button className="cursor-pointer flex items-center gap-2 bg-[#33C791] text-[#161616] font-semibold px-4 py-2 rounded-full text-sm hover:opacity-90 transition-all">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Check Estimate</span>
              </button>
            </Link>

            <USDashboardLogout />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
