"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Shield, Plus, ShieldCheck, LogOut, Loader2 } from "lucide-react";

export default function USDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/us/login");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/us/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF4EC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D8DFF]" />
      </div>
    );
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

            <button
              onClick={handleLogout}
              className="cursor-pointer flex items-center gap-2 text-[#161616]/70 hover:text-[#161616] font-medium px-3 py-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
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
