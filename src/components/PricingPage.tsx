'use client';

import React from 'react';
import { usePricingContent } from '@/hooks/useTinaContent';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { FaCheck, FaStar } from 'react-icons/fa';

const PRICING_TITLE_CLASS =
  'mx-auto max-w-[780px] text-[clamp(44px,6.6vw,82px)] font-medium leading-[.98] tracking-[-.065em] text-[#f4f8ff]';

const PricingPage: React.FC = () => {
  const { content, loading, error } = usePricingContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <PublicHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <PublicHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className={`${PRICING_TITLE_CLASS} mb-4`}>Pricing</h1>
            <p className="text-gray-400">
              Sorry, we couldn't load the pricing information. Please try again later.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className={`${PRICING_TITLE_CLASS} mb-6`}>
            {content?.hero?.title || "Choose Your Plan"}
          </h1>
          {content?.hero?.subtitle && (
            <p className="mx-auto max-w-[650px] text-[17px] leading-[1.75] text-[#aebfd9]">
              {content.hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {content?.plans?.map((plan: any, index: number) => (
              <div
                key={index}
                className={`relative flex h-full min-h-[460px] flex-col gap-[18px] border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-cyan-300/60 bg-gradient-to-br from-[#102440] to-[#0b172b] text-[#eaf2ff] shadow-[0_12px_36px_rgba(103,216,255,0.12)] hover:border-cyan-200'
                    : 'border-[#262626] bg-[#181818] text-[#eee] hover:border-[#464646]'
                }`}
              >
                {plan.popular && (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-cyan-300"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-cyan-300"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-cyan-300"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-cyan-300"
                    />
                  </>
                )}

                {(plan.badge || plan.popular) && (
                  <span
                    className={`inline-flex items-center gap-1 self-start border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      plan.popular
                        ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-200'
                        : 'border-white/15 bg-white/5 text-gray-300'
                    }`}
                  >
                    {plan.popular && <FaStar aria-hidden="true" className="h-3 w-3" />}
                    {plan.badge || 'Most Popular'}
                  </span>
                )}

                <div className="text-center">
                  <h3 className="mb-2 text-[clamp(18px,2.1vw,22px)] font-medium leading-[1.08] tracking-[-.04em]">
                    {plan.name}
                  </h3>
                  <p
                    className={`min-h-[3em] text-sm leading-[1.5] ${
                      plan.popular ? 'text-[#aebfd9]' : 'text-[#929292]'
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-4 flex items-baseline justify-center gap-2">
                    <span className="text-[clamp(34px,3vw,46px)] font-medium leading-none tracking-[-.04em] tabular-nums">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={plan.popular ? 'text-[#91a3bd]' : 'text-[#929292]'}>
                        / {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`mb-4 flex-1 space-y-3 border-t border-dashed pt-4 ${
                    plan.popular ? 'border-cyan-300/30' : 'border-[#363636]'
                  }`}
                >
                  {plan.features?.map((feature: string, featureIndex: number) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <FaCheck
                        className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${
                          plan.popular ? 'text-cyan-300' : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={`text-sm leading-[1.45] ${
                          plan.popular ? 'text-[#d8e6f8]' : 'text-[#c9c9c9]'
                        }`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={plan.ctaLink || '#'}
                  className={`mt-auto block min-h-[44px] w-full border px-5 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                    plan.popular
                      ? 'border-cyan-300 bg-[#67d8ff] text-[#071326] hover:bg-[#9be7ff]'
                      : 'border-transparent bg-[#eee] text-[#121212] hover:bg-white'
                  }`}
                >
                  {plan.ctaText || "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
