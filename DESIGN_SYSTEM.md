# Lucid — Design System

Single source of truth for design documentation, artboards, and infographics.
All values are pulled directly from [tailwind.config.js](tailwind.config.js), [src/index.css](src/index.css), and [src/components/ui/](src/components/ui/). Hex values are exact.

---

## 1. Typography

| Property | Value |
|---|---|
| Font family | **Plus Jakarta Sans** (body + headings/display — single family across the whole UI) |
| Source | Google Fonts (`display=swap`) |
| Fallback | system-ui, -apple-system, Segoe UI, Roboto, sans-serif |
| Weight range | 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold) |

Tailwind families: `font-sans` and `font-display` both resolve to Plus Jakarta Sans.

---

## 2. Brand Colors (same in both modes)

| Name | Hex | Tailwind token | Usage |
|---|---|---|---|
| Primary | `#2563eb` | `primary` | Main CTA buttons, links, active states |
| Primary Hover | `#1d4ed8` | `primary-hover` | Button hover state |
| Primary Light | `#3b82f6` | `primary-light` | Highlighted text, icons on dark backgrounds |
| Primary Dark | `#1e40af` | `primary-dark` | Pressed state, deep accent |
| Primary Tint | `#eff6ff` | `primary-50` | Subtle blue background fills |
| Secondary | `#c2410c` | `secondary` | Accent / secondary CTA *(orange-700 — orange-600 failed WCAG AA on white)* |
| Secondary Hover | `#9a3412` | `secondary-hover` | Secondary button hover |
| Secondary Light | `#f97316` | `secondary-light` | Warm accent, icons |
| Secondary Tint | `#fff7ed` | `secondary-50` | Subtle orange background fills |

---

## 3. Status Colors (same in both modes)

| Name | Hex | Tailwind token | Usage |
|---|---|---|---|
| Success | `#10b981` | `success` | Confirmed, completed, verified |
| Error | `#ef4444` | `error` | Errors, destructive actions |
| Error Tint | `#fef2f2` | `error-50` | Error background fills |
| Warning | `#f59e0b` | `warning` | Warnings, pending states |
| Info | `#3b82f6` | `info` | Informational (same as Primary Light) |

---

## 4. Light Mode

### Surfaces
| Layer | Hex | Where used |
|---|---|---|
| Page background | `#f1f5f9` | Body / outer canvas |
| Page dot grid | `#cbd5e1` | Subtle repeating dot texture over page bg |
| Card / container | `#ffffff` | All cards, modals, panels |
| Input / elevated surface | `#ffffff` or `#f9fafb` | Form inputs, nav |
| Skeleton placeholder | `#e5e7eb` | Loading state blocks |

### Text
| Role | Hex | Tailwind |
|---|---|---|
| Heading / primary text | `#111827` | gray-900 |
| Body text | `#374151` | gray-700 |
| Muted / secondary text | `#6b7280` | gray-500 |
| Disabled / placeholder | `#9ca3af` | gray-400 |

### Borders
| Role | Hex |
|---|---|
| Default border | `#e5e7eb` |
| Subtle divider | `#f3f4f6` |

---

## 5. Dark Mode

Enabled via `darkMode: 'class'` (toggling the `dark` class on the root).

### Surfaces
| Layer | Hex | Where used |
|---|---|---|
| Page background | `#0f1117` | Body / outer canvas |
| Page dot grid | `#1e293b` | Subtle repeating dot texture over page bg |
| Card / container | `#1a1f2e` | All cards, modals, panels |
| Input / elevated surface | `#252b3b` | Form inputs, skeleton placeholders |
| Border | `#1e293b` / `#2d3748` | Card borders, input borders, dividers |

### Text
| Role | Hex | Tailwind |
|---|---|---|
| Heading / primary text | `#f1f5f9` | slate-100 |
| Body text | `#cbd5e1` | slate-300 |
| Muted / secondary text | `#94a3b8` | slate-400 |
| Disabled / placeholder | `#64748b` | slate-500 |

### Overrides for dark mode
| Element | Light value | Dark override |
|---|---|---|
| Link / accent text | `#2563eb` | `#3b82f6` (Primary Light) |
| Skeleton shimmer band | `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.07)` |

---

## 6. Border Radius

| Token | Value | Typical use |
|---|---|---|
| `rounded` (DEFAULT) | `8px` | Small chips, inputs (sm) |
| `rounded-lg` | `10px` | Buttons (sm), inputs |
| `rounded-xl` | `12px` | Buttons (md/lg), inputs (default) |
| `rounded-2xl` | `16px` | Cards, modals, panels |
| `rounded-3xl` | `24px` | Hero cards, large feature containers |
| `rounded-full` | — | Avatars, status badges, icon buttons |

---

## 7. Shadows & Glows

Elevations are softened, **slate-tinted** (`rgb(15 23 42)`), low-alpha, and **multi-layer**.
*(These are the corrected source-of-truth values from [tailwind.config.js](tailwind.config.js#L52-L63) — earlier briefs listed a simplified single-layer `rgb(0 0 0)` version.)*

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px 0 rgb(15 23 42 / 0.04)` | Subtle lift |
| `shadow-md` | `0 2px 4px -1px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04)` | Cards (default) |
| `shadow-lg` | `0 8px 20px -4px rgb(15 23 42 / 0.08), 0 2px 6px rgb(15 23 42 / 0.04)` | Dropdowns, popovers |
| `shadow-xl` | `0 16px 36px -8px rgb(15 23 42 / 0.10), 0 4px 10px rgb(15 23 42 / 0.05)` | Modals, hero cards |

### Colored glows (hover accents)
| Token | Value | Usage |
|---|---|---|
| `shadow-glow-blue` | `0 4px 18px -2px rgba(37,99,235,0.45)` | Primary buttons |
| `shadow-glow-green` | `0 4px 18px -2px rgba(16,185,129,0.45)` | Success elements |
| `shadow-glow-orange` | `0 4px 18px -2px rgba(234,88,12,0.45)` | Secondary buttons |
| `shadow-glow-purple` | `0 4px 18px -2px rgba(139,92,246,0.45)` | Stat cards |
| `shadow-glow-red` | `0 4px 18px -2px rgba(239,68,68,0.45)` | Error / danger buttons |

---

## 8. Background Texture (both modes)

The page background uses a repeating dot grid rendered as an SVG:
- Dot size: 1px radius circle
- Grid spacing: 22 × 22 px
- Light dot color: `#cbd5e1` over base `#f1f5f9`
- Dark dot color: `#1e293b` over base `#0f1117`

---

## 9. Motion

| Element | Spec |
|---|---|
| Standard transition | `transition-all duration-200` |
| Card hover transition | `duration-300` |
| Button press | `active:scale-[0.97]` |
| Icon button hover/tap | `scale 1.1` / `scale 0.9` (Framer Motion) |
| Modal enter | spring — `stiffness: 300, damping: 30`; content `scale 0.9 → 1`, `y: 20 → 0` |
| Modal backdrop | `opacity 0 → 1`, `backdrop-blur-sm` |
| Status dot (active states) | `animate-pulse-dot` |
| Loading spinner | `animate-spin`, 2px border, transparent top |
| Focus ring | `ring-2 ring-primary/50 ring-offset-2` (dark offset `#0f1117`) |

---

## 10. Component Specs

The reusable primitive library lives in [src/components/ui/](src/components/ui/): Button, Input, Modal, Card, Avatar, StatCard, StatusBadge, EmptyState, FilterBar, PageHeader, NotificationBadge.

### Button — [Button.jsx](src/components/ui/Button.jsx)
Base: `font-semibold`, 200ms transitions, `active:scale-[0.97]`, focus-visible ring, disabled `opacity-50`.

**Variants**
| Variant | Style |
|---|---|
| `primary` | `bg-primary` → hover `primary-hover`, white text, `shadow-md` → `shadow-glow-blue` |
| `secondary` | `bg-secondary` → hover `secondary-hover`, white text, `shadow-md` → `shadow-glow-orange` |
| `outline` | 2px primary border, primary text, hover `primary-50` tint |
| `ghost` | primary text, hover `primary-50` tint, no border |
| `danger` | `bg-red-700` → hover `red-800`, white text, `shadow-md` → `shadow-glow-red` |

**Sizes**
| Size | Padding | Text | Radius |
|---|---|---|---|
| `sm` | `px-4 py-2` | `text-sm` | `rounded-lg` |
| `md` | `px-6 py-3` | `text-base` | `rounded-xl` |
| `lg` | `px-8 py-4` | `text-lg` | `rounded-xl` |

Props: `fullWidth`, `loading` (shows spinner + "Loading…").

### Input — [Input.jsx](src/components/ui/Input.jsx)
- Field: `w-full px-4 py-2.5`, 2px border, `rounded-xl`, 200ms transition.
- Light: `bg-white`, border `gray-300`, focus border `primary` + `ring-blue-100`.
- Dark: `bg-[#252b3b]`, border `#2d3748`, focus `ring-blue-900/40`.
- Error: border + ring use `error`; message in `text-error text-sm`.
- Supports `label` (medium weight, required asterisk in `text-error`), `helperText`, `endIcon`, auto `useId` for label association.

### Card — [Card.jsx](src/components/ui/Card.jsx)
- `bg-white dark:bg-[#1a1f2e]`, `rounded-2xl`, `p-6`, `shadow-md`, 1px border (`gray-100` / `#1e293b`).
- `hoverable`: `hover:shadow-xl hover:-translate-y-1`, 300ms, pointer cursor.

### Modal — [Modal.jsx](src/components/ui/Modal.jsx)
- Backdrop: `bg-black/50 backdrop-blur-sm`, `z-50`, centered, fades in.
- Panel: `bg-white dark:bg-[#1a1f2e]`, `rounded-2xl`, `shadow-xl`, `ring-1`, `p-8`, `max-h-[90vh]` scroll.
- Spring enter (see §9). Title `text-2xl font-bold`. Close button top-right with hover scale.
- Sizes: `sm` max-w-md · `md` max-w-2xl · `lg` max-w-4xl · `xl` max-w-6xl.

### Avatar — [Avatar.jsx](src/components/ui/Avatar.jsx)
- `rounded-full`, gradient fallback `from-primary to-purple-600`, white bold initials (max 2).
- Sizes: `sm` w-8 · `md` w-12 · `lg` w-16 · `xl` w-24. Image is `object-cover`, lazy-loaded.

### StatusBadge — [StatusBadge.jsx](src/components/ui/StatusBadge.jsx)
Pill: `inline-flex gap-1.5 px-3 py-1 rounded-full text-xs font-semibold` + leading colored dot.

**Status variants**
| Status | Accent | Dot |
|---|---|---|
| `pending` | amber | pulsing |
| `confirmed` | emerald | solid |
| `in-progress` | blue | pulsing |
| `completed` | gray/slate | solid |
| `cancelled` | red | solid |
| `paid` | purple | solid |

**Urgency variants**: `normal` (blue), `urgent` (orange, pulsing), `emergency` (red, pulsing).

---

## 11. Quick Reference — Palette Summary

### Light mode
```
Page bg       #f1f5f9
Card          #ffffff
Text          #111827  #374151  #6b7280
Border        #e5e7eb
Primary       #2563eb
Secondary     #c2410c
Success       #10b981
Error         #ef4444
Warning       #f59e0b
```

### Dark mode
```
Page bg       #0f1117
Card          #1a1f2e
Surface       #252b3b
Border        #1e293b
Text          #f1f5f9  #cbd5e1  #94a3b8
Primary       #3b82f6   (use light variant in dark mode)
Secondary     #f97316   (use light variant in dark mode)
Success       #10b981
Error         #ef4444
Warning       #f59e0b
```
