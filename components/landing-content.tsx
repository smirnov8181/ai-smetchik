"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRegion } from "@/lib/i18n/region-context";
import { LandingRegionSwitcher } from "@/components/landing-region-switcher";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Zap,
  Shield,
  ArrowRight,
  Upload,
  Brain,
  Table,
  Download,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const content = {
  RU: {
    beta: "Бета-версия",
    heroTitle1: "Смета на ремонт",
    heroTitle2: "за 2 минуты",
    heroDesc: "Загрузите описание, фото или PDF — AI проанализирует и составит детальную смету с ценами на все работы и материалы",
    tryFree: "Попробовать бесплатно",
    freeNote: "3 сметы бесплатно, без карты",
    login: "Войти",
    startFree: "Начать бесплатно",

    // Verification section
    forCustomers: "Для заказчиков",
    beingScammed: "Вас обманывают?",
    checkEstimate: "Проверьте смету",
    checkDesc: "Загрузите смету от подрядчика — AI сравнит каждую позицию с рыночными ценами и покажет, где вас обманывают",
    checkFree: "Проверить смету бесплатно",
    overpay: "Переплата:",
    overpayAmount: "~120 000 руб.",

    // Example items
    item1: "Штукатурка стен",
    item1Price: "550 руб/м²",
    item2: "Укладка плитки",
    item2Price: "2 500 руб/м²",
    item3: "Демонтаж обоев",
    item3Price: "500 руб/м²",

    // How it works
    howItWorks: "Как это работает",
    step1Title: "1. Загрузите данные",
    step1Desc: "Текст, PDF-планировка или фото помещений — принимаем любой формат",
    step2Title: "2. AI анализирует",
    step2Desc: "GPT-4o извлекает параметры: площади, работы, материалы",
    step3Title: "3. Расчёт цен",
    step3Desc: "Детерминированный расчёт по актуальной базе цен Москвы",
    step4Title: "4. Готовая смета",
    step4Desc: "Таблица работ с ценами, итоги и экспорт в PDF",

    // Features
    features: "Возможности",
    feature1Title: "Мультимодальный ввод",
    feature1Desc: "Текст, PDF, фото — или всё сразу. AI разберётся с любым форматом данных.",
    feature2Title: "Актуальные цены",
    feature2Desc: "База цен на работы и материалы обновляется регулярно. Цены для Москвы и МО.",
    feature3Title: "Экспорт в PDF",
    feature3Desc: "Скачайте готовую смету в формате PDF для отправки подрядчику или заказчику.",

    // Pricing
    pricing: "Тарифы",
    perMonth: "руб./мес",
    popular: "Популярный",
    plans: [
      {
        plan: "Free",
        price: "0",
        features: ["3 сметы", "Экспорт в PDF", "Email-поддержка"],
        cta: "Начать бесплатно",
      },
      {
        plan: "Pro",
        price: "990",
        features: ["30 смет/мес", "Экспорт в PDF и Excel", "Приоритетная обработка", "Поддержка в чате"],
        cta: "Выбрать Pro",
        popular: true,
      },
      {
        plan: "Business",
        price: "2990",
        features: ["Безлимит смет", "API доступ", "Экспорт в PDF и Excel", "Выделенная поддержка", "Кастомный каталог цен"],
        cta: "Выбрать Business",
      },
    ],

    footer: "© 2025 AI Сметчик. Все права защищены.",
  },

  US: {
    beta: "Beta",
    heroTitle1: "Contractor Estimate",
    heroTitle2: "in 2 minutes",
    heroDesc: "Upload description, photo or PDF — AI will analyze and check if your contractor is overcharging you",
    tryFree: "Try for Free",
    freeNote: "3 free checks, no card required",
    login: "Log in",
    startFree: "Start Free",

    // Verification section
    forCustomers: "For Homeowners",
    beingScammed: "Being Overcharged?",
    checkEstimate: "Check Your Estimate",
    checkDesc: "Upload your contractor's estimate — AI will compare each item with market prices and show where you're overpaying",
    checkFree: "Check Estimate Free",
    overpay: "Overpay:",
    overpayAmount: "~$4,200",

    // Example items
    item1: "Wall plastering",
    item1Price: "$8/sq ft",
    item2: "Tile installation",
    item2Price: "$25/sq ft",
    item3: "Wallpaper removal",
    item3Price: "$5/sq ft",

    // How it works
    howItWorks: "How It Works",
    step1Title: "1. Upload Data",
    step1Desc: "Text, PDF or photos — we accept any format",
    step2Title: "2. AI Analyzes",
    step2Desc: "GPT-4o extracts parameters: areas, work items, materials",
    step3Title: "3. Price Check",
    step3Desc: "Comparison with real market prices in your area",
    step4Title: "4. Get Report",
    step4Desc: "See exactly where you're being overcharged",

    // Features
    features: "Features",
    feature1Title: "Any Format",
    feature1Desc: "Text, PDF, photos — or all at once. AI handles any input format.",
    feature2Title: "Real Prices",
    feature2Desc: "Price database updated regularly. Regional pricing for major US metros.",
    feature3Title: "Export PDF",
    feature3Desc: "Download your report as PDF to discuss with your contractor.",

    // Pricing
    pricing: "Pricing",
    perMonth: "/month",
    popular: "Popular",
    plans: [
      {
        plan: "Free",
        price: "$0",
        features: ["3 estimate checks", "Basic report", "Email support"],
        cta: "Start Free",
      },
      {
        plan: "Pro",
        price: "$29",
        features: ["30 checks/month", "Detailed reports", "Priority processing", "Chat support"],
        cta: "Get Pro",
        popular: true,
      },
      {
        plan: "Business",
        price: "$99",
        features: ["Unlimited checks", "API access", "PDF & Excel export", "Dedicated support", "Custom price catalog"],
        cta: "Get Business",
      },
    ],

    footer: "© 2025 ContractorCheck. All rights reserved.",
  },
};

export function LandingContent() {
  const { region, t } = useRegion();
  const c = content[region];
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">{t.appName}</span>
          </div>
          <div className="flex items-center gap-4">
            <LandingRegionSwitcher />
            {!loading && (
              user ? (
                <Link href="/dashboard">
                  <Button>{region === "RU" ? "В личный кабинет" : "Go to Dashboard"}</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">{c.login}</Button>
                  </Link>
                  <Link href="/register">
                    <Button>{c.startFree}</Button>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          {c.beta}
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          {c.heroTitle1}
          <br />
          <span className="text-primary">{c.heroTitle2}</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {c.heroDesc}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              {c.tryFree}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {c.freeNote}
        </p>
      </section>

      {/* Verification CTA */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="secondary" className="mb-3">
                {c.forCustomers}
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                {c.beingScammed}
                <br />
                <span className="text-primary">{c.checkEstimate}</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                {c.checkDesc}
              </p>
              <Link href="/register">
                <Button size="lg">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  {c.checkFree}
                </Button>
              </Link>
            </div>
            <Card className="border-2">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{c.item1}</span>
                    <span className="text-muted-foreground"> — {c.item1Price}</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">OK</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{c.item2}</span>
                    <span className="text-muted-foreground"> — {c.item2Price}</span>
                  </div>
                  <span className="text-yellow-600 text-sm font-medium">+40%</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{c.item3}</span>
                    <span className="text-muted-foreground"> — {c.item3Price}</span>
                  </div>
                  <span className="text-red-600 text-sm font-medium">+316%</span>
                </div>
                <Separator />
                <div className="text-center pt-1">
                  <p className="text-sm text-muted-foreground">{c.overpay}</p>
                  <p className="text-2xl font-bold text-red-600">{c.overpayAmount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{c.howItWorks}</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Upload, title: c.step1Title, desc: c.step1Desc },
            { icon: Brain, title: c.step2Title, desc: c.step2Desc },
            { icon: Table, title: c.step3Title, desc: c.step3Desc },
            { icon: Download, title: c.step4Title, desc: c.step4Desc },
          ].map((step) => (
            <Card key={step.title}>
              <CardHeader>
                <step.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{c.features}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: c.feature1Title, desc: c.feature1Desc },
              { icon: Shield, title: c.feature2Title, desc: c.feature2Desc },
              { icon: FileText, title: c.feature3Title, desc: c.feature3Desc },
            ].map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{c.pricing}</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {c.plans.map((tier, i) => (
            <Card
              key={tier.plan}
              className={tier.popular ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                {tier.popular && (
                  <Badge className="w-fit mb-2">{c.popular}</Badge>
                )}
                <CardTitle>{tier.plan}</CardTitle>
                <div className="text-3xl font-bold">
                  {tier.price}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    {c.perMonth}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="text-primary">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{c.footer}</p>
        </div>
      </footer>
    </div>
  );
}
