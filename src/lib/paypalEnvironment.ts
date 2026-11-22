export type PayPalEnvironment = 'sandbox' | 'live';

export function getPayPalEnvironment(): PayPalEnvironment {
  if (process.env.NODE_ENV === 'production') return 'live';

  const configuredEnvironment = process.env.PAYPAL_ENVIRONMENT?.trim().toLowerCase();
  if (configuredEnvironment) {
    if (configuredEnvironment === 'sandbox' || configuredEnvironment === 'live') {
      return configuredEnvironment;
    }
    throw new Error('Invalid PayPal environment. Set PAYPAL_ENVIRONMENT to sandbox or live.');
  }

  return 'sandbox';
}

export function isNewsSandboxTestEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    getPayPalEnvironment() === 'sandbox' &&
    process.env.NEXT_PUBLIC_ENABLE_NEWS_TEST_PLAN === 'true'
  );
}
