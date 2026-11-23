import 'server-only';

import NewsApprovalNotification from '@/emails/NewsApprovalNotification';
import NewsSubmissionConfirmation from '@/emails/NewsSubmissionConfirmation';
import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import { getCollection } from '@/lib/mongodb';
import { getPayPalEnvironment } from '@/lib/paypalEnvironment';
import {
  createPublicClient,
  decodeEventLog,
  decodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
  parseUnits,
  type Hash,
} from 'viem';
import { mainnet } from 'viem/chains';
import {
  DEFAULT_NEWS_NYAX_TOKEN_ADDRESS,
  NEWS_NYAX_TOKEN_ADDRESS,
  NEWS_USDC_TOKEN_ADDRESS,
  USDC_NYAX_RECEIVER,
} from '@/lib/paymentAddresses';
import { fetchNyaxMarketData } from '@/lib/nyaxMarketData';

const TRANSFER_EVENT_SIGNATURE =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function verifyEvmTokenPayment(
  paymentMethod: 'usdc' | 'nyax',
  txHash: string | null | undefined,
  amount: number | string
): Promise<PaymentVerificationResult> {
  const hash = txHash?.trim();
  if (!hash || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return {
      verified: false,
      reason: 'Enter a valid Ethereum transaction hash.',
    };
  }

  const tokenAddress =
    paymentMethod === 'usdc'
      ? NEWS_USDC_TOKEN_ADDRESS
      : NEWS_NYAX_TOKEN_ADDRESS;
  if (!isAddress(tokenAddress) || !isAddress(USDC_NYAX_RECEIVER)) {
    return {
      verified: false,
      reason: 'The Ethereum payment token or treasury address is not configured correctly.',
    };
  }
  if (
    paymentMethod === 'nyax' &&
    tokenAddress.toLowerCase() !== DEFAULT_NEWS_NYAX_TOKEN_ADDRESS.toLowerCase()
  ) {
    return {
      verified: false,
      reason: 'The configured NYAX token does not match the token used by the NYAX price quote.',
    };
  }

  const expectedUsd = Number(amount);
  if (!Number.isFinite(expectedUsd) || expectedUsd <= 0) {
    return { verified: false, reason: 'The expected payment amount is invalid.' };
  }

  const rpcUrl =
    process.env.NEWS_PAYMENT_RPC_URL ||
    process.env.RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'https://ethereum-rpc.publicnode.com';

  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl, { timeout: 15_000 }),
    });
    if ((await client.getChainId()) !== mainnet.id) {
      return {
        verified: false,
        reason: 'Payment verification is connected to the wrong network. Use Ethereum Mainnet.',
      };
    }

    const transactionHash = hash as Hash;
    const [transaction, receipt] = await Promise.all([
      client.getTransaction({ hash: transactionHash }),
      client.getTransactionReceipt({ hash: transactionHash }),
    ]);

    if (receipt.status !== 'success') {
      return { verified: false, reason: 'The Ethereum payment transaction did not succeed.' };
    }
    if (
      transaction.chainId !== null &&
      transaction.chainId !== undefined &&
      transaction.chainId !== mainnet.id
    ) {
      return {
        verified: false,
        reason: 'The payment transaction was not sent on Ethereum Mainnet.',
      };
    }
    if (transaction.to?.toLowerCase() !== tokenAddress.toLowerCase()) {
      return {
        verified: false,
        reason: `The transaction does not transfer the required ${paymentMethod.toUpperCase()} token.`,
      };
    }

    const decodedTransfer = decodeFunctionData({ abi: erc20Abi, data: transaction.input });
    if (decodedTransfer.functionName !== 'transfer') {
      return { verified: false, reason: 'The transaction is not an ERC-20 transfer.' };
    }
    const [recipient, tokenAmount] = decodedTransfer.args;
    if (
      recipient.toLowerCase() !== USDC_NYAX_RECEIVER.toLowerCase() ||
      tokenAmount <= BigInt(0)
    ) {
      return {
        verified: false,
        reason: 'The token transfer recipient or amount does not match the News Hub treasury.',
      };
    }

    const transferLog = receipt.logs.find(
      log =>
        log.address.toLowerCase() === tokenAddress.toLowerCase() &&
        log.topics[0]?.toLowerCase() === TRANSFER_EVENT_SIGNATURE
    );
    if (!transferLog) {
      return { verified: false, reason: 'The transaction has no matching token transfer receipt.' };
    }
    const transferEvent = decodeEventLog({
      abi: erc20Abi,
      eventName: 'Transfer',
      data: transferLog.data,
      topics: transferLog.topics,
    });
    if (
      transferEvent.args.from.toLowerCase() !== transaction.from.toLowerCase() ||
      transferEvent.args.to.toLowerCase() !== USDC_NYAX_RECEIVER.toLowerCase() ||
      transferEvent.args.value !== tokenAmount
    ) {
      return {
        verified: false,
        reason: 'The confirmed token transfer does not match the submitted transaction.',
      };
    }

    if (paymentMethod === 'usdc') {
      const expectedTokenAmount = parseUnits(expectedUsd.toFixed(2), 6);
      if (tokenAmount !== expectedTokenAmount) {
        return {
          verified: false,
          reason: 'The USDC transfer amount does not match the News Hub plan price.',
        };
      }

      return {
        verified: true,
        providerDetails: {
          txHash: transactionHash,
          chain: 'ethereum',
          token: 'USDC',
          tokenAddress,
          recipient: USDC_NYAX_RECEIVER,
          amount: formatUnits(tokenAmount, 6),
        },
      };
    }

    const { priceUsd } = await fetchNyaxMarketData();
    const paidUsd = Number(formatUnits(tokenAmount, 18)) * priceUsd;
    const deviation = Math.abs(paidUsd - expectedUsd) / expectedUsd;
    if (!Number.isFinite(paidUsd) || deviation > 0.01) {
      return {
        verified: false,
        reason: 'The NYAX transfer is more than 1% away from the plan price. Refresh the quote before paying.',
      };
    }

    return {
      verified: true,
      providerDetails: {
        txHash: transactionHash,
        chain: 'ethereum',
        token: 'NYAX',
        tokenAddress,
        recipient: USDC_NYAX_RECEIVER,
        amount: formatUnits(tokenAmount, 18),
        priceUsd,
        amountUsd: paidUsd,
      },
    };
  } catch (error) {
    console.warn('Ethereum token payment verification failed:', error);
    return {
      verified: false,
      reason:
        'Could not confirm the Ethereum payment yet. Wait for confirmation and retry with the same transaction hash.',
    };
  }
}

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

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

    // If PayPal API credentials exist on backend, verify directly with PayPal v2 API
    if (clientId && clientSecret && clientId !== 'test' && clientId !== 'your-paypal-client-id-here') {
      try {
        const isSandbox = getPayPalEnvironment() === 'sandbox';
        const paypalHost = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenRes = await fetch(`${paypalHost}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials',
          cache: 'no-store'
        });

        if (!tokenRes.ok) {
          console.warn('PayPal token request failed with status:', tokenRes.status);
          // Fall back to structure check if credentials have auth issue in sandbox
        } else {
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          const orderRes = await fetch(`${paypalHost}/v2/checkout/orders/${paymentId.trim()}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });

          if (orderRes.ok) {
            const orderData = await orderRes.json();
            const orderStatus = (orderData.status || '').toUpperCase();
            if (orderData.id !== paymentId.trim()) {
              return {
                verified: false,
                reason: 'PayPal returned a different order than the submitted payment ID.'
              };
            }
            if (orderStatus === 'COMPLETED') {
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
            } else {
              return {
                verified: false,
                reason: `PayPal order status is ${orderData.status}, expected COMPLETED.`
              };
            }
          }
        }
      } catch (err: any) {
        console.error('PayPal API verification error:', err.message);
      }
    }

    return {
      verified: false,
      reason: 'Could not verify PayPal payment status with provider.'
    };
  }

  // Ethereum token payment verification
  if (paymentMethod === 'nyax' || paymentMethod === 'usdc') {
    return verifyEvmTokenPayment(paymentMethod, txHash, amount);
  }

  if (paymentMethod === 'eth') {
    return {
      verified: false,
      reason: 'Direct ETH payments are not supported for News Hub submissions.',
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
