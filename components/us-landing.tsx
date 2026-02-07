"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ArrowRight,
  Zap,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Lock,
  MapPin,
  Camera,
  FileCheck,
  BadgeCheck,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RegionSwitcher } from "@/components/region-switcher";
import type { User } from "@supabase/supabase-js";

const testimonials = [
  {
    name: "Sarah M.",
    location: "Phoenix, AZ",
    project: "Kitchen Remodel",
    quote: "Found $6,200 in overcharges on my $45K kitchen estimate.",
    saved: "$6,200",
    color: "bg-[#FA5424]",
  },
  {
    name: "John T.",
    location: "Denver, CO",
    project: "Room Addition",
    quote: "Had 3 estimates. ContractorCheck showed which was fair.",
    saved: "$18,000",
    color: "bg-[#0D8DFF]",
  },
  {
    name: "Patricia L.",
    location: "Tampa, FL",
    project: "Roof Repair",
    quote: "Door-to-door contractor wanted $22K. Fair price was $14.5K.",
    saved: "$7,500",
    color: "bg-[#33C791]",
  },
];

const stats = [
  { value: "78%", label: "of projects go over budget" },
  { value: "$6.2K", label: "avg. overcharge found" },
  { value: "30s", label: "to check estimate" },
  { value: "20+", label: "US metros" },
];

const steps = [
  { num: "01", icon: Camera, title: "Upload", desc: "Snap a photo or upload PDF", color: "bg-[#FA5424]" },
  { num: "02", icon: Zap, title: "Analyze", desc: "AI checks every line item", color: "bg-[#0D8DFF]" },
  { num: "03", icon: FileCheck, title: "Report", desc: "See what's overpriced", color: "bg-[#33C791]" },
];

const cities = ["Phoenix", "Dallas", "Houston", "Tampa", "Atlanta", "Denver", "Charlotte", "Austin", "Miami", "Nashville"];

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
    <div className="min-h-screen bg-[#FAF4EC] text-[#161616] overflow-x-hidden font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF4EC]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#161616] rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-[#FAF4EC]" />
              </div>
              <span className="font-bold text-xl tracking-tight">ContractorCheck</span>
            </div>
            <div className="flex items-center gap-3">
              <RegionSwitcher />
              {!loading && (
                user ? (
                  <Link href="/dashboard">
                    <button className="bg-[#0D8DFF] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                      Dashboard
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="hidden sm:block">
                      <button className="text-[#161616]/70 hover:text-[#161616] font-medium px-4 py-2 transition-colors">
                        Log in
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className="bg-[#33C791] text-[#161616] font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                        Get Results
                      </button>
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#161616]/5 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#33C791] animate-pulse" />
                <span className="text-sm font-medium">Trusted by 1,000+ homeowners</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
                Get Checked.
                <br />
                <span className="text-[#0D8DFF]">Get Confident.</span>
                <br />
                Get Fair Prices.
              </h1>

              <p className="text-xl lg:text-2xl text-[#161616]/60 mb-10 max-w-lg">
                Upload your contractor's estimate. Know in <span className="text-[#161616] font-medium">30 seconds</span> if you're being overcharged.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/register">
                  <button className="group bg-[#0D8DFF] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all flex items-center gap-2">
                    Check My Estimate — $39.99
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/register">
                  <button className="bg-[#FA5424] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all">
                    See Demo
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-[#161616]/50">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#33C791]" />
                  30 second results
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0D8DFF]" />
                  100% anonymous
                </span>
                <span className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#FA5424]" />
                  Money-back guarantee
                </span>
              </div>
            </div>

            {/* Right: Demo Card */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-[#161616]/10 border border-[#161616]/5">
                <div className="text-xs font-semibold text-[#161616]/40 uppercase tracking-wider mb-6">
                  Live Analysis Preview
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#33C791]/10 border border-[#33C791]/20">
                    <span className="font-medium">Flooring installation</span>
                    <span className="text-[#33C791] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Fair
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FA5424]/10 border border-[#FA5424]/20">
                    <span className="font-medium">Electrical work</span>
                    <span className="text-[#FA5424] font-semibold">+28% over</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <span className="font-medium">Cabinet install</span>
                    <span className="text-red-500 font-semibold">+52% over</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-[#161616]/10 flex justify-between items-center">
                  <span className="text-[#161616]/50">Potential savings</span>
                  <span className="text-3xl font-bold text-[#33C791]">$4,850</span>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 top-8 -right-8 w-full h-full bg-[#0D8DFF]/20 rounded-3xl" />
              <div className="absolute -z-20 top-16 -right-16 w-full h-full bg-[#33C791]/10 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#161616] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Getting 3 quotes takes <span className="text-[#161616]/30">weeks.</span>
              <br />
              Checking one takes <span className="text-[#0D8DFF]">30 seconds.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-[#FA5424]/10 border-2 border-[#FA5424]/20">
              <div className="text-[#FA5424] font-bold text-sm uppercase tracking-wider mb-6">The Old Way</div>
              <ul className="space-y-4">
                {["Wait 2-4 weeks for quotes", "Still don't know if fair", "Contractor pressures you", "Avg overpay: $6,200"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#161616]/70">
                    <span className="text-[#FA5424] font-bold">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-[#33C791]/10 border-2 border-[#33C791]/20">
              <div className="text-[#33C791] font-bold text-sm uppercase tracking-wider mb-6">With ContractorCheck</div>
              <ul className="space-y-4">
                {["Get answers in 30 seconds", "Compare to market prices", "See exactly what's inflated", "Negotiate with confidence"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#161616]/70">
                    <span className="text-[#33C791] font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Three steps. <span className="text-[#0D8DFF]">Thirty seconds.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="group relative p-8 rounded-3xl bg-[#FAF4EC] hover:-translate-y-2 transition-transform duration-300">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-7xl font-bold text-[#161616]/5 absolute top-4 right-6">{step.num}</div>
                <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                <p className="text-[#161616]/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Real homeowners. <span className="text-[#33C791]">Real savings.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-sm text-[#161616]/50 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t.location}
                    </div>
                  </div>
                </div>
                <p className="text-[#161616]/70 mb-6">"{t.quote}"</p>
                <div className="pt-4 border-t border-[#161616]/10 flex justify-between items-center">
                  <span className="text-xs text-[#161616]/40 uppercase tracking-wider">{t.project}</span>
                  <span className="text-xl font-bold text-[#33C791]">Saved {t.saved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 bg-[#161616] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-white/50 uppercase tracking-wider text-sm">Accurate prices for 20+ US metros</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <span key={city} className="px-5 py-2 rounded-full border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors">
                {city}
              </span>
            ))}
            <span className="px-5 py-2 rounded-full bg-[#33C791] text-[#161616] font-semibold text-sm">+10 more</span>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="p-12 rounded-[2rem] bg-white border border-[#161616]/10 shadow-2xl shadow-[#161616]/5 text-center">
            <div className="inline-flex items-center gap-2 bg-[#0D8DFF]/10 text-[#0D8DFF] rounded-full px-4 py-2 mb-6 font-semibold text-sm">
              <DollarSign className="w-4 h-4" />
              One-time payment
            </div>

            <div className="text-6xl md:text-7xl font-bold mb-4">$39.99</div>
            <p className="text-[#161616]/50 text-lg mb-8">
              vs average overcharge of <span className="text-[#FA5424] font-bold">$6,200</span>
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-md mx-auto mb-10">
              {["Line-by-line analysis", "Local market prices", "Overcharge breakdown", "Negotiation tips", "PDF report", "Money-back guarantee"].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-[#161616]/70">
                  <CheckCircle2 className="w-5 h-5 text-[#33C791] shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <Link href="/register">
              <button className="group bg-[#0D8DFF] text-[#161616] font-bold px-10 py-5 rounded-full text-xl hover:opacity-90 transition-all flex items-center gap-2 mx-auto">
                Check My Estimate
                <ArrowUpRight className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </Link>

            <p className="text-[#161616]/40 text-sm mt-6">
              100% money-back if you don't save at least $500
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#161616] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Don't sign until you
            <span className="block text-[#33C791]">know it's fair.</span>
          </h2>
          <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
            Your contractor is asking for thousands. Isn't it worth $39.99 to be sure?
          </p>
          <Link href="/register">
            <button className="group bg-[#33C791] text-[#161616] font-bold px-10 py-5 rounded-full text-xl hover:opacity-90 transition-all inline-flex items-center gap-2">
              Get Started Now
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#FAF4EC] border-t border-[#161616]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#161616] rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#FAF4EC]" />
              </div>
              <span className="font-bold">ContractorCheck</span>
            </div>
            <p className="text-sm text-[#161616]/40">© 2025 ContractorCheck. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-[#161616]/50">
              <Link href="/privacy" className="hover:text-[#161616] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#161616] transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
