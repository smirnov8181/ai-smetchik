import Link from "next/link";
import { FileText, ArrowRight, Zap, DollarSign, Clock } from "lucide-react";

export const metadata = {
  title: "ContractorCheck — AI-Powered Construction Estimate Checker",
  description: "Upload your contractor estimate and get an instant AI-powered analysis. Save money by catching overcharges before you sign.",
};

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[#FAF4EC]">
      {/* Header */}
      <header className="border-b border-[#161616]/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#161616] rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#FAF4EC]" />
            </div>
            <span className="font-bold text-xl text-[#161616]">ContractorCheck</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#161616]/5 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#33C791] animate-pulse" />
          <span className="text-sm font-medium text-[#161616]">AI-powered</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-[#161616] leading-[1.1] mb-6">
          Never overpay for
          <br />
          <span className="text-[#0D8DFF]">home renovation</span>
        </h1>
        <p className="text-lg md:text-xl text-[#161616]/50 max-w-2xl mx-auto mb-12 leading-relaxed">
          Upload your contractor&apos;s estimate or describe your project. Our AI analyzes every line item against real market prices and shows you exactly where you&apos;re being overcharged.
        </p>
      </section>

      {/* Region Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-[#161616] text-center mb-4">
          Choose your region
        </h2>
        <p className="text-[#161616]/50 text-center mb-12 text-lg">
          We have localized pricing databases for accurate estimates
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Russia Card */}
          <Link href="/ru" className="group">
            <div className="p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300 shadow-lg shadow-[#161616]/5 h-full">
              <div className="text-5xl mb-6">&#127479;&#127482;</div>
              <h3 className="text-2xl font-bold text-[#161616] mb-3">Russia</h3>
              <p className="text-[#161616]/50 mb-6 leading-relaxed">
                Проверка смет на ремонт. Актуальные цены для Москвы и МО.
              </p>
              <div className="flex items-center gap-2 text-[#0D8DFF] font-semibold">
                <span>Перейти</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* US Card */}
          <Link href="/us" className="group">
            <div className="p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300 shadow-lg shadow-[#161616]/5 h-full">
              <div className="text-5xl mb-6">&#127482;&#127480;</div>
              <h3 className="text-2xl font-bold text-[#161616] mb-3">United States</h3>
              <p className="text-[#161616]/50 mb-6 leading-relaxed">
                Check contractor estimates. Real market prices for major US metros.
              </p>
              <div className="flex items-center gap-2 text-[#0D8DFF] font-semibold">
                <span>Get started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#161616] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-[#0D8DFF]/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-[#0D8DFF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Analysis</h3>
              <p className="text-white/50 leading-relaxed">
                GPT-4o extracts every work item, material, and price from your estimate — text, PDF, or photo.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-[#33C791]/20 rounded-2xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7 text-[#33C791]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Save Money</h3>
              <p className="text-white/50 leading-relaxed">
                Compare each line item against real market prices. See exactly where your contractor is overcharging.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-[#FA5424]/20 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-[#FA5424]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">30-Second Results</h3>
              <p className="text-white/50 leading-relaxed">
                Get a detailed report in under a minute. No waiting, no phone calls, no second opinions needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#161616]/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#161616]/50">
          <p>&copy; 2025 ContractorCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
