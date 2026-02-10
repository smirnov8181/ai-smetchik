import OpenAI from "openai";
import {
  ContractorWorkItem,
  VerifiedWorkItem,
  VerificationResult,
  VerificationStatus,
} from "@/lib/supabase/types";
import {
  VERIFICATION_PARSER_PROMPT,
  VERIFICATION_PARSER_PROMPT_US,
  VERIFICATION_SUMMARY_PROMPT,
  VERIFICATION_SUMMARY_PROMPT_US,
} from "./prompts";
import { createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "./client";
import { findCatalogMatch } from "./catalog-match";

// Step 1: Parse contractor's estimate
export async function parseContractorEstimate(params: {
  text?: string;
  imageUrls?: string[];
  pdfText?: string;
  region?: string;
}): Promise<{ items: ContractorWorkItem[]; total: number }> {
  const { text, imageUrls, pdfText, region = "moscow" } = params;
  const isUS = isUSRegion(region);

  const userParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  const estimateLabel = isUS ? "Contractor's estimate:" : "Смета подрядчика:";
  const pdfLabel = isUS ? "Data from PDF estimate:" : "Данные из PDF сметы:";
  const photoLabel = isUS ? "Photo/scan of estimate:" : "Фото/скан сметы:";

  if (text) {
    userParts.push({
      type: "text",
      text: `${estimateLabel}\n${text}`,
    });
  }

  if (pdfText) {
    userParts.push({
      type: "text",
      text: `${pdfLabel}\n${pdfText}`,
    });
  }

  if (imageUrls && imageUrls.length > 0) {
    userParts.push({ type: "text", text: photoLabel });
    for (const url of imageUrls) {
      userParts.push({
        type: "image_url",
        image_url: { url, detail: "auto" },
      });
    }
  }

  if (userParts.length === 0) {
    throw new Error("No input provided");
  }

  // Use faster model for image parsing to avoid timeout
  const modelToUse = imageUrls && imageUrls.length > 0 ? MODELS.fast : MODELS.main;
  const systemPrompt = isUS ? VERIFICATION_PARSER_PROMPT_US : VERIFICATION_PARSER_PROMPT;

  const response = await ai.chat.completions.create({
    model: modelToUse,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userParts },
    ],
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from verification parser");
  }

  const parsed = JSON.parse(content);
  return {
    items: parsed.items as ContractorWorkItem[],
    total: parsed.total || 0,
  };
}

// Step 2: Compare against market prices
function getStatus(
  contractorPrice: number,
  marketMax: number,
  marketAvg: number
): VerificationStatus {
  if (contractorPrice <= marketMax * 1.1) return "ok";
  if (contractorPrice <= marketAvg * 1.5) return "warning";
  return "overpay";
}

function isUSRegion(region: string): boolean {
  return region === "us_national" || region.startsWith("US-");
}

export async function verifyPrices(
  contractorItems: ContractorWorkItem[],
  region: string = "moscow"
): Promise<VerifiedWorkItem[]> {
  const supabase = createServiceClient();

  const table = isUSRegion(region) ? "price_catalog_us" : "price_catalog";
  const queryRegion = region === "us_national" ? "us_national" : region;

  const { data: catalog, error } = await supabase
    .from(table)
    .select("*")
    .eq("region", queryRegion);

  if (error) {
    throw new Error(`Failed to fetch price catalog: ${error.message}`);
  }

  return contractorItems.map((item) => {
    const match = findCatalogMatch(item.work, catalog || []);

    const marketMin = match?.price_min ?? item.contractor_price * 0.6;
    const marketAvg = match?.price_avg ?? item.contractor_price * 0.8;
    const marketMax = match?.price_max ?? item.contractor_price;

    const overpayPerUnit = Math.max(0, item.contractor_price - marketAvg);
    const overpayAmount = Math.round(overpayPerUnit * item.quantity);
    const overpayPercent =
      marketAvg > 0
        ? Math.round(((item.contractor_price - marketAvg) / marketAvg) * 100)
        : 0;

    return {
      category: item.category,
      work: item.work,
      unit: item.unit,
      quantity: item.quantity,
      contractor_price: item.contractor_price,
      contractor_total: item.contractor_total,
      market_min: marketMin,
      market_avg: marketAvg,
      market_max: marketMax,
      overpay_amount: overpayAmount,
      overpay_percent: Math.max(0, overpayPercent),
      status: getStatus(item.contractor_price, marketMax, marketAvg),
    };
  });
}

// Step 3: Generate verification result with AI summary
export async function generateVerificationResult(
  verifiedItems: VerifiedWorkItem[],
  region: string = "moscow"
): Promise<VerificationResult> {
  const isUS = isUSRegion(region);
  const totalContractor = verifiedItems.reduce(
    (sum, item) => sum + item.contractor_total,
    0
  );
  const totalMarketAvg = verifiedItems.reduce(
    (sum, item) => sum + item.market_avg * item.quantity,
    0
  );
  const totalOverpay = Math.max(0, totalContractor - totalMarketAvg);
  const overpayPercent =
    totalMarketAvg > 0
      ? Math.round(((totalContractor - totalMarketAvg) / totalMarketAvg) * 100)
      : 0;

  // Determine verdict
  let verdict: VerificationResult["verdict"];
  if (overpayPercent <= 10) verdict = "fair";
  else if (overpayPercent <= 25) verdict = "slightly_overpriced";
  else if (overpayPercent <= 50) verdict = "overpriced";
  else verdict = "ripoff";

  // AI summary
  const summaryData = {
    items: verifiedItems.map((i) => ({
      work: i.work,
      contractor_price: i.contractor_price,
      market_avg: i.market_avg,
      overpay_percent: i.overpay_percent,
      status: i.status,
    })),
    total_contractor: totalContractor,
    total_market: totalMarketAvg,
    total_overpay: totalOverpay,
    overpay_percent: overpayPercent,
    verdict,
  };

  let summary: string;
  const recommendations: string[] = [];
  let negotiation_tips: string[] = [];
  let contractor_message = "";

  const summaryPrompt = isUS ? VERIFICATION_SUMMARY_PROMPT_US : VERIFICATION_SUMMARY_PROMPT;
  const locale = isUS ? "en-US" : "ru-RU";

  const fallbackSummary = isUS
    ? `Contractor's estimate is overpriced by ${overpayPercent}% ($${totalOverpay.toLocaleString(locale)})`
    : `Смета подрядчика завышена на ${overpayPercent}% (${totalOverpay.toLocaleString(locale)} руб.)`;

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.fast,
      messages: [
        { role: "system", content: summaryPrompt },
        {
          role: "user",
          content: JSON.stringify(summaryData, null, 2),
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "";
    try {
      const parsed = JSON.parse(content);
      summary = parsed.summary || fallbackSummary;
      negotiation_tips = parsed.negotiation_tips || [];
      contractor_message = parsed.contractor_message || "";
    } catch {
      // If JSON parse fails, treat entire response as summary
      summary = content || fallbackSummary;
    }
  } catch {
    summary = fallbackSummary;
  }

  // Auto-recommendations (factual per-item data)
  const overpayItems = verifiedItems
    .filter((i) => i.status === "overpay")
    .sort((a, b) => b.overpay_amount - a.overpay_amount);

  for (const item of overpayItems.slice(0, 5)) {
    if (isUS) {
      recommendations.push(
        `${item.work}: contractor charges $${item.contractor_price}/${item.unit}, market rate $${item.market_avg}/${item.unit} (${item.overpay_percent}% overcharge)`
      );
    } else {
      recommendations.push(
        `${item.work}: подрядчик просит ${item.contractor_price} руб/${item.unit}, рыночная цена ${item.market_avg} руб/${item.unit} (переплата ${item.overpay_percent}%)`
      );
    }
  }

  return {
    items: verifiedItems,
    total_contractor: totalContractor,
    total_market_avg: totalMarketAvg,
    total_overpay: totalOverpay,
    overpay_percent: Math.max(0, overpayPercent),
    summary,
    verdict,
    recommendations,
    negotiation_tips,
    contractor_message,
  };
}
