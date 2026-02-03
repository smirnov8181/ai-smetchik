import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { FileText, Plus, LogOut, ShieldCheck } from "lucide-react";

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
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">AI Сметчик</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/estimates/new">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Новая смета
              </Button>
            </Link>
            <Link href="/dashboard/verify/new">
              <Button size="sm" variant="outline">
                <ShieldCheck className="mr-1 h-4 w-4" />
                Проверить смету
              </Button>
            </Link>
            <form
              action={async () => {
                "use server";
                const supabase = await createClient();
                await supabase.auth.signOut();
                redirect("/login");
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-1 h-4 w-4" />
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
