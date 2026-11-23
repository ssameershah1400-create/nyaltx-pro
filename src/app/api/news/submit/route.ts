import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollection } from '@/lib/mongodb';
import { Order } from '@/app/api/admin/orders/route';
import {
  verifyNewsPayment,
  sendNewsSubmissionConfirmationEmail,
  type PaymentVerificationResult,
} from '@/lib/newsEmailService';
import { findUsablePromoCode } from '@/lib/newsPromoCodes';
import { calculateNewsPrice, getNewsPlanBasePrice } from '@/lib/newsPricing';
import { getNewshubCategories } from '@/lib/newshubInitialData';
import { getNewsPaymentTestMode, getPayPalEnvironment } from '@/lib/paypalEnvironment';

interface NewsPayPalCheckoutOrder {
  paypalOrderId: string;
  tier: string;
  type: 'news' | 'pr';
  plan: string;
  promoCode?: string;
  amount: string;
  currency: 'USD';
  status: 'creating' | 'created' | 'captured' | 'failed';
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const {
      title,
      type = 'news', // 'news' | 'pr'
      category = 'NYAX',
      summary,
      content,
      sourceUrl,
      featuredImage,
      coverColor = 0,
      author = 'NYALTX',
      email,
      plan = 'feed', // 'feed' | 'slider' | 'prem'
      paymentMethod = 'paypal', // 'paypal' | 'usdc' | 'nyax'
      amount,
      txHash,
      paymentId,
      walletAddress,
      paymentStatus = 'completed',
      planName,
      isTest = false,
    } = data;
    const normalizedTxHash =
      typeof txHash === 'string' && txHash.trim() ? txHash.trim().toLowerCase() : null;

    const paypalEnvironment = getPayPalEnvironment();
    const testPlanEnabled = getNewsPaymentTestMode() !== null;
    const isTestPlan = Boolean(isTest) && plan === 'test';

    if (!['paypal', 'usdc', 'nyax'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Unsupported payment method. Choose PayPal, USDC, or NYAX.' },
        { status: 400 }
      );
    }

    const availableCategories = await getNewshubCategories();
    if (
      typeof category !== 'string' ||
      !availableCategories.includes(category) ||
      category === 'All'
    ) {
      return NextResponse.json(
        { error: 'Choose one of the available news categories.' },
        { status: 400 }
      );
    }

    if (plan === 'test' || isTest) {
      if (!isTestPlan || !testPlanEnabled) {
        return NextResponse.json(
          { error: 'The $1 payment test is not enabled for this checkout environment.' },
          { status: 400 }
        );
      }
    } else if (['test', 'testnet'].includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Test payments are disabled outside the News Hub payment test plan.' },
        { status: 400 }
      );
    }

    const planPrice = getNewsPlanBasePrice(plan, testPlanEnabled);
    if (planPrice === null) {
      return NextResponse.json(
        { error: 'This news publishing plan is unavailable.' },
        { status: 400 }
      );
    }

    const promoCode = typeof data.promoCode === 'string' ? data.promoCode.trim().toUpperCase() : '';
    if (promoCode && plan === 'test') {
      return NextResponse.json(
        { error: 'Promo codes cannot be applied to the test plan.' },
        { status: 400 }
      );
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

    const expectedAmount = calculateNewsPrice(
      planPrice,
      promoDiscountPercent,
      paymentMethod === 'nyax' && plan !== 'test'
    );
    const submissionAmount = amount === undefined ? expectedAmount : Number(amount);
    if (!Number.isFinite(submissionAmount) || Math.abs(submissionAmount - expectedAmount) > 0.001) {
      return NextResponse.json(
        { error: 'Payment amount does not match the selected publishing plan.' },
        { status: 400 }
      );
    }

    if (!title || title.trim().length < 5) {
      return NextResponse.json(
        { error: 'Headline is required (minimum 5 characters)' },
        { status: 400 }
      );
    }

    if (!summary || summary.trim().length < 10) {
      return NextResponse.json(
        { error: 'Summary is required (minimum 10 characters)' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 20) {
      return NextResponse.json(
        { error: 'Story content is required (minimum 20 characters)' },
        { status: 400 }
      );
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required to receive payment and status confirmation.' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'paypal' && paymentId) {
      const existingDb = await getDb();
      const existingSubmission = await existingDb.collection('corporate_news').findOne({
        paymentMethod: 'paypal',
        paymentId: paymentId.trim(),
        isPaid: true,
        paymentVerified: true,
      });
      if (existingSubmission) {
        const existingOrderId =
          typeof existingSubmission.orderId === 'string'
            ? existingSubmission.orderId
            : `order_news_${existingSubmission._id}`;
        return NextResponse.json({
          success: true,
          test: Boolean(existingSubmission.isTestPlan || existingSubmission.isSandboxTest),
          id: existingSubmission._id.toString(),
          slug: existingSubmission.slug,
          orderId: existingOrderId,
          orderRecorded: !existingSubmission.isSandboxTest,
          paymentVerified: true,
          emailSent: Boolean(existingSubmission.paymentConfirmationEmailSent),
          message: existingSubmission.isSandboxTest
            ? 'This Sandbox test is already saved as an unpublished admin draft.'
            : existingSubmission.isTestPlan
              ? 'This payment test is already saved as an unpublished admin draft.'
              : 'This paid story is already submitted and pending admin approval.',
        });
      }
    }

    if (
      (paymentMethod === 'usdc' || paymentMethod === 'nyax') &&
      normalizedTxHash &&
      /^0x[a-f0-9]{64}$/.test(normalizedTxHash)
    ) {
      const existingDb = await getDb();
      const existingSubmission = await existingDb.collection('corporate_news').findOne({
        paymentMethod,
        txHash: { $regex: `^${normalizedTxHash}$`, $options: 'i' },
        isPaid: true,
        paymentVerified: true,
      });
      if (existingSubmission) {
        return NextResponse.json({
          success: true,
          test: Boolean(existingSubmission.isTestPlan || existingSubmission.isSandboxTest),
          id: existingSubmission._id.toString(),
          slug: existingSubmission.slug,
          orderId:
            typeof existingSubmission.orderId === 'string'
              ? existingSubmission.orderId
              : `order_news_${existingSubmission._id}`,
          orderRecorded: true,
          paymentVerified: true,
          emailSent: Boolean(existingSubmission.paymentConfirmationEmailSent),
          message: existingSubmission.isTestPlan
            ? 'This payment test is already saved as an unpublished admin draft.'
            : 'This payment is already linked to a news submission.',
        });
      }
    }

    // A server-captured News Hub order is already provider-verified; don't make submission
    // depend on a second PayPal API request succeeding.
    let paymentVerification: PaymentVerificationResult;
    const paypalOrderId = typeof paymentId === 'string' ? paymentId.trim() : '';
    if (paymentMethod === 'paypal' && paypalOrderId) {
      const checkoutOrders = await getCollection<NewsPayPalCheckoutOrder>(
        'news_paypal_checkout_orders'
      );
      const checkoutOrder = await checkoutOrders.findOne({ paypalOrderId });

      if (checkoutOrder) {
        const recordedAmount = Number(checkoutOrder.amount);
        const matchesSubmission =
          checkoutOrder.status === 'captured' &&
          checkoutOrder.currency === 'USD' &&
          checkoutOrder.type === type &&
          checkoutOrder.plan === plan &&
          checkoutOrder.tier === `${type}_${plan}` &&
          (checkoutOrder.promoCode ?? '') === promoCode &&
          Number.isFinite(recordedAmount) &&
          recordedAmount.toFixed(2) === submissionAmount.toFixed(2);

        paymentVerification = matchesSubmission
          ? {
              verified: true,
              providerDetails: {
                paypalOrderId,
                status: 'COMPLETED',
                paymentSource: 'paypal_checkout',
              },
            }
          : {
              verified: false,
              reason: 'The captured PayPal order does not match this News Hub submission.',
            };
      } else {
        paymentVerification = await verifyNewsPayment({
          paymentMethod,
          paymentId: paypalOrderId,
          txHash: normalizedTxHash,
          amount: submissionAmount,
          paymentStatus,
        });
      }
    } else {
      paymentVerification = await verifyNewsPayment({
        paymentMethod,
        paymentId: paymentId || null,
        txHash: normalizedTxHash,
        amount: submissionAmount,
        paymentStatus,
      });
    }

    if (!paymentVerification.verified) {
      return NextResponse.json(
        {
          error:
            paymentVerification.reason ||
            'Payment verification failed. Please complete payment before submitting.',
        },
        { status: 400 }
      );
    }

    const isSandboxTest =
      isTestPlan && paymentMethod === 'paypal' && paypalEnvironment === 'sandbox';

    const db = await getDb();
    const newsCollection = db.collection('corporate_news');

    // Create unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const finalSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const resolvedPlanName =
      planName ||
      (plan === 'test'
        ? 'News Hub Payment Test ($1)'
        : plan === 'slider' || plan === 'prem'
          ? 'News Publishing & Distribution ($199)'
          : 'News Publishing ($99)');
    const authorName = typeof author === 'string' ? author.trim() : '';
    const orderId = `order_news_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const submissionDoc = {
      title: title.trim(),
      type,
      category,
      excerpt: summary.trim(),
      content: content.trim(),
      sourceUrl: sourceUrl?.trim() || null,
      featuredImage: featuredImage || null,
      coverColor: Number(coverColor) || 0,
      author:
        authorName.toLowerCase() === 'you'
          ? 'NYALTX'
          : authorName || (type === 'pr' ? 'Press Release' : 'NYALTX'),
      email: email.trim(),
      plan,
      planName: resolvedPlanName,
      isSandboxTest,
      isTestPlan,
      orderId,
      paymentMethod,
      amount: submissionAmount,
      originalAmount: String(planPrice),
      promoCode: promoCode || null,
      promoDiscount: promoDiscountPercent / 100,
      txHash: normalizedTxHash,
      paymentId: paymentId || null,
      walletAddress: walletAddress || null,
      paymentStatus: paymentStatus || 'completed',
      paymentVerified: true,
      paymentVerifiedAt: new Date(),
      paymentSource: paymentVerification.providerDetails?.paymentSource || paymentMethod,
      paymentProviderDetails: paymentVerification.providerDetails || null,
      paymentConfirmationEmailSent: false,
      approvalEmailSent: false,
      status: isTestPlan ? 'draft' : 'pending',
      isPendingReview: !isTestPlan,
      isPaid: true,
      featuredInBanner: plan === 'slider' || plan === 'prem',
      tags: [
        ...(isSandboxTest ? ['SANDBOX TEST'] : isTestPlan ? ['PAYMENT TEST'] : []),
        category,
        type === 'pr' ? 'Press Release' : 'Community',
      ],
      slug: finalSlug,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await newsCollection.insertOne(submissionDoc);

    // 2. Record the verified payment order in 'orders' collection
    let orderRecorded = false;
    if (!isSandboxTest) {
      try {
        const ordersCollection = await getCollection<Order>('orders');

        const newOrder: Order & {
          promoCode?: string;
          promoDiscount?: number;
          originalAmount?: string;
        } = {
          id: orderId,
          type: 'news_submission',
          status: 'completed',
          paymentMethod,
          amount:
            paymentMethod === 'nyax'
              ? String(paymentVerification.providerDetails?.amount ?? submissionAmount)
              : String(submissionAmount),
          promoCode: promoCode || undefined,
          promoDiscount: promoDiscountPercent / 100,
          originalAmount: String(planPrice),
          currency: paymentMethod === 'usdc' ? 'USDC' : paymentMethod === 'nyax' ? 'NYAX' : 'USD',
          txHash: normalizedTxHash || undefined,
          paymentId: paymentId || undefined,
          walletAddress: walletAddress || undefined,
          email: email.trim(),
          productName: `NYALTX News Hub - ${type === 'pr' ? 'Press Release' : 'News'} (${resolvedPlanName})`,
          tier: plan,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          metadata: {
            newsId: insertResult.insertedId.toString(),
            headline: title,
            category,
            submissionType: type,
            plan,
            planName: resolvedPlanName,
            paymentMethod,
            paymentSource: paymentVerification.providerDetails?.paymentSource || paymentMethod,
            amountUsd: String(submissionAmount),
            promoCode: promoCode || undefined,
            promoDiscount: promoDiscountPercent / 100,
            originalAmount: String(planPrice),
            paymentId,
            txHash: normalizedTxHash,
            walletAddress,
            paymentVerified: true,
          },
        };

        await ordersCollection.insertOne(newOrder);
        orderRecorded = true;
      } catch (orderErr) {
        console.error(
          'Could not record news submission order; the admin orders API will recover it from the submission:',
          orderErr
        );
      }
    }

    // 3. Send payment & submission confirmation email to client
    let emailSent = false;
    if (!isSandboxTest) {
      try {
        const emailRes = await sendNewsSubmissionConfirmationEmail({
          to: email.trim(),
          headline: title.trim(),
          category,
          planName: resolvedPlanName,
          amount: submissionAmount,
          paymentMethod,
          paymentId: paymentId || undefined,
          txHash: normalizedTxHash || undefined,
          author: submissionDoc.author,
          submittedAt: submissionDoc.createdAt.toISOString(),
          isTestDraft: isTestPlan,
        });

        if (emailRes.success) {
          emailSent = true;
          await newsCollection.updateOne(
            { _id: insertResult.insertedId },
            {
              $set: {
                paymentConfirmationEmailSent: true,
                paymentConfirmationEmailSentAt: new Date(),
                paymentConfirmationMessageId: emailRes.messageId,
              },
            }
          );
        }
      } catch (emailError) {
        console.error('Error sending news submission email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      test: isTestPlan,
      id: insertResult.insertedId.toString(),
      slug: finalSlug,
      orderId,
      orderRecorded,
      paymentVerified: true,
      emailSent,
      message: isTestPlan
        ? isSandboxTest
          ? 'PayPal Sandbox payment verified. The story was saved as an unpublished payment-test draft in Admin.'
          : 'Payment verified and recorded. The story was saved as an unpublished payment-test draft in Admin.'
        : 'Payment verified successfully. Your story has been submitted and is pending admin approval.',
    });
  } catch (error: any) {
    console.error('Error submitting news:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit story' }, { status: 500 });
  }
}
