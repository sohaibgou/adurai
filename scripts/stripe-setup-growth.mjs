#!/usr/bin/env node
/**
 * Stripe setup for the new 4-tier pricing.
 *
 * Creates ONLY what's missing for the Growth tier + annual billing.
 * It does NOT modify or delete the existing Free or Autopilot ($99) products,
 * and it does NOT change the existing Starter/Pro MONTHLY prices.
 *
 * What it creates:
 *   1. Growth product + $49/mo recurring price       -> STRIPE_GROWTH_PRICE_ID
 *   2. Growth $468/yr recurring price (= $39/mo)      -> STRIPE_GROWTH_ANNUAL_PRICE_ID
 *   3. Starter $180/yr price on the EXISTING product  -> STRIPE_STARTER_ANNUAL_PRICE_ID
 *   4. Autopilot $948/yr price on the EXISTING product-> STRIPE_PRO_ANNUAL_PRICE_ID
 *
 * Existing monthly products are reused by looking up their product from the
 * existing monthly price IDs (STRIPE_STARTER_PRICE_ID / STRIPE_PRO_PRICE_ID),
 * so nothing about the current monthly plans changes.
 *
 * SAFETY: dry-run by default. Prints the plan and exits without touching Stripe.
 * Pass --apply to actually create the products/prices on the LIVE account.
 *
 * Usage:
 *   node scripts/stripe-setup-growth.mjs            # dry run, shows the plan
 *   node scripts/stripe-setup-growth.mjs --apply    # creates on live Stripe
 *
 * Requires in env (e.g. via `node --env-file=.env.local`):
 *   STRIPE_SECRET_KEY, STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID
 */

import Stripe from "stripe";

const APPLY = process.argv.includes("--apply");

const SECRET   = process.env.STRIPE_SECRET_KEY;
const STARTER_MONTHLY = process.env.STRIPE_STARTER_PRICE_ID;
const PRO_MONTHLY     = process.env.STRIPE_PRO_PRICE_ID;

if (!SECRET) { console.error("Missing STRIPE_SECRET_KEY"); process.exit(1); }
if (!STARTER_MONTHLY) { console.error("Missing STRIPE_STARTER_PRICE_ID"); process.exit(1); }
if (!PRO_MONTHLY) { console.error("Missing STRIPE_PRO_PRICE_ID"); process.exit(1); }

const stripe = new Stripe(SECRET);
const mode = SECRET.startsWith("sk_live_") ? "LIVE" : "TEST";

console.log(`\nStripe mode: ${mode}   (${APPLY ? "APPLYING CHANGES" : "DRY RUN — no changes"})\n`);

async function productOfPrice(priceId, label) {
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  const productId = typeof price.product === "string" ? price.product : price.product.id;
  console.log(`  ${label}: price ${priceId} -> product ${productId} (${price.unit_amount/100} ${price.currency}/${price.recurring?.interval})`);
  return productId;
}

async function main() {
  // Resolve existing products WITHOUT modifying them.
  const starterProduct = await productOfPrice(STARTER_MONTHLY, "Starter");
  const proProduct     = await productOfPrice(PRO_MONTHLY,     "Autopilot");

  const out = {};

  if (!APPLY) {
    console.log("\nWould create:");
    console.log("  1. NEW product 'Growth' + $49.00/mo price            -> STRIPE_GROWTH_PRICE_ID");
    console.log("  2. Growth $468.00/yr price (=$39/mo)                 -> STRIPE_GROWTH_ANNUAL_PRICE_ID");
    console.log(`  3. Starter $180.00/yr price on product ${starterProduct} -> STRIPE_STARTER_ANNUAL_PRICE_ID`);
    console.log(`  4. Autopilot $948.00/yr price on product ${proProduct}   -> STRIPE_PRO_ANNUAL_PRICE_ID`);
    console.log("\nRe-run with --apply to create these on the", mode, "account.\n");
    return;
  }

  // 1. Growth product + monthly price
  const growthProduct = await stripe.products.create({
    name: "Growth",
    description: "Unlimited analyses, 20 images, 10 UGC videos, Meta read-only insights.",
  });
  const growthMonthly = await stripe.prices.create({
    product: growthProduct.id,
    unit_amount: 4900,
    currency: "usd",
    recurring: { interval: "month" },
  });
  out.STRIPE_GROWTH_PRICE_ID = growthMonthly.id;

  // 2. Growth annual ($468/yr)
  const growthAnnual = await stripe.prices.create({
    product: growthProduct.id,
    unit_amount: 46800,
    currency: "usd",
    recurring: { interval: "year" },
  });
  out.STRIPE_GROWTH_ANNUAL_PRICE_ID = growthAnnual.id;

  // 3. Starter annual ($180/yr) on existing product
  const starterAnnual = await stripe.prices.create({
    product: starterProduct,
    unit_amount: 18000,
    currency: "usd",
    recurring: { interval: "year" },
  });
  out.STRIPE_STARTER_ANNUAL_PRICE_ID = starterAnnual.id;

  // 4. Autopilot annual ($948/yr) on existing product
  const proAnnual = await stripe.prices.create({
    product: proProduct,
    unit_amount: 94800,
    currency: "usd",
    recurring: { interval: "year" },
  });
  out.STRIPE_PRO_ANNUAL_PRICE_ID = proAnnual.id;

  console.log("\nDone. Add these to .env.local (and your hosting env):\n");
  for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
