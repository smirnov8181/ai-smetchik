import OpenAI from "openai";
import {
  ContractorWorkItem,
  VerifiedWorkItem,
  VerificationResult,
  VerificationStatus,
  PriceCatalogItem,
} from "@/lib/supabase/types";
import {
  VERIFICATION_PARSER_PROMPT,
  VERIFICATION_SUMMARY_PROMPT,
} from "./prompts";
import { createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "./client";

// Step 1: Parse contractor's estimate
export async function parseContractorEstimate(params: {
  text?: string;
  imageUrls?: string[];
  pdfText?: string;
}): Promise<{ items: ContractorWorkItem[]; total: number }> {
  const { text, imageUrls, pdfText } = params;

  const userParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  if (text) {
    userParts.push({
      type: "text",
      text: `Смета подрядчика:\n${text}`,
    });
  }

  if (pdfText) {
    userParts.push({
      type: "text",
      text: `Данные из PDF сметы:\n${pdfText}`,
    });
  }

  if (imageUrls && imageUrls.length > 0) {
    userParts.push({ type: "text", text: "Фото/скан сметы:" });
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

  const response = await ai.chat.completions.create({
    model: modelToUse,
    messages: [
      { role: "system", content: VERIFICATION_PARSER_PROMPT },
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
function findCatalogMatch(
  workName: string,
  catalog: PriceCatalogItem[]
): PriceCatalogItem | null {
  const normalized = workName.toLowerCase().trim();

  const exact = catalog.find(
    (item) => item.work_name.toLowerCase() === normalized
  );
  if (exact) return exact;

  const partial = catalog.find(
    (item) =>
      normalized.includes(item.work_name.toLowerCase()) ||
      item.work_name.toLowerCase().includes(normalized)
  );
  if (partial) return partial;

  const workWords = normalized.split(/\s+/);
  let bestMatch: PriceCatalogItem | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    const catalogWords = item.work_name.toLowerCase().split(/\s+/);
    const overlap = workWords.filter((w) =>
      catalogWords.some((cw) => cw.includes(w) || w.includes(cw))
    ).length;
    const score = overlap / Math.max(workWords.length, catalogWords.length);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

function getStatus(
  contractorPrice: number,
  marketMax: number,
  marketAvg: number
): VerificationStatus {
  if (contractorPrice <= marketMax * 1.1) return "ok";
  if (contractorPrice <= marketAvg * 1.5) return "warning";
  return "overpay";
}

export async function verifyPrices(
  contractorItems: ContractorWorkItem[]
): Promise<VerifiedWorkItem[]> {
  const supabase = createServiceClient();

  const { data: catalog, error } = await supabase
    .from("price_catalog")
    .select("*")
    .eq("region", "moscow");

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
  verifiedItems: VerifiedWorkItem[]
): Promise<VerificationResult> {
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

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.fast,
      messages: [
        { role: "system", content: VERIFICATION_SUMMARY_PROMPT },
        {
          role: "user",
          content: JSON.stringify(summaryData, null, 2),
        },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    summary =
      response.choices[0]?.message?.content ||
      `Смета подрядчика завышена на ${overpayPercent}% (${totalOverpay.toLocaleString("ru-RU")} руб.)`;
  } catch {
    summary = `Смета подрядчика завышена на ${overpayPercent}% (${totalOverpay.toLocaleString("ru-RU")} руб.)`;
  }

  // Auto-recommendations
  const overpayItems = verifiedItems
    .filter((i) => i.status === "overpay")
    .sort((a, b) => b.overpay_amount - a.overpay_amount);

  for (const item of overpayItems.slice(0, 5)) {
    recommendations.push(
      `${item.work}: подрядчик просит ${item.contractor_price} руб/${item.unit}, рыночная цена ${item.market_avg} руб/${item.unit} (переплата ${item.overpay_percent}%)`
    );
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
  };
}
