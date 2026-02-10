# ContractorCheck Design System

Wispr Flow–inspired. Premium, clean, serif + sans-serif pairing.

---

## Colors

### Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Background** | `#FFFFEB` | Page background (warm light yellow) |
| **Primary (Dark Teal)** | `#034F46` | Dark sections, primary accent, icon backgrounds |
| **Accent (Lavender)** | `#F0D7FF` | Primary CTA buttons, accent cards, highlights |
| **Text Primary** | `#1A1A1A` | Headings, body text |
| **Text Muted** | `#1A1A1A/50` | Secondary text, descriptions |
| **Dark Section** | `#034F46` | Stats bar, CTA sections, contrast areas |

### Semantic Colors

| State | Color | Hex |
|-------|-------|-----|
| Success / Fair | Dark Teal | `#034F46` |
| Warning / Slight overcharge | Orange | `#FA5424` |
| Error / Major overcharge | Red | `#EF4444` (red-500) |

---

## Typography

### Font Families

```css
/* Headings — EB Garamond (serif) */
font-family: var(--font-heading), Georgia, serif;

/* Body — Figtree (sans-serif) */
font-family: var(--font-body), system-ui, sans-serif;
```

### CSS Utilities

```css
.font-heading { font-family: var(--font-heading), Georgia, serif; }
```

### Scale

| Element | Size (Mobile) | Size (Desktop) | Weight | Font |
|---------|---------------|----------------|--------|------|
| H1 Hero | 48px (3rem) | 96-120px | 400 | EB Garamond |
| H2 Section | 36px (2.25rem) | 48-64px | 400 | EB Garamond |
| H3 Card | 20-24px | 24px | 600 | EB Garamond |
| Body Large | 20px | 24px | 400 | Figtree |
| Body | 18px | 18-20px | 400 | Figtree |
| Small/Label | 14px | 14px | 500-600 | Figtree |

### Italic Accent

Use `<em>` with EB Garamond italic for emphasis in headings:

```tsx
<em className="italic text-[#034F46]">home renovation</em>
```

### Line Height

- Headings: `1.05`
- Body: `1.5` (relaxed)

---

## Spacing

Base unit: `4px`

| Name | Value | Tailwind |
|------|-------|----------|
| xs | 4px | `p-1` |
| sm | 8px | `p-2` |
| md | 16px | `p-4` |
| lg | 24px | `p-6` |
| xl | 32px | `p-8` |
| 2xl | 48px | `p-12` |
| 3xl | 64px | `p-16` |
| 4xl | 96px | `p-24` |

---

## Border Radius

| Element | Radius | Tailwind |
|---------|--------|----------|
| Buttons | 12px | `rounded-xl` |
| Cards | 14px | `rounded-[14px]` |
| Inner cards | 10px | `rounded-[10px]` |
| Tags/Badges | 9999px | `rounded-full` |
| Icons | 12px | `rounded-xl` |
| Logo | 12px | `rounded-xl` |

---

## Buttons

### Primary (Lavender)

```html
<button class="cursor-pointer bg-[#F0D7FF] border border-[#1A1A1A] text-[#1A1A1A] font-semibold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-all">
  Button Text
</button>
```

### Secondary (Outline)

```html
<button class="cursor-pointer bg-[#FFFFEB] border border-[#1A1A1A] text-[#1A1A1A] font-semibold px-8 py-4 rounded-xl hover:bg-[#1A1A1A]/5 transition-all">
  Button Text
</button>
```

### Ghost (Text only)

```html
<button class="cursor-pointer text-[#1A1A1A]/70 hover:text-[#1A1A1A] font-medium px-4 py-2 transition-colors">
  Button Text
</button>
```

### With Arrow Icon

```html
<button class="group ... flex items-center gap-2">
  Text
  <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</button>
```

### Diagonal Arrow (CTA)

```html
<button class="group ... inline-flex items-center gap-2">
  Text
  <ArrowUpRight class="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
</button>
```

---

## Cards

### Default Card

```html
<div class="p-8 rounded-[14px] bg-white border border-[#1A1A1A]/10 hover:-translate-y-1 transition-all duration-300">
  <!-- content -->
</div>
```

### Warning Card

```html
<div class="p-8 rounded-[14px] bg-[#FA5424]/5 border border-[#FA5424]/20">
  <!-- content -->
</div>
```

### Accent Card (Lavender)

```html
<div class="p-8 rounded-[14px] bg-[#F0D7FF]/20 border border-[#F0D7FF]">
  <!-- content -->
</div>
```

---

## Shadows

Minimal shadows. Prefer clean borders:

```css
/* No shadow on cards by default — use border only */
border border-[#1A1A1A]/10

/* Only where needed */
shadow-lg shadow-[#1A1A1A]/5
```

---

## Animations (CSS only)

### Fade-in on Scroll

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out both;
}
```

### IntersectionObserver (React)

```tsx
/* useInView hook → toggle classes */
opacity-0 translate-y-6 → opacity-100 translate-y-0
transition-all duration-700
```

### Staggered Reveal

```css
style={{ transitionDelay: `${i * 100}ms` }}
```

### Hover Lift

```css
hover:-translate-y-1 transition-all duration-300
```

### Hover Scale (Icons)

```css
group-hover:scale-105 transition-transform
```

### Arrow Diagonal

```css
group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform
```

### Pulse (Status dot)

```css
animate-pulse
```

### Transitions

- Fast: `150ms`
- Default: `300ms`
- Slow: `700ms` (scroll reveals)

---

## Layout

### Container

```html
<div class="max-w-7xl mx-auto px-6">
```

### Section Padding

```css
py-24 md:py-32  /* Large sections */
py-16           /* Smaller sections (stats) */
```

### Grid

```html
<!-- 2 columns -->
<div class="grid md:grid-cols-2 gap-8">

<!-- 3 columns -->
<div class="grid md:grid-cols-3 gap-8">

<!-- 4 columns (steps) -->
<div class="grid md:grid-cols-4 gap-8">
```

---

## Dark Sections

Use teal instead of black for contrast sections:

```html
<section class="py-24 bg-[#034F46] text-white">
  <!-- Use text-white/50 for muted text -->
  <!-- Use border-white/10 for borders -->
  <!-- Use bg-white/5 for card backgrounds -->
</section>
```

---

## Icons

Using **Lucide React**:

```tsx
import { ArrowRight, Shield, Clock } from "lucide-react";

// Standard size
<Icon className="w-5 h-5" />

// Large (in cards)
<Icon className="w-8 h-8" />

// With teal color
<Icon className="w-4 h-4 text-[#034F46]" />

// On dark bg (lavender)
<Icon className="w-7 h-7 text-[#F0D7FF]" />
```

---

## Badges/Tags

```html
<!-- Status badge -->
<div class="inline-flex items-center gap-2 bg-[#034F46]/5 rounded-full px-4 py-2">
  <span class="w-2 h-2 rounded-full bg-[#034F46] animate-pulse" />
  <span class="text-sm font-medium text-[#1A1A1A]/70">AI-powered</span>
</div>
```

---

## Responsive Breakpoints

| Name | Min-width | Tailwind |
|------|-----------|----------|
| Mobile | 0 | default |
| SM | 640px | `sm:` |
| MD | 768px | `md:` |
| LG | 1024px | `lg:` |
| XL | 1280px | `xl:` |

---

## Do's and Don'ts

### Do

- Use `cursor-pointer` on all interactive elements
- Use `font-heading` (EB Garamond) for all headings
- Use italic `<em>` for accent words in headings
- Add hover states with smooth transitions
- Use semantic color coding (teal=good, orange=warning, red=bad)
- Use warm yellow background `#FFFFEB`
- Keep buttons `rounded-xl` (12px)
- Keep cards `rounded-[14px]` (14px)
- Use clean borders over heavy shadows

### Don't

- No `rounded-full` on action buttons (only badges/pills)
- No pure white `#FFFFFF` page backgrounds (use `#FFFFEB`)
- No `#161616` dark sections (use `#034F46` teal)
- No `#0D8DFF` blue (replaced by `#034F46` teal)
- No `#33C791` green accents (replaced by `#F0D7FF` lavender)
- No heavy shadows (`shadow-2xl`) — use subtle borders
- Don't forget `transition-*` on hover effects
