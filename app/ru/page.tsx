import { LandingContent } from "@/components/landing-content";

export const metadata = {
  title: "AI Сметчик — Смета на ремонт за 2 минуты",
  description: "Загрузите описание, фото или PDF — AI проанализирует и составит детальную смету с ценами на все работы и материалы",
  openGraph: {
    title: "AI Сметчик — Смета на ремонт за 2 минуты",
    description: "AI составит детальную смету с ценами на все работы и материалы",
    locale: "ru_RU",
  },
};

export default function RUPage() {
  return <LandingContent />;
}
