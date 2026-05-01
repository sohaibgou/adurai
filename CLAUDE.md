@AGENTS.md
# Adur.ai Design System

## Brand
Product: AI Media Buying SaaS
Target: E-commerce brands and media buyers globally
Tone: Premium, confident, data-driven

## Design References
Copy the design quality of: Linear.app, Vercel.com, Stripe dashboard

## Colors
- Background light: #f8f8fc
- Background dark: #070709
- Primary accent: #6c5ce7 purple
- Secondary accent: #00cec9 teal
- Text primary: #0a0a0f
- Text muted: #6b7280
- Border: #f0f0f5
- Success: #00b894
- Error: #e17055
- Warning: #fdcb6e

## Typography
- Headings: Syne font, weight 700-800, letter-spacing -0.03em
- Body: Inter font, weight 400-500
- Numbers/metrics: Syne font, weight 700
- Labels: Inter, uppercase, letter-spacing 0.08em, size 11px

## Components
- Cards: white bg, border 1px solid #f0f0f5, border-radius 16px, shadow 0 1px 3px rgba(0,0,0,0.06)
- Buttons: border-radius 100px, always has hover transition 0.2s
- Tables: alternating rows #ffffff and #fafafa, sticky header, colored badges for status
- Charts: use purple #6c5ce7 and teal #00cec9 only, no default colors
- Forms: purple focus ring, real-time validation, floating labels

## Spacing
- Section padding: 64px vertical
- Card padding: 24px
- Gap between cards: 16px
- 8px grid system throughout

## Rules
- Never use generic Tailwind defaults
- Every hover state must have a transition
- Every number/metric must animate on load
- Status badges: green for good, red for cut, orange for warning
- No raw data visible to user ever
- Mobile responsive on everything

## Current Issues to Fix
- Overview dashboard feels generic and basic
- Charts need better colors and more breathing room
- Typography hierarchy is weak
- Sections need more padding and separation
- Metric cards need animated counters
