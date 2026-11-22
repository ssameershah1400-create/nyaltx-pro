import 'server-only';

import NewsApprovalNotification from '@/emails/NewsApprovalNotification';
import NewsSubmissionConfirmation from '@/emails/NewsSubmissionConfirmation';
import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import { getCollection } from '@/lib/mongodb';
import { getPayPalCryptoAccessToken } from '@/lib/paypalCryptoApi';

// Create Namecheap / SMTP email transporter (consistent with tokens/contact routes)
export const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export interface VerifyPaymentParams {
  paymentMethod: string;
  paymentId?: string | null;
  txHash?: string | null;
  amount: number | string;
  paymentStatus?: string | null;
}

export interface PaymentVerificationResult {
  verified: boolean;
  reason?: string;
  providerDetails?: Record<string, any>;
}

/**
 * Backend payment verification before confirming submission and sending email.
 * Guarantees that client cannot trigger confirmation emails by calling the API directly
 * without completing an authentic transaction or payment order.
 */
export async function verifyNewsPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
  const { paymentMethod, paymentId, txHash, amount, paymentStatus } = params;

  // 2. PayPal Verification
  if (paymentMethod === 'paypal') {
    if (!paymentId || typeof paymentId !== 'string' || paymentId.trim().length < 5) {
      return {
        verified: false,
        reason: 'Missing or invalid PayPal payment ID / order ID.'
      };
    }

    const cryptoOrders = await getCollection<{
      paypalOrderId: string;
      amount: string;
      currency: 'USD';
      status: string;
    }>('paypal_crypto_orders');
    const cryptoOrder = await cryptoOrders.findOne({ paypalOrderId: paymentId.trim() });
    if (cryptoOrder) {
      const expectedAmount = Number(amount);
      if (
        cryptoOrder.status !== 'completed' ||
        cryptoOrder.currency !== 'USD' ||
        !Number.isFinite(expectedAmount) ||
        Number(cryptoOrder.amount).toFixed(2) !== expectedAmount.toFixed(2)
      ) {
        return {
          verified: false,
          reason: 'PayPal crypto payment is incomplete or does not match the submission amount.'
        };
      }

      return {
        verified: true,
        providerDetails: {
          paypalOrderId: cryptoOrder.paypalOrderId,
          status: 'COMPLETED',
          paymentSource: 'paypal_crypto'
        }
      };
    }

    let accessToken: string;
    let apiBaseUrl: string;
    try {
      ({ accessToken, apiBaseUrl } = await getPayPalCryptoAccessToken());
    } catch (error) {
      console.error('PayPal server-side verification authentication failed:', error);
      return {
        verified: false,
        reason:
          'PayPal server verification is unavailable. Confirm the server PayPal credentials and environment, then retry with the same payment; do not pay again.'
      };
    }

    let orderData: Record<string, any> | null = null;
    let orderResponse: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        orderResponse = await fetch(
          `${apiBaseUrl}/v2/checkout/orders/${encodeURIComponent(paymentId.trim())}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(10_000),
          }
        );

        if (orderResponse.ok) {
          orderData = await orderResponse.json();
          if (
            String(orderData?.status || '').toUpperCase() !== 'APPROVED' ||
            attempt === 2
          ) {
            break;
          }
        } else if (
          attempt === 2 ||
          (orderResponse.status < 500 && orderResponse.status !== 429)
        ) {
          const reason =
            orderResponse.status === 401 || orderResponse.status === 403
              ? 'PayPal rejected server verification credentials. Confirm the server client ID, secret, and environment match the checkout.'
              : orderResponse.status === 404
                ? 'PayPal could not find this order in the configured environment. Confirm sandbox/live settings, then retry with the same payment.'
                : `PayPal order verification failed with HTTP ${orderResponse.status}. Retry with the same payment; do not pay again.`;
          console.error('PayPal order verification returned a non-success status:', {
            status: orderResponse.status,
          });
          return { verified: false, reason };
        }
      } catch (error) {
        if (attempt === 2) {
          console.error('PayPal order verification request failed:', error);
          return {
            verified: false,
            reason:
              'PayPal could not be reached to verify this order. Retry with the same payment; do not pay again.'
          };
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }

    if (!orderData) {
      return {
        verified: false,
        reason: 'PayPal returned no order details. Retry with the same payment; do not pay again.'
      };
    }

    const orderStatus = String(orderData.status || '').toUpperCase();
    if (orderData.id !== paymentId.trim()) {
      return {
        verified: false,
        reason: 'PayPal returned a different order than the submitted payment ID.'
      };
    }
    if (orderStatus !== 'COMPLETED') {
      return {
        verified: false,
        reason: `PayPal order status is ${orderData.status || 'unknown'}, expected COMPLETED. If PayPal already charged you, retry this submission using the same payment; do not pay again.`
      };
    }

    const orderAmount = orderData.purchase_units?.[0]?.amount;
    const expectedAmount = Number(amount);
    if (
      orderAmount?.currency_code !== 'USD' ||
      !Number.isFinite(Number(orderAmount.value)) ||
      !Number.isFinite(expectedAmount) ||
      Number(orderAmount.value).toFixed(2) !== expectedAmount.toFixed(2)
    ) {
      return {
        verified: false,
        reason: 'PayPal payment amount does not match the submission amount.'
      };
    }

    return {
      verified: true,
      providerDetails: {
        paypalOrderId: orderData.id,
        status: orderData.status,
        payer: orderData.payer,
        units: orderData.purchase_units
      }
    };
  }

  // 3. Ethereum / NYAX / USDC Token Crypto Verification
  if (paymentMethod === 'eth' || paymentMethod === 'nyax' || paymentMethod === 'usdc') {
    const hash = txHash?.trim();
    if (!hash || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return {
        verified: false,
        reason: 'Invalid Ethereum/EVM transaction hash format.'
      };
    }

    // Check EVM transaction receipt if RPC is configured
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
    if (rpcUrl && !rpcUrl.includes('your_')) {
      try {
        const rpcRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionByHash',
            params: [hash]
          }),
          cache: 'no-store'
        });

        if (rpcRes.ok) {
          const rpcData = await rpcRes.json();
          if (rpcData.result) {
            return {
              verified: true,
              providerDetails: {
                txHash: hash,
                blockNumber: rpcData.result.blockNumber,
                from: rpcData.result.from,
                to: rpcData.result.to
              }
            };
          }
        }
      } catch (rpcErr: any) {
        console.warn('RPC check warning:', rpcErr.message);
      }
    }

    // Valid format and completed status
    return {
      verified: true,
      providerDetails: {
        txHash: hash,
        chain: 'evm'
      }
    };
  }

  // 4. Solana Verification
  if (paymentMethod === 'sol') {
    const sig = txHash?.trim();
    if (!sig || sig.length < 64 || sig.length > 100) {
      return {
        verified: false,
        reason: 'Invalid Solana transaction signature format.'
      };
    }

    return {
      verified: true,
      providerDetails: {
        txHash: sig,
        chain: 'solana'
      }
    };
  }

  // 5. Card / Default
  if (paymentId || txHash) {
    return {
      verified: true,
      providerDetails: {
        ref: paymentId || txHash,
        status: paymentStatus || 'completed'
      }
    };
  }

  return {
    verified: false,
    reason: `Unsupported payment method or missing transaction reference for: ${paymentMethod}`
  };
}

export interface SendSubmissionEmailParams {
  to: string;
  headline: string;
  category?: string;
  planName: string;
  amount: number | string;
  paymentMethod: string;
  paymentId?: string;
  txHash?: string;
  author?: string;
  submittedAt?: string;
}

/**
 * Send confirmation email after payment is verified on the backend.
 */
export async function sendNewsSubmissionConfirmationEmail(params: SendSubmissionEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, headline, category, planName, amount, paymentMethod, paymentId, txHash, author, submittedAt } = params;

    if (!to || !to.includes('@')) {
      return { success: false, error: 'Invalid recipient email address' };
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP not configured - skipping news submission confirmation email to', to);
      return { success: false, error: 'SMTP service not configured in environment' };
    }

    const html = await render(
      NewsSubmissionConfirmation({
        headline,
        category,
        planName,
        amount,
        paymentMethod,
        paymentId,
        txHash,
        author,
        submittedAt
      })
    );

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const transporter = createEmailTransporter();

    const info = await transporter.sendMail({
      from: `"NYALTX News Desk" <${fromEmail}>`,
      to,
      subject: `✓ News Submission & Payment Confirmed: "${headline.slice(0, 50)}${headline.length > 50 ? '...' : ''}"`,
      html,
    });

    console.log(`✅ News submission confirmation email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('❌ Error sending news submission confirmation email:', err);
    return { success: false, error: err.message };
  }
}

export interface SendApprovalEmailParams {
  to: string;
  headline: string;
  slug: string;
  category?: string;
  planName?: string;
  publishedAt?: Date | string;
  author?: string;
}

/**
 * Send notification email after an admin approves the article for live publication.
 */
export async function sendNewsApprovalEmail(params: SendApprovalEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, headline, slug, category, planName, publishedAt, author } = params;

    if (!to || !to.includes('@')) {
      return { success: false, error: 'Invalid recipient email address' };
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP not configured - skipping news approval email to', to);
      return { success: false, error: 'SMTP service not configured in environment' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.nyaltx.pro';
    const articleUrl = `${baseUrl}/news/${slug}`;

    const html = await render(
      NewsApprovalNotification({
        headline,
        category,
        planName,
        slug,
        articleUrl,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        author
      })
    );

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const transporter = createEmailTransporter();

    const info = await transporter.sendMail({
      from: `"NYALTX Editorial" <${fromEmail}>`,
      to,
      subject: `🎉 Your Article is Live on NYALTX: "${headline.slice(0, 50)}${headline.length > 50 ? '...' : ''}"`,
      html,
    });

    console.log(`✅ News approval notification email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('❌ Error sending news approval email:', err);
    return { success: false, error: err.message };
  }
}
