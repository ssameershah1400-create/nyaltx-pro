export const NEWS_NYAX_DISCOUNT = 0.2;

export function getNewsPlanBasePrice(plan: string, testPlanEnabled = false) {
  if (plan === 'feed') return 99;
  if (plan === 'slider' || plan === 'prem') return 199;
  if (plan === 'test' && testPlanEnabled) return 1;
  return null;
}

export function calculateNewsPrice(
  basePrice: number,
  promoDiscountPercent = 0,
  payWithNyax = false
) {
  const promoPrice = basePrice * (1 - promoDiscountPercent / 100);
  const discountedPrice = payWithNyax
    ? promoPrice * (1 - NEWS_NYAX_DISCOUNT)
    : promoPrice;

  return Math.round((discountedPrice + Number.EPSILON) * 100) / 100;
}
