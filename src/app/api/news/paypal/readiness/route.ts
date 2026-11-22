import { getPayPalCryptoAccessToken } from '@/lib/paypalCryptoApi';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await getPayPalCryptoAccessToken();
    return NextResponse.json({ ready: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('PayPal checkout readiness check failed:', error);
    return NextResponse.json(
      { ready: false },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
