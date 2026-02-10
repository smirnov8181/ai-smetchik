import Link from "next/link";
import { FileText, ArrowUpRight, Zap, DollarSign, Clock } from "lucide-react";

export const metadata = {
  title: "ContractorCheck — AI-Powered Construction Estimate Checker",
  description: "Upload your contractor estimate and get an instant AI-powered analysis. Save money by catching overcharges before you sign.",
};

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[#FFFFEB] text-[#1A1A1A]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#034F46] rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#FFFFEB]" />
            </div>
            <span className="font-heading text-xl font-semibold text-[#1A1A1A]">ContractorCheck</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 bg-[#034F46]/5 rounded-full px-4 py-2 mb-10">
          <span className="w-2 h-2 rounded-full bg-[#034F46] animate-pulse" />
          <span className="text-sm font-medium text-[#1A1A1A]/70">AI-powered</span>
        </div>
        <h1 className="font-heading text-6xl md:text-8xl lg:text-[120px] leading-[1.05] tracking-tight mb-8">
          Never overpay for
          <br />
          <em className="italic text-[#034F46]">home renovation</em>
        </h1>
        <p className="text-lg md:text-xl text-[#1A1A1A]/50 max-w-2xl mx-auto mb-14 leading-relaxed">
          Upload your contractor&apos;s estimate. Our AI compares every line item against real market prices — and shows you exactly where you&apos;re overpaying.
        </p>
      </section>

      {/* Region Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-24 md:pb-32">
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] text-center mb-4 leading-[1.1]">
          Choose your region
        </h2>
        <p className="text-[#1A1A1A]/50 text-center mb-14 text-lg">
          Localized pricing databases for accurate estimates
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Russia Card */}
          <Link href="/ru" className="group">
            <div className="p-8 rounded-[14px] bg-white border border-[#1A1A1A]/10 hover:-translate-y-1 transition-all duration-300 h-full">
              <div className="text-5xl mb-6">&#127479;&#127482;</div>
              <h3 className="font-heading text-2xl font-semibold text-[#1A1A1A] mb-3">Russia</h3>
              <p className="text-[#1A1A1A]/50 mb-6 leading-relaxed">
                Проверка смет на ремонт. Актуальные цены для Москвы и МО.
              </p>
              <div className="flex items-center gap-2 text-[#034F46] font-semibold">
                <span>Перейти</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* US Card */}
          <Link href="/us" className="group">
            <div className="p-8 rounded-[14px] bg-white border border-[#1A1A1A]/10 hover:-translate-y-1 transition-all duration-300 h-full">
              <div className="text-5xl mb-6">&#127482;&#127480;</div>
              <h3 className="font-heading text-2xl font-semibold text-[#1A1A1A] mb-3">United States</h3>
              <p className="text-[#1A1A1A]/50 mb-6 leading-relaxed">
                Check contractor estimates. Real market prices for major US metros.
              </p>
              <div className="flex items-center gap-2 text-[#034F46] font-semibold">
                <span>Get started</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#034F46] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white text-center mb-16 leading-[1.1]">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[14px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-[#F0D7FF]/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-[#F0D7FF]" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-white mb-3">AI Analysis</h3>
              <p className="text-white/50 leading-relaxed text-lg">
                Upload text, PDF, or photo — AI extracts every work item, material, and price instantly.
              </p>
            </div>

            <div className="p-8 rounded-[14px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-[#F0D7FF]/20 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7 text-[#F0D7FF]" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-white mb-3">Save Money</h3>
              <p className="text-white/50 leading-relaxed text-lg">
                Every line item compared against real market prices. See exactly where you&apos;re being overcharged.
              </p>
            </div>

            <div className="p-8 rounded-[14px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-[#F0D7FF]/20 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-[#F0D7FF]" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-white mb-3">Instant Results</h3>
              <p className="text-white/50 leading-relaxed text-lg">
                Detailed report in under 30 seconds. No waiting, no phone calls, no second opinions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/10 py-8 bg-[#FFFFEB]">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#1A1A1A]/40">
          <p>&copy; 2025 ContractorCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
