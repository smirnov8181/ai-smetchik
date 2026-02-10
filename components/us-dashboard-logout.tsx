"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function USDashboardLogout() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/us/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer flex items-center gap-2 text-[#161616]/70 hover:text-[#161616] font-medium px-3 py-2 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
