# Adur.ai — Activation Email Sequence

Audience: users who **signed up but didn't activate** — especially those who never
generated a video. All sends from `Adur <contact@adur.ai>` via Resend.

**Product facts the copy must respect** (from the entitlement system):
- Free plan: 3 image ads + 3 ad copy generations + 3 analyses/mo. **No video ads.**
- Video Ads (UGC) start at **Starter $19/mo (3 videos)** · Growth $49 (10) · Pro $99 (30).
- Studio tabs are literally named: **Image Ads · Copy · Video Ads**.
- So "you didn't make a video" emails are **upgrade** emails for free users —
  never imply a free user can generate a video today.

## The sequence

| # | When | Segment | Subject | Goal | File |
|---|------|---------|---------|------|------|
| 1 | Day 1 (24h) | No generations at all | Your first free ad creative is waiting | First generation | LIVE — `src/app/api/cron/activation-email/route.ts` |
| 2 | Day 3 | Still no generations | This is what a $0 video shoot looks like | Show the hero feature (UGC video), drive ANY first generation | `emails/02-ugc-showcase-day3.html` |
| 3 | Day 5 | Generated image/copy but **no video** | You made the ad. Now make it move. | Upgrade to Starter for Video Ads | `emails/03-image-no-video-upsell.html` |
| 4 | Day 7 | Still no generations | 30 seconds. One link. Three free ads. | Kill friction — paste a product URL, that's it | `emails/04-friction-killer-day7.html` |
| 5 | Day 10 | Ran an analysis, no creatives | Your analysis told you what to fix. This builds the fix. | Cross-sell Creative Studio to analysis users | `emails/05-analysis-no-creative.html` |
| 6 | Day 14 | Still no generations | Quick question before I stop emailing you | Last touch — founder note, ask for a reply | `emails/06-founder-last-touch.html` |

Rules:
- One email per user per step, ever (mirror the `activation_email_sent` flag pattern:
  `app_metadata.activation_step >= n`).
- A user exits the sequence the moment they generate anything (emails 3 & 5 are
  behavioral branches, not part of the "inactive" track).
- Stop everything for users who upgrade.

---

## Email 2 — Day 3 · UGC showcase (still inactive)

- **Subject:** This is what a $0 video shoot looks like
- **Alt subject (test):** UGC ads without creators, shipping, or waiting
- **Preview text:** No creators. No shipping products. No editing. Just a link.

> Hey —
>
> The most expensive part of running Meta ads in 2026 isn't the ad spend.
> It's the creative: finding creators, shipping products, waiting two weeks
> for one usable video.
>
> Adur generates **UGC-style video ads** from nothing but your product link.
> A realistic AI creator presents your product, speaks your script (English,
> Spanish, French, Arabic — even Darija), and it's ready in about a minute.
>
> Your free account already includes **3 image ads and 3 ad copy generations**
> — try those today, and when you're ready for video, Starter is $19/mo.
>
> **[See it in action →](https://adur.ai/creative-studio)**

## Email 3 — Day 5 · made images/copy, no video (behavioral)

- **Subject:** You made the ad. Now make it move.
- **Alt subject:** Your image ads are good. Video converts better.
- **Preview text:** Static ads stop the scroll. Video ads close the sale.

> You've already generated ad creatives in Adur — nice. Here's the
> uncomfortable truth from $70M+ in managed ad spend:
>
> **Video outperforms static on Meta in almost every e-commerce vertical.**
> UGC-style video especially — it doesn't look like an ad, so people watch it.
>
> The Video Ads tab takes the same product link you already used and turns it
> into a UGC video: AI creator, native script, your choice of language and
> format (Feed, Story, Reel).
>
> Starter — $19/mo:
> 🎬 3 UGC video ads every month
> 🎨 5 image ads + unlimited ad copy
> 📊 10 campaign analyses + full 7-Day Battle Plan
>
> **[Make your first video ad →](https://adur.ai/creative-studio)**

## Email 4 — Day 7 · still inactive (friction killer)

- **Subject:** 30 seconds. One link. Three free ads.
- **Alt subject:** Paste a link. Get an ad. That's the whole tutorial.
- **Preview text:** The entire workflow is: paste your product URL, press Generate.

> Most tools die in the setup. So we removed it.
>
> 1. Paste your product URL
> 2. Press **Generate**
> 3. Download your ad
>
> That's the entire workflow. No brief, no brand kit, no onboarding call.
> Your free plan includes 3 image ads and 3 ad copy generations — they're
> sitting there unused.
>
> **[Generate your first ad now →](https://adur.ai/creative-studio)**

## Email 5 — Day 10 · analyzed but never created (behavioral)

- **Subject:** Your analysis told you what to fix. This builds the fix.
- **Alt subject:** "Refresh your creative" — here's the refresh button
- **Preview text:** You found the fatigued campaigns. Now replace the creative in 30 seconds.

> You ran a campaign analysis on Adur — so you've seen the verdict most
> accounts get: *creative fatigue*. Same ads, falling CTR, rising CPA.
>
> The fix isn't a bigger budget. It's fresh creative, shipped fast.
>
> That's exactly what Creative Studio is for: image ads, ad copy variants and
> UGC video ads generated from your product link — informed by what your
> analysis said is working.
>
> **[Generate fresh creative →](https://adur.ai/creative-studio)**

## Email 6 — Day 14 · still inactive (founder last touch)

- **Subject:** Quick question before I stop emailing you
- **Alt subject:** Did we get something wrong?
- **Preview text:** One honest question — then I'll leave you alone.

> Hey, Sohaib here — I build Adur.
>
> You signed up two weeks ago but never generated anything, and I'd rather
> learn from that than pretend it didn't happen. One question:
>
> **What were you hoping Adur would do for you?**
>
> Hit reply and tell me — I read every answer myself. And if you just got
> busy, your 3 free image ads and 3 free copy generations are still waiting:
>
> **[Open Creative Studio →](https://adur.ai/creative-studio)**
>
> Either way, this is the last email in this series. No hard feelings.

---

## Sending — AUTOMATED ✅

The whole sequence runs from `src/app/api/cron/activation-email/route.ts`
(daily Vercel cron, 10:00 UTC — vercel.json):

- One email max per user per day; the highest qualifying step is sent and
  recorded in `app_metadata.activation_step` (monotonic, never re-sent).
- Paying users are marked terminal and exit the sequence permanently.
- Unsubscribes: every email footer links `/api/email/unsubscribe` (HMAC-signed);
  it sets `app_metadata.email_optout` which the cron respects.
- Only accounts 1–21 days old enter; max 100 sends per run.
- Requires `RESEND_API_KEY` + `CRON_SECRET` in the deploy env, and the adur.ai
  domain verified in Resend (sender: contact@adur.ai).

The HTML files in `emails/` mirror the in-code templates for manual
Resend Broadcasts (their `{{unsubscribe_url}}` is Resend's broadcast variable).
