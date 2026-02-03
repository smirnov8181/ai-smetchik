import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">AI Сметчик</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Войти</Button>
            </Link>
            <Link href="/register">
              <Button>Начать бесплатно</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Бета-версия
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Смета на ремонт
          <br />
          <span className="text-primary">за 2 минуты</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Загрузите описание, фото или PDF — AI проанализирует и составит
          детальную смету с ценами на все работы и материалы
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Попробовать бесплатно
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          3 сметы бесплатно, без карты
        </p>
      </section>

      {/* Verification CTA */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="secondary" className="mb-3">
                Для заказчиков
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                Вас обманывают?
                <br />
                <span className="text-primary">Проверьте смету</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Загрузите смету от подрядчика — AI сравнит каждую позицию с
                рыночными ценами и покажет, где вас обманывают
              </p>
              <Link href="/register">
                <Button size="lg">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Проверить смету бесплатно
                </Button>
              </Link>
            </div>
            <Card className="border-2">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">Штукатурка стен</span>
                    <span className="text-muted-foreground"> — 550 руб/м²</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">OK</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">Укладка плитки</span>
                    <span className="text-muted-foreground"> — 2 500 руб/м²</span>
                  </div>
                  <span className="text-yellow-600 text-sm font-medium">+40%</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">Демонтаж обоев</span>
                    <span className="text-muted-foreground"> — 500 руб/м²</span>
                  </div>
                  <span className="text-red-600 text-sm font-medium">+316%</span>
                </div>
                <Separator />
                <div className="text-center pt-1">
                  <p className="text-sm text-muted-foreground">Переплата:</p>
                  <p className="text-2xl font-bold text-red-600">~120 000 руб.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              icon: Upload,
              title: "1. Загрузите данные",
              desc: "Текст, PDF-планировка или фото помещений — принимаем любой формат",
            },
            {
              icon: Brain,
              title: "2. AI анализирует",
              desc: "GPT-4o извлекает параметры: площади, работы, материалы",
            },
            {
              icon: Table,
              title: "3. Расчёт цен",
              desc: "Детерминированный расчёт по актуальной базе цен Москвы",
            },
            {
              icon: Download,
              title: "4. Готовая смета",
              desc: "Таблица работ с ценами, итоги и экспорт в PDF",
            },
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
          <h2 className="text-3xl font-bold text-center mb-12">Возможности</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Мультимодальный ввод",
                desc: "Текст, PDF, фото — или всё сразу. AI разберётся с любым форматом данных.",
              },
              {
                icon: Shield,
                title: "Актуальные цены",
                desc: "База цен на работы и материалы обновляется регулярно. Цены для Москвы и МО.",
              },
              {
                icon: FileText,
                title: "Экспорт в PDF",
                desc: "Скачайте готовую смету в формате PDF для отправки подрядчику или заказчику.",
              },
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
        <h2 className="text-3xl font-bold text-center mb-12">Тарифы</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              plan: "Free",
              price: "0",
              features: ["3 сметы", "Экспорт в PDF", "Email-поддержка"],
              cta: "Начать бесплатно",
              variant: "outline" as const,
            },
            {
              plan: "Pro",
              price: "990",
              features: [
                "30 смет/мес",
                "Экспорт в PDF и Excel",
                "Приоритетная обработка",
                "Поддержка в чате",
              ],
              cta: "Выбрать Pro",
              variant: "default" as const,
              popular: true,
            },
            {
              plan: "Business",
              price: "2990",
              features: [
                "Безлимит смет",
                "API доступ",
                "Экспорт в PDF и Excel",
                "Выделенная поддержка",
                "Кастомный каталог цен",
              ],
              cta: "Выбрать Business",
              variant: "outline" as const,
            },
          ].map((tier) => (
            <Card
              key={tier.plan}
              className={tier.popular ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                {tier.popular && (
                  <Badge className="w-fit mb-2">Популярный</Badge>
                )}
                <CardTitle>{tier.plan}</CardTitle>
                <div className="text-3xl font-bold">
                  {tier.price}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    руб./мес
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
                  <Button variant={tier.variant} className="w-full">
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
          <p>&copy; {new Date().getFullYear()} AI Сметчик. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
