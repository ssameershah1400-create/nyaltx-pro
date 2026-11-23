import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { findUsablePromoCode } from '@/lib/newsPromoCodes';
import { calculateNewsPrice, getNewsPlanBasePrice } from '@/lib/newsPricing';
import { getNewsPaymentTestMode } from '@/lib/paypalEnvironment';
import {
  getPayPalAccessToken,
  PayPalCryptoAuthenticationError,
  PayPalCryptoConfigurationError,
} from '@/lib/paypalCryptoApi';

interface NewsPayPalOrderRecord {
  state: string;
  paypalOrderId?: string;
  tier: string;
  type: 'news' | 'pr';
  plan: string;
  promoCode?: string;
  amount: string;
  currency: 'USD';
  status: 'creating' | 'created' | 'captured' | 'failed';
  captureRequestId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan = typeof body.plan === 'string' ? body.plan : '';
    const type = body.type === 'pr' ? 'pr' : body.type === 'news' ? 'news' : null;
    const tier = typeof body.tier === 'string' ? body.tier.trim().slice(0, 127) : '';
    const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : '';
    const amountText = typeof body.amount === 'string' ? body.amount.trim() : String(body.amount);
    const amount = Number(amountText);

    if (!type || !tier || tier !== `${type}_${plan}`) {
      return NextResponse.json(
        { error: 'The News Hub checkout details are invalid.' },
        { status: 400 }
      );
    }

    const planPrice = getNewsPlanBasePrice(plan, getNewsPaymentTestMode() !== null);
    if (planPrice === null) {
      return NextResponse.json({ error: 'This News Hub plan is unavailable.' }, { status: 400 });
    }
    if (plan === 'test' && promoCode) {
      return NextResponse.json(
        { error: 'The payment test does not accept promo codes.' },
        { status: 400 }
      );
    }

    if (!/^\d+(?:\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'The checkout amount is invalid.' }, { status: 400 });
    }

    let promoDiscountPercent = 0;
    if (promoCode) {
      const packageId = plan === 'feed' ? 'news:feed' : 'news:slider';
      const { promo, message } = await findUsablePromoCode(promoCode, packageId);
      if (!promo) {
        return NextResponse.json(
          { error: message || 'This promo code is invalid.' },
          { status: 400 }
        );
      }
      promoDiscountPercent = promo.discountPercent;
    }

    const expectedAmount = calculateNewsPrice(planPrice, promoDiscountPercent);
    if (Math.abs(amount - expectedAmount) > 0.001) {
      return NextResponse.json(
        { error: 'The PayPal order amount does not match the selected News Hub plan.' },
        { status: 400 }
      );
    }

    const { accessToken, apiBaseUrl } = await getPayPalAccessToken();
    const state = randomUUID();
    const captureRequestId = randomUUID();
    const amountValue = expectedAmount.toFixed(2);
    const records = await getCollection<NewsPayPalOrderRecord>('news_paypal_checkout_orders');
    const now = new Date();
    await records.insertOne({
      state,
      tier,
      type,
      plan,
      promoCode: promoCode || undefined,
      amount: amountValue,
      currency: 'USD',
      status: 'creating',
      captureRequestId,
      createdAt: now,
      updatedAt: now,
    });

    const paypalResponse = await fetch(`${apiBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': state,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: state,
            invoice_id: state,
            description: `NYALTX ${tier}`.slice(0, 127),
            amount: {
              currency_code: 'USD',
              value: amountValue,
            },
          },
        ],
        application_context: {
          brand_name: 'NYALTX',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
        },
      }),
      cache: 'no-store',
    });

    if (!paypalResponse.ok) {
      const paypalError = await paypalResponse.json().catch(() => ({}));
      console.error('PayPal News Hub order creation failed:', {
        status: paypalResponse.status,
        name: paypalError.name,
        message: paypalError.message,
        debugId: paypalError.debug_id,
      });
      await records.updateOne({ state }, { $set: { status: 'failed', updatedAt: new Date() } });
      return NextResponse.json(
        { error: 'PayPal could not create the News Hub checkout order. Please try again.' },
        { status: 502 }
      );
    }

    const paypalOrder: { id?: string } = await paypalResponse.json();
    if (!paypalOrder.id) {
      await records.updateOne({ state }, { $set: { status: 'failed', updatedAt: new Date() } });
      return NextResponse.json(
        { error: 'PayPal did not return a checkout order ID. Please try again.' },
        { status: 502 }
      );
    }

    await records.updateOne(
      { state },
      { $set: { paypalOrderId: paypalOrder.id, status: 'created', updatedAt: new Date() } }
    );
    return NextResponse.json({ orderId: paypalOrder.id });
  } catch (error) {
    if (error instanceof PayPalCryptoConfigurationError) {
      return NextResponse.json(
        { error: 'PayPal checkout is not configured on the server.' },
        { status: 503 }
      );
    }
    if (error instanceof PayPalCryptoAuthenticationError) {
      return NextResponse.json(
        { error: 'PayPal could not authenticate this checkout. Please try again later.' },
        { status: 502 }
      );
    }
    console.error('News Hub PayPal order creation error:', error);
    return NextResponse.json(
      { error: 'Could not create the PayPal order. Please try again.' },
      { status: 500 }
    );
  }
}
