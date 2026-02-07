"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  FileText,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Loader2,
  Trash2
} from "lucide-react";

interface Verification {
  id: string;
  status: string;
  total_contractor: number | null;
  overpay_amount: number | null;
  overpay_percent: number | null;
  is_paid: boolean | null;
  created_at: string;
}

interface Subscription {
  plan: string;
  estimates_used: number;
  estimates_limit: number;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-[#161616]/10 text-[#161616]/70" },
  processing: { label: "Processing...", color: "bg-[#0D8DFF]/10 text-[#0D8DFF]" },
  ready: { label: "Complete", color: "bg-[#33C791]/10 text-[#33C791]" },
  error: { label: "Error", color: "bg-[#FA5424]/10 text-[#FA5424]" },
};

export default function USDashboardPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [verificationsRes, subscriptionRes] = await Promise.all([
        supabase
          .from("verifications")
          .select("id, status, total_contractor, overpay_amount, overpay_percent, is_paid, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single(),
      ]);

      setVerifications(verificationsRes.data || []);
      setSubscription(subscriptionRes.data);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Delete this verification?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/verify/${id}`, { method: "DELETE" });
      if (response.ok) {
        setVerifications((prev) => prev.filter((v) => v.id !== id));
      }
    } catch {
      alert("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const checksUsed = subscription?.estimates_used ?? 0;
  const checksLimit = subscription?.estimates_limit ?? 3;
  const plan = subscription?.plan ?? "free";

  const totalSavings = verifications.reduce((sum, v) => {
    if (v.status === "ready" && v.overpay_amount) {
      return sum + Number(v.overpay_amount);
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D8DFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#0D8DFF]/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#0D8DFF]" />
            </div>
            <span className="text-sm text-[#161616]/50">Plan</span>
          </div>
          <p className="text-2xl font-bold text-[#161616] capitalize">{plan}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#33C791]/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#33C791]" />
            </div>
            <span className="text-sm text-[#161616]/50">Checks Used</span>
          </div>
          <p className="text-2xl font-bold text-[#161616]">
            {checksUsed} / {plan === "business" ? "∞" : checksLimit}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#FA5424]/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#FA5424]" />
            </div>
            <span className="text-sm text-[#161616]/50">Total Savings Found</span>
          </div>
          <p className="text-2xl font-bold text-[#161616]">
            ${totalSavings.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Verifications List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#161616]">My Estimate Checks</h2>
          <Link href="/us/dashboard/verify/new">
            <button className="cursor-pointer group flex items-center gap-2 bg-[#0D8DFF] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all">
              <ShieldCheck className="w-5 h-5" />
              New Check
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        {verifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-[#161616]/5 text-center">
            <div className="w-16 h-16 bg-[#0D8DFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-[#0D8DFF]" />
            </div>
            <h3 className="text-xl font-bold text-[#161616] mb-2">No checks yet</h3>
            <p className="text-[#161616]/50 mb-6 max-w-md mx-auto">
              Upload a contractor's estimate to see if they're overcharging you.
              Get instant AI-powered analysis.
            </p>
            <Link href="/us/dashboard/verify/new">
              <button className="cursor-pointer bg-[#33C791] text-[#161616] font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all">
                Check Your First Estimate
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map((verification) => {
              const status = statusLabels[verification.status] || statusLabels.draft;

              return (
                <Link key={verification.id} href={`/us/dashboard/verify/${verification.id}`}>
                  <div className="bg-white rounded-2xl p-5 border border-[#161616]/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FAF4EC] rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6 text-[#161616]/50" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#161616]">
                            Estimate Check - {new Date(verification.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-[#161616]/50">
                            {verification.total_contractor
                              ? `Contractor total: $${Number(verification.total_contractor).toLocaleString("en-US")}`
                              : "Processing..."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {verification.overpay_percent != null && Number(verification.overpay_percent) > 0 && (
                          <div className="flex items-center gap-1 text-[#FA5424] font-semibold">
                            <TrendingUp className="w-4 h-4" />
                            +{Number(verification.overpay_percent).toFixed(0)}% overcharge
                          </div>
                        )}

                        {verification.is_paid && (
                          <span className="px-3 py-1 rounded-full border border-[#33C791]/30 text-[#33C791] text-xs font-medium">
                            Paid
                          </span>
                        )}

                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>

                        <button
                          onClick={(e) => handleDelete(e, verification.id)}
                          disabled={deletingId === verification.id}
                          className="cursor-pointer opacity-0 group-hover:opacity-100 p-2 text-[#161616]/30 hover:text-[#FA5424] hover:bg-[#FA5424]/10 rounded-lg transition-all"
                        >
                          {deletingId === verification.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade CTA for free users */}
      {plan === "free" && checksUsed >= checksLimit && (
        <div className="bg-[#161616] rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            You've used all your free checks
          </h3>
          <p className="text-white/60 mb-6">
            Upgrade to Pro for unlimited estimate checks and detailed breakdowns
          </p>
          <button className="cursor-pointer bg-[#0D8DFF] text-[#161616] font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all">
            Upgrade to Pro - $29/month
          </button>
        </div>
      )}
    </div>
  );
}
