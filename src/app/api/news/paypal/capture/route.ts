import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import {
  getPayPalAccessToken,
  PayPalCryptoAuthenticationError,
  PayPalCryptoConfigurationError,
} from '@/lib/paypalCryptoApi';

interface NewsPayPalOrderRecord {
  state: string;
  paypalOrderId: string;
  amount: string;
  currency: 'USD';
  status: 'creating' | 'created' | 'captured' | 'failed';
  captureRequestId: string;
}

interface PayPalOrderDetails {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
}

function orderMatchesRecord(order: PayPalOrderDetails, record: NewsPayPalOrderRecord) {
  const purchaseUnit = order.purchase_units?.[0];
  return (
    order.id === record.paypalOrderId &&
    purchaseUnit?.custom_id === record.state &&
    purchaseUnit.amount?.currency_code === record.currency &&
    purchaseUnit.amount.value === record.amount
  );
}

function findMatchingCapture(order: PayPalOrderDetails, record: NewsPayPalOrderRecord) {
  return order.purchase_units
    ?.flatMap(purchaseUnit => purchaseUnit.payments?.captures ?? [])
    .find(
      capture =>
        capture.status?.toUpperCase() === 'COMPLETED' &&
        capture.amount?.currency_code === record.currency &&
        capture.amount.value === record.amount
    );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    if (!orderId || orderId.length > 64) {
      return NextResponse.json({ error: 'Invalid PayPal checkout order ID.' }, { status: 400 });
    }

    const records = await getCollection<NewsPayPalOrderRecord>('news_paypal_checkout_orders');
    const record = await records.findOne({ paypalOrderId: orderId });
    if (!record || record.status === 'failed') {
      return NextResponse.json({ error: 'News Hub PayPal order was not found.' }, { status: 404 });
    }
    if (record.status === 'captured') {
      return NextResponse.json({
        success: true,
        order: { id: orderId, status: 'COMPLETED' },
      });
    }

    const { accessToken, apiBaseUrl } = await getPayPalAccessToken();
    const orderUrl = `${apiBaseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`;
    const orderResponse = await fetch(orderUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!orderResponse.ok) {
      return NextResponse.json(
        {
          error: 'Could not verify the PayPal order. Retry the confirmation without paying again.',
        },
        { status: 502 }
      );
    }

    let order: PayPalOrderDetails = await orderResponse.json();
    if (!orderMatchesRecord(order, record)) {
      return NextResponse.json(
        { error: 'The PayPal order does not match this News Hub checkout.' },
        { status: 400 }
      );
    }

    if (order.status?.toUpperCase() !== 'COMPLETED') {
      if (order.status?.toUpperCase() !== 'APPROVED') {
        return NextResponse.json(
          { error: 'PayPal has not approved this payment yet.' },
          { status: 409 }
        );
      }

      const captureResponse = await fetch(`${orderUrl}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': record.captureRequestId,
        },
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      if (!captureResponse.ok) {
        const captureError = await captureResponse.json().catch(() => ({}));
        console.error('PayPal News Hub capture failed:', {
          status: captureResponse.status,
          name: captureError.name,
          message: captureError.message,
          debugId: captureError.debug_id,
        });
        return NextResponse.json(
          {
            error:
              'PayPal could not complete the capture. Retry confirmation without paying again.',
          },
          { status: 502 }
        );
      }
      const capturedOrder: PayPalOrderDetails = await captureResponse.json();
      if (
        capturedOrder.id !== record.paypalOrderId ||
        capturedOrder.status?.toUpperCase() !== 'COMPLETED' ||
        !findMatchingCapture(capturedOrder, record)
      ) {
        return NextResponse.json(
          { error: 'PayPal has not confirmed the expected payment amount.' },
          { status: 400 }
        );
      }

      order = {
        ...order,
        status: capturedOrder.status,
        purchase_units: order.purchase_units?.map((purchaseUnit, index) => ({
          ...purchaseUnit,
          payments: capturedOrder.purchase_units?.[index]?.payments,
        })),
      };
    }

    const matchingCapture = findMatchingCapture(order, record);
    if (
      order.status?.toUpperCase() !== 'COMPLETED' ||
      !orderMatchesRecord(order, record) ||
      !matchingCapture
    ) {
      return NextResponse.json(
        { error: 'PayPal has not confirmed the expected payment amount.' },
        { status: 400 }
      );
    }

    await records.updateOne(
      { state: record.state, status: { $ne: 'captured' } },
      {
        $set: {
          status: 'captured',
          captureId: matchingCapture.id,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true, order: { id: orderId, status: 'COMPLETED' } });
  } catch (error) {
    if (error instanceof PayPalCryptoConfigurationError) {
      return NextResponse.json(
        { error: 'PayPal checkout is not configured on the server.' },
        { status: 503 }
      );
    }
    if (error instanceof PayPalCryptoAuthenticationError) {
      return NextResponse.json(
        { error: 'PayPal could not authenticate this checkout. Please retry confirmation.' },
        { status: 502 }
      );
    }
    console.error('News Hub PayPal capture error:', error);
    return NextResponse.json(
      { error: 'Could not confirm the PayPal payment. Retry confirmation without paying again.' },
      { status: 500 }
    );
  }
}
