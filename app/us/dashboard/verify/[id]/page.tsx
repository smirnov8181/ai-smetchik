"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Lock,
} from "lucide-react";
import type {
  Verification,
  VerificationResult as VerificationResultType,
  ContractorWorkItem,
} from "@/lib/supabase/types";

export default function USVerificationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const justPaid = searchParams.get("paid") === "true";

  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setVerification(data.verification);
        setLoading(false);

        if (data.verification.status === "processing") {
          interval = setInterval(async () => {
            const res = await fetch(`/api/verify/${id}`);
            const data = await res.json();
            if (res.ok) {
              setVerification(data.verification);
              if (data.verification.status !== "processing") {
                clearInterval(interval);
              }
            }
          }, 3000);
        }
      } catch {
        setError("Failed to load verification");
        setLoading(false);
      }
    };

    fetchVerification();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#161616]/5 rounded-lg w-48"></div>
          <div className="h-64 bg-[#161616]/5 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-12 border border-[#161616]/5 text-center">
          <div className="w-16 h-16 bg-[#FA5424]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-[#FA5424]" />
          </div>
          <h3 className="text-xl font-bold text-[#161616] mb-2">Error</h3>
          <p className="text-[#161616]/50 mb-6">{error}</p>
          <Link href="/us/dashboard">
            <button className="cursor-pointer inline-flex items-center gap-2 bg-[#0D8DFF] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!verification) return null;

  const result = verification.result as VerificationResultType | null;
  const parsedItems = verification.parsed_items as ContractorWorkItem[] | null;
  const isPaid = verification.is_paid || justPaid;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/us/dashboard"
          className="inline-flex items-center gap-2 text-[#161616]/50 hover:text-[#161616] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-[#161616] flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          Estimate Check
        </h1>
        <span className="px-3 py-1 rounded-full bg-[#161616]/5 text-[#161616]/70 text-sm">
          {new Date(verification.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Processing State */}
      {verification.status === "processing" && (
        <>
          <div className="bg-white rounded-3xl p-8 border border-[#161616]/5">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#0D8DFF]" />
              <div>
                <h2 className="text-lg font-bold text-[#161616]">
                  Analyzing contractor estimate...
                </h2>
                <p className="text-[#161616]/50">
                  {parsedItems
                    ? "Comparing prices with market rates..."
                    : "AI is extracting line items and prices..."}
                </p>
              </div>
            </div>
            <div className="w-full bg-[#FAF4EC] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#0D8DFF] transition-all duration-500"
                style={{ width: parsedItems ? "70%" : "30%" }}
              />
            </div>
            <p className="text-sm text-[#161616]/50 mt-2">
              {parsedItems
                ? `Found ${parsedItems.length} line items, comparing with market...`
                : "Extracting text and line items..."}
            </p>
          </div>

          {/* Show parsed items while processing */}
          {parsedItems && parsedItems.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
              <h3 className="text-lg font-bold text-[#161616] mb-4">Detected Items</h3>
              <div className="space-y-2">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-3 border-b border-[#161616]/5 last:border-0"
                  >
                    <span className="text-[#161616]">{item.work}</span>
                    <span className="font-semibold text-[#161616]">
                      ${Number(item.contractor_total || 0).toLocaleString("en-US")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {verification.status === "error" && (
        <div className="bg-white rounded-3xl p-8 border border-[#FA5424]/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FA5424]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-[#FA5424]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#FA5424] mb-1">Analysis Failed</h3>
              <p className="text-[#161616]/50 mb-4">
                {verification.error_message ||
                  "Could not process the estimate. Please try uploading in a different format."}
              </p>
              <Link href="/us/dashboard/verify/new">
                <button className="cursor-pointer bg-[#0D8DFF] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all">
                  Try Again
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {verification.status === "ready" && result && (
        <>
          {/* Summary Card */}
          <div className="bg-white rounded-3xl p-8 border border-[#161616]/5">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Contractor Total */}
              <div className="text-center p-6 bg-[#FAF4EC] rounded-2xl">
                <p className="text-sm text-[#161616]/50 mb-1">Contractor's Quote</p>
                <p className="text-3xl font-bold text-[#161616]">
                  ${Number(result.total_contractor).toLocaleString("en-US")}
                </p>
              </div>

              {/* Fair Price */}
              <div className="text-center p-6 bg-[#33C791]/10 rounded-2xl">
                <p className="text-sm text-[#33C791] mb-1">Fair Market Price</p>
                <p className="text-3xl font-bold text-[#33C791]">
                  ${Number(result.total_market_avg).toLocaleString("en-US")}
                </p>
              </div>

              {/* Overcharge */}
              <div className="text-center p-6 bg-[#FA5424]/10 rounded-2xl">
                <p className="text-sm text-[#FA5424] mb-1">Potential Savings</p>
                <p className="text-3xl font-bold text-[#FA5424]">
                  ${Number(result.total_overpay).toLocaleString("en-US")}
                </p>
                <p className="text-sm text-[#FA5424]/70">
                  +{Number(result.overpay_percent).toFixed(0)}% overcharge
                </p>
              </div>
            </div>

            {/* Verdict */}
            <div className="mt-6 p-4 rounded-xl bg-[#FAF4EC] flex items-center gap-3">
              {Number(result.overpay_percent) > 20 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-[#FA5424]" />
                  <p className="text-[#161616]">
                    <span className="font-semibold text-[#FA5424]">Significant overcharge detected.</span>{" "}
                    This estimate is {Number(result.overpay_percent).toFixed(0)}% above market rates.
                  </p>
                </>
              ) : Number(result.overpay_percent) > 10 ? (
                <>
                  <AlertCircle className="w-5 h-5 text-[#FA5424]" />
                  <p className="text-[#161616]">
                    <span className="font-semibold text-[#FA5424]">Slight overcharge.</span>{" "}
                    Some items are priced above market average.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#33C791]" />
                  <p className="text-[#161616]">
                    <span className="font-semibold text-[#33C791]">Fair pricing!</span>{" "}
                    This estimate is within normal market range.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Detailed Breakdown */}
          {isPaid && result.items ? (
            <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
              <h3 className="text-lg font-bold text-[#161616] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Detailed Line-by-Line Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#161616]/10">
                      <th className="text-left py-3 px-2 text-sm font-medium text-[#161616]/50">Item</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-[#161616]/50">Quoted</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-[#161616]/50">Fair Price</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-[#161616]/50">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, index) => {
                      const diff = Number(item.contractor_total) - Number(item.market_avg * item.quantity);
                      const isOverpriced = diff > 0;

                      return (
                        <tr key={index} className="border-b border-[#161616]/5 last:border-0">
                          <td className="py-3 px-2 text-[#161616]">{item.work}</td>
                          <td className="py-3 px-2 text-right text-[#161616] font-medium">
                            ${Number(item.contractor_total).toLocaleString("en-US")}
                          </td>
                          <td className="py-3 px-2 text-right text-[#33C791] font-medium">
                            ${Number(item.market_avg * item.quantity).toLocaleString("en-US")}
                          </td>
                          <td className={`py-3 px-2 text-right font-semibold ${isOverpriced ? "text-[#FA5424]" : "text-[#33C791]"}`}>
                            {isOverpriced ? "+" : ""}${diff.toLocaleString("en-US")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Paywall */
            <div className="bg-[#161616] rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D8DFF] to-[#33C791]" />
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Unlock Full Analysis
                </h3>
                <p className="text-white/60 mb-6 max-w-md mx-auto">
                  Get the complete line-by-line breakdown showing exactly where
                  you're being overcharged and how much you could save.
                </p>
                <button className="cursor-pointer bg-[#33C791] text-[#161616] font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all">
                  Unlock for $9.99
                </button>
                <p className="text-white/40 text-sm mt-4">
                  One-time payment • Instant access • 30-day money-back guarantee
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Original Estimate Text */}
      {verification.input_text && (
        <div className="bg-white rounded-3xl p-6 border border-[#161616]/5">
          <h3 className="text-lg font-bold text-[#161616] mb-4">Original Contractor Estimate</h3>
          <pre className="text-sm text-[#161616]/70 whitespace-pre-wrap font-mono bg-[#FAF4EC] p-4 rounded-xl overflow-x-auto">
            {verification.input_text}
          </pre>
        </div>
      )}
    </div>
  );
}
