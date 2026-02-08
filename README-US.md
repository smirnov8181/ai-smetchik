# ContractorCheck

**AI-Powered Contractor Estimate Verification for US Homeowners**

Stop overpaying for home renovations. Upload any contractor estimate and get instant AI analysis showing exactly where you're being overcharged.

---

## The Problem

- **78% of home renovation projects go over budget**
- Homeowners have no way to verify if contractor prices are fair
- Getting multiple quotes is time-consuming and often inconclusive
- Contractors know you can't easily fact-check their pricing

## The Solution

ContractorCheck uses AI to analyze contractor estimates in seconds:

1. **Upload** — Snap a photo, upload PDF, or paste text
2. **Analyze** — AI extracts every line item and compares to market rates
3. **Report** — See exactly what's overpriced and by how much

---

## Features

### Instant Analysis
Upload any estimate format (PDF, photo, Excel, text) and get results in under 30 seconds.

### Line-by-Line Breakdown
See fair market prices for every item — labor, materials, and total costs.

### Market Data
Prices are benchmarked against current rates in 20+ US metro areas including Phoenix, Dallas, Houston, Tampa, Atlanta, Denver, Charlotte, Austin, Miami, and Nashville.

### Privacy First
- 256-bit encryption
- 100% anonymous analysis
- No contractor contact required
- Your data is never shared

---

## How It Works

```
+-------------------+     +-------------------+     +-------------------+
|    1. UPLOAD      | --> |    2. ANALYZE     | --> |    3. REPORT      |
|                   |     |                   |     |                   |
|  Photo / PDF /    |     |  AI extracts      |     |  See overcharge   |
|  Text estimate    |     |  line items &     |     |  amount & get     |
|                   |     |  compares prices  |     |  fair prices      |
+-------------------+     +-------------------+     +-------------------+
```

---

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 estimate checks, summary only |
| **Single Check** | $9.99 | Full line-by-line breakdown |
| **Pro** | $29/mo | Unlimited checks + detailed reports |

---

## Use Cases

### Kitchen Remodel
> "Found $6,200 in overcharges on my $45K kitchen estimate."
> — Sarah M., Phoenix, AZ

### Room Addition
> "Had 3 estimates. ContractorCheck showed which one was fair."
> — John T., Denver, CO

### Roof Repair
> "Door-to-door contractor wanted $22K. Fair price was $14.5K."
> — Patricia L., Tampa, FL

---

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **AI**: Claude API for document parsing and price analysis
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Payments**: Stripe
- **Hosting**: Vercel

---

## Project Structure

```
app/
├── us/                     # US version
│   ├── page.tsx           # Landing page
│   ├── login/             # Authentication
│   ├── register/
│   └── dashboard/         # User dashboard
│       ├── page.tsx       # Verification list
│       └── verify/
│           ├── new/       # Upload new estimate
│           └── [id]/      # Verification results
├── api/
│   ├── verify/            # Verification endpoints
│   └── estimates/         # Estimate endpoints
components/
├── us-landing.tsx         # US landing page component
└── ui/                    # Shared UI components
lib/
├── supabase/              # Database client & types
└── i18n/                  # Internationalization
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Anthropic API key
- Stripe account (for payments)

### Installation

```bash
# Clone repository
git clone https://github.com/smirnov8181/ai-smetchik.git
cd ai-smetchik

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

---

## Live Demo

**US Version**: [https://ai-smetchik.vercel.app/us](https://ai-smetchik.vercel.app/us)

---

## Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Contractor rating system
- [ ] Price alerts for your area
- [ ] Integration with HomeAdvisor/Angi
- [ ] Multi-language support (Spanish)

---

## License

MIT

---

## Contact

- **Website**: [contractorcheck.com](https://ai-smetchik.vercel.app/us)
- **GitHub**: [github.com/smirnov8181/ai-smetchik](https://github.com/smirnov8181/ai-smetchik)
