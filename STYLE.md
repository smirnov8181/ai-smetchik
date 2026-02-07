# ContractorCheck Design System

Based on gethyped.nl style. Modern, bold, high-energy.

---

## Colors

### Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Primary Blue** | `#0D8DFF` | Primary CTA buttons, links, accents |
| **Accent Green** | `#33C791` | Success states, secondary CTA, savings |
| **Secondary Orange** | `#FA5424` | Warnings, secondary buttons, highlights |
| **Background** | `#FAF4EC` | Page background (warm cream) |
| **Text Primary** | `#161616` | Headings, body text |
| **Text Muted** | `#161616/50` | Secondary text, descriptions |
| **Dark Section** | `#161616` | Footer, stats bar, contrast sections |

### Semantic Colors

| State | Color | Hex |
|-------|-------|-----|
| Success / Fair | Green | `#33C791` |
| Warning / Slight overcharge | Orange | `#FA5424` |
| Error / Major overcharge | Red | `#EF4444` (red-500) |

---

## Typography

### Font Family

```css
font-family: Inter, system-ui, sans-serif;
```

### Scale

| Element | Size (Mobile) | Size (Desktop) | Weight |
|---------|---------------|----------------|--------|
| H1 Hero | 48px (3rem) | 72px (4.5rem) | 700 |
| H2 Section | 36px (2.25rem) | 56px (3.5rem) | 700 |
| H3 Card | 24px (1.5rem) | 24px (1.5rem) | 700 |
| Body Large | 20px (1.25rem) | 24px (1.5rem) | 400 |
| Body | 16px (1rem) | 16px (1rem) | 400 |
| Small/Label | 14px (0.875rem) | 14px | 500-600 |
| Tiny/Tag | 12px (0.75rem) | 12px | 600 |

### Line Height

- Headings: `1.1`
- Body: `1.5`

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
| Buttons | 40px (full) | `rounded-full` |
| Cards | 24px | `rounded-3xl` |
| Inputs | 12px | `rounded-xl` |
| Tags/Badges | 9999px | `rounded-full` |
| Icons | 12-16px | `rounded-xl` / `rounded-2xl` |

---

## Buttons

### Primary (Blue)

```html
<button class="cursor-pointer bg-[#0D8DFF] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all">
  Button Text
</button>
```

### Secondary (Green)

```html
<button class="cursor-pointer bg-[#33C791] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all">
  Button Text
</button>
```

### Tertiary (Orange)

```html
<button class="cursor-pointer bg-[#FA5424] text-[#161616] font-semibold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-all">
  Button Text
</button>
```

### Ghost (Text only)

```html
<button class="cursor-pointer text-[#161616]/70 hover:text-[#161616] font-medium px-4 py-2 transition-colors">
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

---

## Cards

### Default Card

```html
<div class="p-8 rounded-3xl bg-white border border-[#161616]/10 hover:-translate-y-2 transition-all duration-300">
  <!-- content -->
</div>
```

### Colored Card (Success)

```html
<div class="p-8 rounded-3xl bg-[#33C791]/10 border-2 border-[#33C791]/20">
  <!-- content -->
</div>
```

### Colored Card (Warning)

```html
<div class="p-8 rounded-3xl bg-[#FA5424]/10 border-2 border-[#FA5424]/20">
  <!-- content -->
</div>
```

---

## Shadows

```css
/* Card shadow */
shadow-2xl shadow-[#161616]/10

/* Subtle shadow */
shadow-lg shadow-[#161616]/5
```

---

## Animations

### Hover Lift

```css
hover:-translate-y-2 transition-transform duration-300
```

### Hover Scale (Icons)

```css
group-hover:scale-110 transition-transform
```

### Arrow Slide

```css
group-hover:translate-x-1 transition-transform
```

### Pulse (Status dot)

```css
animate-pulse
```

### Transitions

- Fast: `150ms`
- Default: `300ms`
- Slow: `500ms`

---

## Layout

### Container

```html
<div class="max-w-7xl mx-auto px-6">
```

### Section Padding

```css
py-24  /* 96px vertical */
py-16  /* 64px for smaller sections */
```

### Grid

```html
<!-- 2 columns -->
<div class="grid md:grid-cols-2 gap-8">

<!-- 3 columns -->
<div class="grid md:grid-cols-3 gap-8">

<!-- 4 columns (stats) -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
```

---

## Dark Sections

For contrast sections (stats, footer, CTA):

```html
<section class="py-16 bg-[#161616] text-white">
  <!-- Use text-white/50 for muted text -->
  <!-- Use border-white/20 for borders -->
</section>
```

---

## Icons

Using **Lucide React**:

```tsx
import { ArrowRight, Shield, Clock, Lock } from "lucide-react";

// Standard size
<Icon className="w-5 h-5" />

// Large (in cards)
<Icon className="w-8 h-8" />

// With color
<Icon className="w-4 h-4 text-[#33C791]" />
```

---

## Badges/Tags

```html
<!-- Status badge -->
<div class="inline-flex items-center gap-2 bg-[#161616]/5 rounded-full px-4 py-2">
  <span class="w-2 h-2 rounded-full bg-[#33C791] animate-pulse" />
  <span class="text-sm font-medium">Label</span>
</div>

<!-- City tag -->
<span class="px-5 py-2 rounded-full border border-white/20 text-white/70 text-sm">
  Phoenix
</span>
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

### Do ✓

- Use `cursor-pointer` on all interactive elements
- Add hover states with smooth transitions
- Use semantic color coding (green=good, orange=warning, red=bad)
- Keep buttons rounded-full (pill shape)
- Use warm cream background `#FAF4EC`

### Don't ✗

- No sharp corners on buttons (always pill)
- No pure white `#FFFFFF` backgrounds (use `#FAF4EC`)
- No emojis as icons (use Lucide)
- No shadows on dark sections
- Don't forget `transition-*` on hover effects
