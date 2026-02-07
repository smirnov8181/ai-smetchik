"use client";

import { useEffect, useState } from "react";
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
import {
  Shield,
  ArrowRight,
  Upload,
  Zap,
  FileCheck,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Star,
  MapPin,
  Users,
  TrendingDown,
  Camera,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RegionSwitcher } from "@/components/region-switcher";
import type { User } from "@supabase/supabase-js";

// Testimonials based on user personas
const testimonials = [
  {
    name: "Sarah M.",
    location: "Phoenix, AZ",
    avatar: "S",
    project: "Kitchen Remodel",
    quote: "Found $6,200 in overcharges on my $45K kitchen estimate. The contractor had padded 3 line items I never would have caught.",
    saved: "$6,200",
    originalQuote: "$45,000",
    fairPrice: "$38,800",
    color: "bg-rose-500",
  },
  {
    name: "John T.",
    location: "Denver, CO",
    avatar: "J",
    project: "Room Addition",
    quote: "Had 3 estimates ranging from $95K to $143K. ContractorCheck showed me which items were inflated in each. Saved me from picking the wrong contractor.",
    saved: "$18,000",
    originalQuote: "$127,000",
    fairPrice: "$109,000",
    color: "bg-blue-500",
  },
  {
    name: "Patricia L.",
    location: "Tampa, FL",
    avatar: "P",
    project: "Roof Repair",
    quote: "A door-to-door contractor quoted $22K after the hurricane. My daughter sent me this tool — turns out fair price was $14.5K. Thank you!",
    saved: "$7,500",
    originalQuote: "$22,000",
    fairPrice: "$14,500",
    color: "bg-amber-500",
  },
];

const stats = [
  { value: "78%", label: "of renovations go over budget", icon: TrendingDown },
  { value: "$6,200", label: "average overcharge found", icon: DollarSign },
  { value: "30 sec", label: "to check your estimate", icon: Clock },
  { value: "20+", label: "metro areas covered", icon: MapPin },
];

const steps = [
  {
    step: 1,
    icon: Camera,
    title: "Upload Your Estimate",
    description: "Snap a photo or upload PDF. Works with any contractor's format.",
  },
  {
    step: 2,
    icon: Zap,
    title: "AI Analyzes Every Line",
    description: "We compare each item against real market prices in your city.",
  },
  {
    step: 3,
    icon: FileCheck,
    title: "Get Your Report",
    description: "See exactly which items are overpriced and by how much.",
  },
];

const cities = [
  "Phoenix", "Dallas", "Houston", "Tampa", "Orlando", "Atlanta",
  "Denver", "Charlotte", "Austin", "San Antonio", "Las Vegas",
  "Nashville", "Raleigh", "Jacksonville", "San Diego", "Los Angeles",
  "Miami", "Seattle", "Portland", "Minneapolis",
];

export function USLanding() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">ContractorCheck</span>
          </div>
          <div className="flex items-center gap-3">
            <RegionSwitcher />
            {!loading && (
              user ? (
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                      Check My Estimate
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              78% of renovations exceed budget
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Is your contractor
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                overcharging you?
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Upload your estimate. Get instant line-by-line analysis against real market prices in your city.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
                  Check My Estimate — $39.99
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Results in 30 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                100% anonymous
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                Money-back guarantee
              </span>
            </div>
          </div>

          {/* Demo Card */}
          <div className="max-w-md mx-auto mt-12">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-300 text-sm">Sample Analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-emerald-500/20 border border-emerald-500/30">
                  <span className="text-sm">Flooring installation</span>
                  <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Fair
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-500/20 border border-amber-500/30">
                  <span className="text-sm">Electrical work</span>
                  <span className="text-amber-400 text-sm font-medium">+28% over</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-red-500/20 border border-red-500/30">
                  <span className="text-sm">Cabinet installation</span>
                  <span className="text-red-400 text-sm font-medium">+52% over</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Total overcharge:</span>
                  <span className="text-xl font-bold text-red-400">$4,850</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <div className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Getting 3 quotes takes weeks.
              <span className="block text-emerald-600">Checking one takes 30 seconds.</span>
            </h2>
            <p className="text-lg text-slate-600">
              The old advice was "get multiple quotes." But that takes forever, and you still don't know if ANY of them are fair. We check your estimate against real market data — instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  The Old Way
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-600">
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Wait 2-4 weeks for multiple quotes
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Still don't know if prices are fair
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Contractor pressures you to decide now
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Average homeowner overpays $6,200
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <CardTitle className="text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  With ContractorCheck
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-600">
                <p className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Get answers in 30 seconds
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Compare against real market prices
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Know exactly which items are inflated
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Negotiate with confidence
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">Three steps. Thirty seconds. Complete clarity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-emerald-200" />
                )}
                <Card className="relative bg-white">
                  <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-slate-600">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                Check My Estimate Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Real Savings from Real Homeowners
            </h2>
            <p className="text-lg text-slate-600">Join thousands who checked before they signed</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${t.color}`} />
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {t.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {t.location}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">{t.project}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 italic">"{t.quote}"</p>
                  <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-xs text-slate-500">Quoted</div>
                      <div className="font-semibold text-red-600">{t.originalQuote}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Fair Price</div>
                      <div className="font-semibold text-emerald-600">{t.fairPrice}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Saved</div>
                      <div className="font-bold text-emerald-600">{t.saved}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Accurate Prices for Your City
            </h2>
            <p className="text-lg text-slate-300">
              490+ work items with real market prices across 20+ US metros
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {cities.map((city) => (
              <Badge key={city} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors">
                {city}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Card className="border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
                <h3 className="text-2xl font-bold mb-2">Complete Estimate Analysis</h3>
                <div className="text-5xl font-bold mb-2">$39.99</div>
                <p className="text-emerald-100">One-time payment • No subscription</p>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-4 mb-6">
                  {[
                    "Line-by-line price comparison",
                    "Local market rates for your city",
                    "Overcharge breakdown by item",
                    "Total potential savings calculation",
                    "Negotiation talking points",
                    "PDF report you can print",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block">
                  <Button size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg py-6">
                    Check My Estimate Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Shield className="w-4 h-4" />
                  <span>Money-back guarantee if you don't save $500+</span>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-slate-500 mt-6">
              <span className="font-medium text-slate-900">$39.99</span> vs average overcharge of <span className="font-medium text-red-600">$6,200</span> = <span className="font-medium text-emerald-600">0.6% of your potential savings</span>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don't sign until you know it's fair.
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Your contractor is asking for thousands of dollars. Isn't it worth $39.99 to make sure you're not being overcharged?
          </p>

          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
              Check My Estimate — $39.99
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <p className="text-sm text-slate-400 mt-6">
            100% money-back guarantee • Results in 30 seconds • Anonymous
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-white">ContractorCheck</span>
            </div>
            <p className="text-sm">© 2025 ContractorCheck. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
