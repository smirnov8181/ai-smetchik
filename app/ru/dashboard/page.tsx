import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, FileText, ShieldCheck, ArrowRight } from "lucide-react";
import { EstimateCard } from "@/components/estimate-card";
import { VerificationCard } from "@/components/verification-card";
import {
  AnimatedStatsGrid,
  AnimatedStatCard,
  AnimatedSectionHeader,
  AnimatedCardList,
  AnimatedCardItem,
  AnimatedEmptyState,
} from "@/components/dashboard-animations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: estimates } = await supabase
    .from("estimates")
    .select("id, status, input_type, total_amount, created_at, input_text")
    .eq("user_id", user!.id)
    .eq("region", "moscow")
    .order("created_at", { ascending: false });

  const { data: verifications } = await supabase
    .from("verifications")
    .select("id, status, total_contractor, overpay_amount, overpay_percent, is_paid, created_at")
    .eq("user_id", user!.id)
    .eq("region", "moscow")
    .order("created_at", { ascending: false });

  // Calculate stats
  const estimateCount = estimates?.length ?? 0;
  const verificationCount = verifications?.length ?? 0;
  const totalOverpayFound = (verifications ?? [])
    .filter((v) => v.overpay_amount && v.overpay_amount > 0)
    .reduce((sum, v) => sum + (v.overpay_amount || 0), 0);
  const maxOverpayPercent = Math.max(
    0,
    ...(verifications ?? []).map((v) => v.overpay_percent || 0)
  );

  return (
    <div className="space-y-8">
      {/* Stats */}
      <AnimatedStatsGrid>
        <AnimatedStatCard>
          <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#0D8DFF]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#0D8DFF]" />
              </div>
              <span className="text-sm text-[#161616]/50">Создано смет</span>
            </div>
            <p className="text-2xl font-bold text-[#161616]">{estimateCount}</p>
          </div>
        </AnimatedStatCard>

        <AnimatedStatCard>
          <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#33C791]/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#33C791]" />
              </div>
              <span className="text-sm text-[#161616]/50">Проверок</span>
            </div>
            <p className="text-2xl font-bold text-[#161616]">{verificationCount}</p>
          </div>
        </AnimatedStatCard>

        <AnimatedStatCard>
          <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#FA5424]/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#FA5424]" />
              </div>
              <span className="text-sm text-[#161616]/50">Найдено переплат</span>
            </div>
            <p className="text-2xl font-bold text-[#161616]">
              {totalOverpayFound > 0
                ? `${totalOverpayFound.toLocaleString("ru-RU")} \u0440\u0443\u0431.`
                : "\u2014"}
            </p>
            {maxOverpayPercent > 0 && (
              <p className="text-xs text-[#FA5424] mt-1">
                макс. +{maxOverpayPercent}%
              </p>
            )}
          </div>
        </AnimatedStatCard>
      </AnimatedStatsGrid>

      {/* Estimates list */}
      <div>
        <AnimatedSectionHeader>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#161616]">Мои сметы</h2>
            <Link href="/ru/dashboard/estimates/new">
              <button className="cursor-pointer group flex items-center gap-2 bg-[#0D8DFF] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all">
                <Plus className="w-5 h-5" />
                Новая смета
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </AnimatedSectionHeader>

        {!estimates || estimates.length === 0 ? (
          <AnimatedEmptyState>
            <div className="bg-white rounded-3xl p-12 border border-[#161616]/5 text-center">
              <div className="w-16 h-16 bg-[#0D8DFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-[#0D8DFF]" />
              </div>
              <h3 className="text-xl font-bold text-[#161616] mb-2">Пока нет смет</h3>
              <p className="text-[#161616]/50 mb-6 max-w-md mx-auto">
                Создайте первую смету — опишите проект или загрузите файлы
              </p>
              <Link href="/ru/dashboard/estimates/new">
                <button className="cursor-pointer bg-[#0D8DFF] text-[#161616] font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all">
                  Создать смету
                </button>
              </Link>
            </div>
          </AnimatedEmptyState>
        ) : (
          <AnimatedCardList>
            {estimates.map((estimate) => (
              <AnimatedCardItem key={estimate.id}>
                <EstimateCard estimate={estimate} />
              </AnimatedCardItem>
            ))}
          </AnimatedCardList>
        )}
      </div>

      {/* Verifications list */}
      <div>
        <AnimatedSectionHeader>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#161616]">Проверки смет</h2>
            <Link href="/ru/dashboard/verify/new">
              <button className="cursor-pointer group flex items-center gap-2 bg-[#33C791] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all">
                <ShieldCheck className="w-5 h-5" />
                Проверить смету
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </AnimatedSectionHeader>

        {!verifications || verifications.length === 0 ? (
          <AnimatedEmptyState>
            <div className="bg-white rounded-3xl p-12 border border-[#161616]/5 text-center">
              <div className="w-16 h-16 bg-[#33C791]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-[#33C791]" />
              </div>
              <h3 className="text-xl font-bold text-[#161616] mb-2">Нет проверок</h3>
              <p className="text-[#161616]/50 mb-6 max-w-md mx-auto">
                Загрузите смету подрядчика — узнайте, не завышены ли цены
              </p>
              <Link href="/ru/dashboard/verify/new">
                <button className="cursor-pointer bg-[#33C791] text-[#161616] font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all">
                  Проверить смету
                </button>
              </Link>
            </div>
          </AnimatedEmptyState>
        ) : (
          <AnimatedCardList>
            {verifications.map((v) => (
              <AnimatedCardItem key={v.id}>
                <VerificationCard verification={v} />
              </AnimatedCardItem>
            ))}
          </AnimatedCardList>
        )}
      </div>
    </div>
  );
}
