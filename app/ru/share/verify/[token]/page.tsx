import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { SharedVerificationContent } from "@/components/shared-verification-page";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: verification } = await supabase
    .from("verifications")
    .select("total_contractor, overpay_amount, overpay_percent, created_at")
    .eq("share_token", token)
    .single();

  if (!verification) {
    return {
      title: "Проверка сметы — AI Сметчик",
      description: "Проверка сметы подрядчика с помощью AI",
    };
  }

  const overpay = verification.overpay_amount
    ? `${Math.round(verification.overpay_amount).toLocaleString("ru-RU")} руб.`
    : null;
  const percent = verification.overpay_percent
    ? `+${verification.overpay_percent}%`
    : null;
  const total = verification.total_contractor
    ? `${Math.round(verification.total_contractor).toLocaleString("ru-RU")} руб.`
    : null;

  const date = new Date(verification.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title = overpay
    ? `Переплата ${overpay} (${percent}) — AI Сметчик`
    : "Проверка сметы — AI Сметчик";

  const descParts: string[] = [
    "AI проверил смету подрядчика.",
  ];
  if (total) descParts.push(`Смета: ${total}.`);
  if (overpay && percent) descParts.push(`Найдена переплата: ${overpay} (${percent}).`);
  descParts.push(`Проверено ${date}.`);

  const description = descParts.join(" ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "AI Сметчик",
      locale: "ru_RU",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SharedVerificationPage({ params }: Props) {
  const { token } = await params;
  return <SharedVerificationContent token={token} />;
}
