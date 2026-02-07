import { USLanding } from "@/components/us-landing";

export const metadata = {
  title: "ContractorCheck — Is Your Contractor Overcharging You?",
  description: "Upload your contractor's estimate. Get instant line-by-line analysis against real market prices. Find overcharges in 30 seconds.",
  openGraph: {
    title: "ContractorCheck — Is Your Contractor Overcharging You?",
    description: "Upload your contractor's estimate. Get instant line-by-line analysis against real market prices.",
    locale: "en_US",
  },
};

export default function USPage() {
  return <USLanding />;
}
