import {
  getPayPalCryptoAccessToken,
  PayPalCryptoAuthenticationError,
  PayPalCryptoConfigurationError,
} from '@/lib/paypalCryptoApi';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await getPayPalCryptoAccessToken();
    return NextResponse.json({ ready: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('PayPal checkout readiness check failed:', error);
    const reason =
      error instanceof PayPalCryptoConfigurationError
        ? 'configuration'
        : error instanceof PayPalCryptoAuthenticationError &&
            (error.status === 401 || error.status === 403)
          ? 'credentials'
          : 'provider';
    const authenticationDetails =
      error instanceof PayPalCryptoAuthenticationError
        ? {
            paypalStatus: error.status,
            paypalError: error.paypalError,
            environment: error.environment,
          }
        : {};
    return NextResponse.json(
      { ready: false, reason, ...authenticationDetails },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
