import { useEffect, useState } from "react";
import {
  formatProPlanPriceDetail,
  formatProPlanPriceLabel,
  formatUsdPrice,
  getProPlanUsdFallback,
  getProPlanUsdPrice,
  PRO_PLAN_PRICE_PKR,
  SUBSCRIPTION_ENABLED,
} from "@/lib/pricing";

export function useProPlanPrice() {
  const [usdPrice, setUsdPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(SUBSCRIPTION_ENABLED);

  useEffect(() => {
    if (!SUBSCRIPTION_ENABLED) return;

    let cancelled = false;

    void getProPlanUsdPrice()
      .then((amount) => {
        if (!cancelled) {
          setUsdPrice(formatUsdPrice(amount));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsdPrice(getProPlanUsdFallback());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedUsd = usdPrice ?? getProPlanUsdFallback();

  return {
    loading,
    pkrPrice: PRO_PLAN_PRICE_PKR,
    usdPrice: resolvedUsd,
    priceLabel: formatProPlanPriceLabel(resolvedUsd),
    priceDetail: formatProPlanPriceDetail(resolvedUsd),
  };
}
