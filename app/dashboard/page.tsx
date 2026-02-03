import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ShieldCheck } from "lucide-react";
import { EstimateCard } from "@/components/estimate-card";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Черновик", variant: "outline" },
  processing: { label: "Обработка...", variant: "secondary" },
  ready: { label: "Готово", variant: "default" },
  error: { label: "Ошибка", variant: "destructive" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estimates } = await supabase
    .from("estimates")
    .select("id, status, input_type, total_amount, created_at, input_text")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const { data: verifications } = await supabase
    .from("verifications")
    .select("id, status, total_contractor, overpay_amount, overpay_percent, is_paid, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const estimatesUsed = subscription?.estimates_used ?? 0;
  const estimatesLimit = subscription?.estimates_limit ?? 3;
  const plan = subscription?.plan ?? "free";

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Тариф</CardDescription>
            <CardTitle className="capitalize">{plan}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Использовано смет</CardDescription>
            <CardTitle>
              {estimatesUsed} / {plan === "business" ? "∞" : estimatesLimit}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Всего смет</CardDescription>
            <CardTitle>{estimates?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Estimates list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Мои сметы</h2>
          <Link href="/dashboard/estimates/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              Новая смета
            </Button>
          </Link>
        </div>

        {!estimates || estimates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Пока нет смет</h3>
              <p className="text-muted-foreground mb-4">
                Создайте первую смету — опишите проект или загрузите файлы
              </p>
              <Link href="/dashboard/estimates/new">
                <Button>Создать смету</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {estimates.map((estimate) => (
              <EstimateCard key={estimate.id} estimate={estimate} />
            ))}
          </div>
        )}
      </div>

      {/* Verifications list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Проверки смет</h2>
          <Link href="/dashboard/verify/new">
            <Button variant="outline">
              <ShieldCheck className="mr-1 h-4 w-4" />
              Проверить смету
            </Button>
          </Link>
        </div>

        {!verifications || verifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет проверок</h3>
              <p className="text-muted-foreground mb-4">
                Загрузите смету подрядчика — узнайте, не завышены ли цены
              </p>
              <Link href="/dashboard/verify/new">
                <Button variant="outline">Проверить смету</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => {
              const status = statusLabels[v.status] || statusLabels.draft;
              return (
                <Link key={v.id} href={`/dashboard/verify/${v.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                          Проверка от{" "}
                          {new Date(v.created_at).toLocaleDateString("ru-RU")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {v.total_contractor
                            ? `Смета: ${Number(v.total_contractor).toLocaleString("ru-RU")} руб.`
                            : "Обработка..."}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        {v.overpay_percent != null && Number(v.overpay_percent) > 0 && (
                          <span className="font-semibold text-red-600 whitespace-nowrap">
                            +{Number(v.overpay_percent).toFixed(0)}% переплата
                          </span>
                        )}
                        {v.is_paid && (
                          <Badge variant="outline">Оплачено</Badge>
                        )}
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
