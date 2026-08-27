export const PRO_PLAN_PRICE_PKR =
  Number(import.meta.env.VITE_PRO_PLAN_PRICE_PKR) || 500;

/** Flip to true when Lemon Squeezy billing is ready to show paywalls again. */
export const SUBSCRIPTION_ENABLED = false;

const EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/PKR";
const CACHE_TTL_MS = 60 * 60 * 1000;

const USD_FALLBACK =
  import.meta.env.VITE_PRO_PLAN_PRICE_USD_FALLBACK || "1.80";

let cachedRate: { usdPerPkr: number; fetchedAt: number } | null = null;

export async function fetchPkrToUsdRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_TTL_MS) {
    return cachedRate.usdPerPkr;
  }

  const response = await fetch(EXCHANGE_RATE_URL);
  if (!response.ok) {
    throw new Error("Could not fetch exchange rate.");
  }

  const data = (await response.json()) as { rates?: { USD?: number } };
  const usdPerPkr = data.rates?.USD;

  if (typeof usdPerPkr !== "number" || usdPerPkr <= 0) {
    throw new Error("Exchange rate response was invalid.");
  }

  cachedRate = { usdPerPkr, fetchedAt: Date.now() };
  return usdPerPkr;
}

export async function getProPlanUsdPrice(): Promise<number> {
  const rate = await fetchPkrToUsdRate();
  return PRO_PLAN_PRICE_PKR * rate;
}

export function formatUsdPrice(amount: number): string {
  return amount.toFixed(2);
}

export function getProPlanUsdFallback(): string {
  return USD_FALLBACK;
}

export function formatProPlanPriceLabel(usdAmount: string | number): string {
  const usd =
    typeof usdAmount === "number" ? formatUsdPrice(usdAmount) : usdAmount;
  return `$${usd} / month`;
}

export function formatProPlanPriceDetail(usdAmount: string | number): string {
  const usd =
    typeof usdAmount === "number" ? formatUsdPrice(usdAmount) : usdAmount;
  return `$${usd} / month · Rs. ${PRO_PLAN_PRICE_PKR.toLocaleString()}`;
}
