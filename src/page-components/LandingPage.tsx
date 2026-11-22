'use client';

import Faq from '@/components/Faq';
import PublicHeader from '@/components/PublicHeader';
import { useLandingPageContent } from '@/hooks/useTinaContent';
import { toReliableIpfsUrl } from '@/utils/ipfsUpload';
import { ExchangeIcon, NetworkIcon, TokenIcon, WalletIcon } from '@web3icons/react/dynamic';
import type { Variants } from 'framer-motion';
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Megaphone,
  Network,
  ShieldCheck,
  Sparkles,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const sectionHeadingClass =
  'mx-auto max-w-3xl text-center font-sans text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[0.98] tracking-[-0.06em] text-white';
const MotionLink = motion(Link);

interface LandingPageProps {
  initialContent?: any;
  data?: any;
}

export default function LandingPage(props?: LandingPageProps) {
  const serverContent = props?.initialContent || props?.data?.landing || null;
  const { content: landingContent, loading, error } = useLandingPageContent(serverContent);
  const shouldReduceMotion = useReducedMotion();
  const scrollRevealProps = shouldReduceMotion
    ? {}
    : { initial: 'hidden' as const, whileInView: 'show' as const };

  if (loading && !landingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error && !landingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load content</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const configuredTestimonials = landingContent?.testimonials?.items as
    (LandingTestimonial | null | undefined)[] | null | undefined;
  const testimonialItems = configuredTestimonials?.filter(
    (testimonial): testimonial is LandingTestimonial =>
      Boolean(testimonial?.quote && testimonial.author)
  ) ?? [
    {
      quote: 'NYALTX helped us boost discovery during launch week.',
      author: 'Team Atlas',
    },
    {
      quote: 'The Race to Liberty brought real traffic and holders.',
      author: 'Liberty Labs',
    },
    {
      quote: 'Smooth UX and flexible payments — exactly what we needed.',
      author: 'DeltaX',
    },
  ];
  const heroTitle =
    landingContent?.hero?.title || 'Find the project. Follow the news. Be in the room.';
  const heroTitleParts = heroTitle
    .match(/[^.!?]+[.!?]?/g)
    ?.map(part => part.trim())
    .filter(Boolean) ?? [heroTitle];
  const heroTitleLeadParts = heroTitleParts.slice(0, -1);
  const heroTitleEmphasis = heroTitleParts.at(-1) || heroTitle;

  return (
    <div className="min-h-screen">
      {/* 1) Hero */}
      <motion.section
        className="relative overflow-hidden min-h-[70vh] md:min-h-[78vh] flex flex-col"
        variants={container}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate="show"
      >
        <PublicHeader />
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-24 md:py-32 lg:py-36">
          <div className="grid w-full grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-14">
            <motion.div className="max-w-3xl overflow-visible" variants={fadeUp}>
              <span className="mb-4 block text-sm font-semibold italic tracking-[0.2em] text-cyan-300">
                NEW YORK ALT EXCHANGE
              </span>
              <h1 className="max-w-3xl font-sans text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[0.9] tracking-[-0.06em] [word-spacing:-0.08em] text-white">
                {heroTitleLeadParts.map((part, index) => (
                  <span
                    key={`hero-title-lead-${index}`}
                    className="block font-semibold italic text-white"
                  >
                    {part}
                  </span>
                ))}
                <span className="mt-2 block font-semibold italic">{heroTitleEmphasis}</span>
              </h1>
              <p className="mt-6 text-xs text-gray-300/90 max-w-2xl leading-relaxed sm:text-sm">
                {landingContent?.hero?.subtitle ||
                  'NYALTX brings blockchain discovery, a dedicated market news hub, and live events together, so you can follow digital assets from first listing to front-page story.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <MotionLink
                  href={landingContent?.hero?.ctaLink || '/dashboard'}
                  className="rounded-full bg-cyan-500/90 px-5 py-2.5 font-semibold tracking-tight text-white hover:bg-cyan-400 transition-colors"
                  whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  {landingContent?.hero?.ctaText || 'Explore Blockchain Discovery'}
                </MotionLink>
                <MotionLink
                  href="/newshub"
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-semibold tracking-tight text-white hover:bg-white/10 transition-colors"
                  whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  Read News Hub
                </MotionLink>
              </div>
            </motion.div>
            <motion.div className="flex justify-center md:justify-center" variants={scaleIn}>
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 blur-2xl" />
                <Image
                  src={landingContent?.hero?.backgroundImage || '/hero2.png'}
                  alt="NYALTX Logo"
                  width={300}
                  height={300}
                  priority
                  className="relative h-auto w-[580px]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="overflow-hidden"
        variants={container}
        {...scrollRevealProps}
        viewport={{ once: true, amount: 0.2 }}
      >
        <NetworkLogoCarousel />
      </motion.section>

      {/*
            <motion.section
                className="mx-auto max-w-7xl px-6 py-10 text-slate-100"
                variants={container}
                {...scrollRevealProps}
                viewport={{ once: true, amount: 0.2 }}
            >
                <StatsShowcase
                    title={landingContent?.stats?.title || 'Platform insights at a glance'}
                    items={
                        landingContent?.stats?.items?.length
                            ? landingContent.stats.items
                            : [
                                  { value: '132', label: 'Networks' },
                                  { value: '21,586', label: 'DEXs' },
                                  { value: '19,440,364', label: 'Pools' },
                                  { value: '29,055,602', label: 'Tokens' },
                              ]
                    }
                />
            </motion.section>
            */}

      <motion.section
        className="mx-auto max-w-7xl px-6 py-16 md:py-20"
        variants={container}
        {...scrollRevealProps}
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 className={sectionHeadingClass} variants={fadeUp}>
          {landingContent?.features?.title || 'Why NYALTX'}
        </motion.h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {landingContent?.features?.items?.slice(0, 3).map((feature, index) => (
            <motion.div key={index} variants={scaleIn}>
              <Feature
                title={feature.title}
                desc={feature.description}
                icon={feature.icon}
                href={index === 0 ? '/dashboard' : index === 1 ? '/newshub' : '/dashboard/events'}
                linkText={
                  index === 1 ? 'Read Latest' : index === 2 ? "See what's coming up" : undefined
                }
              />
            </motion.div>
          )) || (
            <>
              <motion.div variants={scaleIn}>
                <Feature
                  title="Multi-chain coverage"
                  desc="Follow activity across popular EVM networks and beyond, with fast updates."
                  href="/dashboard"
                />
              </motion.div>
              <motion.div variants={scaleIn}>
                <Feature
                  title="Promotional placements"
                  desc="Race to Liberty campaign placements, podcast mentions, and homepage features."
                />
              </motion.div>
              <motion.div variants={scaleIn}>
                <Feature
                  title="Flexible payments"
                  desc="Pay with cards (Stripe), ETH, or NYAX with a 20% discount on token payments."
                />
              </motion.div>
            </>
          )}
        </div>
      </motion.section>

      <NewsHubCarousel />
      <UpcomingEventsSection />

      {/*
            <motion.section
                className="mx-auto max-w-7xl px-6 py-10"
                variants={container}
                {...scrollRevealProps}
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.h2
                    className={sectionHeadingClass}
                    variants={fadeUp}
                >
                    Popular wallets
                </motion.h2>
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                        'MetaMask',
                        'Coinbase Wallet',
                        'Trust Wallet',
                        'Rainbow',
                        'Phantom',
                        'OKX Wallet',
                    ].map((name, i) => (
                        <motion.div
                            key={i}
                            variants={scaleIn}
                        >
                            <LandingCard>
                                <WalletIcon name={name} variant="branded" size="36" />
                                <div className="text-sm text-slate-200">{name}</div>
                            </LandingCard>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
            */}

      {/*
            <motion.section
                className="mx-auto max-w-7xl px-6 py-16 md:py-20"
                variants={container}
                {...scrollRevealProps}
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.h2 className={sectionHeadingClass} variants={fadeUp}>
                    How it works
                </motion.h2>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div variants={fadeUp}>
                        <Step
                            index={1}
                            title="Sign up for NYALTX Pro"
                            desc="Create your Pro account to unlock listings and placements."
                        />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <Step
                            index={2}
                            title="Choose a tier"
                            desc="Pick Paddle, Motor, or Helicopter depending on your goals."
                        />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <Step
                            index={3}
                            title="Track and grow"
                            desc="Monitor stats, engage with holders, and scale your reach."
                        />
                    </motion.div>
                </div>
            </motion.section>
            */}

      {/*
            <motion.section
                className="mx-auto max-w-7xl px-6 py-16 md:py-20"
                variants={container}
                {...scrollRevealProps}
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.h2
                    className={sectionHeadingClass}
                    variants={fadeUp}
                >
                    {landingContent?.testimonials?.title || 'What builders say'}
                </motion.h2>
                <StaggerTestimonials items={testimonialItems} />
            </motion.section>
            */}

      {/*
            <motion.section
                className="mx-auto max-w-7xl px-6 py-10"
                variants={container}
                {...scrollRevealProps}
                viewport={{ once: true, amount: 0.2 }}
            >
                <Faq variant="landing" />
            </motion.section>
            */}

      {/*
            <motion.section
                className="mx-auto max-w-7xl px-6 py-16 md:py-20"
                variants={container}
                {...scrollRevealProps}
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.h2
                    className={sectionHeadingClass}
                    variants={fadeUp}
                >
                    Ecosystem integrations
                </motion.h2>
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                        { name: 'Uniswap', fallback: 'uniswap', label: 'Uniswap' },
                        { name: 'Binance', fallback: 'binance', label: 'Binance' },
                        { name: 'Sushi Swap', fallback: 'sushiswap', label: 'Sushi Swap' },
                        { name: 'Pancake Swap', fallback: 'pancakeswap', label: 'PancakeSwap' },
                        { name: 'Gate Io', fallback: 'raydium', label: 'Gate Io' },
                        { name: 'Crypto.com', fallback: 'base', label: 'Crypto.com' },
                    ].map((it, i) => (
                        <motion.div
                            key={i}
                            variants={scaleIn}
                        >
                            <LandingCard>
                                <CryptoIcon name={it.name} size={36} kind={'exchange'} fallback={it.fallback} />
                                <span className="text-sm text-slate-200">{it.label}</span>
                            </LandingCard>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
            */}

      {/*
            <motion.section
                className="mx-auto max-w-7xl px-6 py-16 md:py-20"
                variants={container}
                {...scrollRevealProps}
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.h2
                    className={sectionHeadingClass}
                    variants={fadeUp}
                >
                    Built for Web3
                </motion.h2>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            t: 'Non-custodial',
                            d: 'You keep control. Connect your wallet and transact directly on-chain.',
                        },
                        {
                            t: 'Multi-network',
                            d: 'Ethereum-first with expanding L2 and multi-chain coverage.',
                        },
                        {
                            t: 'Dev-friendly',
                            d: 'Modular architecture and API pathways planned for partners.',
                        },
                    ].map((x, i) => (
                        <motion.div
                            key={i}
                            variants={scaleIn}
                        >
                            <LandingCard>
                                <div className="text-lg font-semibold">{x.t}</div>
                                <p className="text-gray-300/90 text-sm">{x.d}</p>
                            </LandingCard>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
            */}

      <motion.section
        className="mx-auto max-w-7xl px-6 py-16 md:py-20"
        variants={container}
        {...scrollRevealProps}
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
          variants={scaleIn}
        >
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">Building a project? Get it seen.</h3>
            <p className="text-gray-300">
              List your project with NYALTX Pro, then choose a Paddle, Motor, or Helicopter tier to
              reach readers in discovery, the News Hub, and at events.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/pricing"
              className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-500"
            >
              See Pricing
            </Link>
          </div>
        </motion.div>
      </motion.section>
      <LandingNewsletterSection />
    </div>
  );
}

function LandingNewsletterSection() {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState<'success' | 'error'>('success');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const turn = useMotionValue(0);
  const backgroundImage = useMotionTemplate`conic-gradient(from ${turn}turn, #a78bfa00 75%, #a78bfa 100%)`;
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (shouldReduceMotion) return;

    const controls = animate(turn, 1, {
      ease: 'linear',
      duration: 5,
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [turn, shouldReduceMotion]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result: { message?: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Could not subscribe. Please try again.');
      }

      setMessage(result.message || 'Successfully subscribed to the NYALTX newsletter.');
      setMessageType('success');
      setEmail('');
    } catch (error) {
      console.error('Landing page newsletter signup error:', error);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Network error. Please check your connection and try again.'
      );
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="border-t border-white/10 bg-black/40 px-6 py-16 md:py-20"
      aria-labelledby="landing-newsletter-title"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="landing-newsletter-title" className={sectionHeadingClass}>
          Get the newsletter
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
          Market updates, new listings, and event announcements in your inbox.
        </p>
        <form
          onSubmit={handleSubmit}
          onClick={() => inputRef.current?.focus()}
          className="relative mx-auto mt-8 flex w-full max-w-md items-center gap-2 rounded-full border border-white/20 bg-gradient-to-br from-white/20 to-white/5 py-1.5 pl-6 pr-1.5"
        >
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            aria-label="Email address"
            placeholder="Enter your email"
            className="w-full bg-transparent text-sm text-white placeholder-white/80 focus:outline-0"
            required
            disabled={isSubmitting}
          />
          <button
            onClick={event => event.stopPropagation()}
            type="submit"
            disabled={isSubmitting}
            className="group mr-2 flex shrink-0 items-center gap-1.5 rounded-full bg-cyan-500/90 px-4 py-3 text-sm font-semibold tracking-tight text-white transition-colors hover:bg-cyan-400 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Subscribing...' : 'Subscribe'}</span>
            <FiArrowRight
              aria-hidden="true"
              className="-mr-4 opacity-0 transition-all group-hover:-mr-0 group-hover:opacity-100 group-active:-rotate-45"
            />
          </button>
          <div className="pointer-events-none absolute inset-0 z-10 rounded-full">
            <motion.div
              style={{ backgroundImage }}
              className="mask-with-browser-support absolute -inset-[1px] rounded-full border border-transparent bg-origin-border"
            />
          </div>
        </form>
        {message && (
          <p
            role={messageType === 'error' ? 'alert' : 'status'}
            className={`mx-auto mt-4 max-w-md text-sm ${
              messageType === 'error' ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {message}
          </p>
        )}
      </div>
      <style jsx global>{`
        .mask-with-browser-support {
          mask:
            linear-gradient(#fff 0 0) padding-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      `}</style>
    </section>
  );
}

function TestimonialAvatar({ author, src }: { author: string; src?: string | null }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const initials =
    author
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase() || '?';
  const escapedInitials = initials.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character];
  });
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0891b2"/><stop offset="1" stop-color="#3730a3"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#bg)"/><text x="32" y="41" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="24" font-weight="700">${escapedInitials}</text></svg>`;
  const imageSrc =
    src && !imageFailed ? src : `data:image/svg+xml,${encodeURIComponent(fallbackSvg)}`;

  return (
    <img
      src={imageSrc}
      alt={author}
      onError={() => setImageFailed(true)}
      className="mb-4 h-12 w-12 rounded-full border border-white/20 object-cover object-top"
    />
  );
}

interface LandingTestimonial {
  quote: string;
  author: string;
  role?: string | null;
  avatar?: string | null;
}

function StaggerTestimonials({ items }: { items: LandingTestimonial[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [cardSize, setCardSize] = React.useState(290);
  const count = items.length;

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)');
    const updateCardSize = () => setCardSize(mediaQuery.matches ? 365 : 290);

    updateCardSize();
    mediaQuery.addEventListener('change', updateCardSize);
    return () => mediaQuery.removeEventListener('change', updateCardSize);
  }, []);

  if (!count) return null;

  const move = (offset: number) => {
    setActiveIndex(current => (current + offset + count) % count);
  };

  return (
    <div className="relative mt-8 h-[560px] w-full overflow-hidden sm:h-[600px]">
      {items.map((testimonial, index) => {
        const relativeIndex = (index - activeIndex + count) % count;
        const position = relativeIndex > count / 2 ? relativeIndex - count : relativeIndex;
        const isActive = position === 0;

        return (
          <motion.button
            key={`${testimonial.author}-${index}`}
            type="button"
            aria-label={`Show testimonial by ${testimonial.author}`}
            aria-pressed={isActive}
            onClick={() => move(position)}
            className={`absolute left-1/2 top-1/2 overflow-hidden border-2 p-6 text-left transition-colors duration-500 sm:p-8 ${
              isActive
                ? 'z-10 border-cyan-300/70 bg-gradient-to-br from-cyan-700 to-blue-900 text-white'
                : 'z-0 border-white/10 bg-slate-900/95 text-slate-200'
            }`}
            style={{
              clipPath:
                'polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% 100%, 40px 100%, 0 100%, 0 0)',
            }}
            animate={{
              width: cardSize,
              height: cardSize,
              x: `calc(-50% + ${position * (cardSize / 1.5)}px)`,
              y: `calc(-50% + ${isActive ? -48 : position % 2 ? 14 : -14}px)`,
              rotate: isActive ? 0 : position % 2 ? 2.5 : -2.5,
              boxShadow: isActive
                ? '0 12px 32px rgba(8, 145, 178, 0.3)'
                : '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
            transition={{
              type: 'spring',
              mass: 2,
              stiffness: 350,
              damping: 42,
            }}
          >
            <div className="flex h-full flex-col">
              <TestimonialAvatar author={testimonial.author} src={testimonial.avatar} />
              <p className="line-clamp-5 text-sm leading-6 sm:text-base">“{testimonial.quote}”</p>
              <div className="mt-auto pt-4">
                <p
                  className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-100'}`}
                >
                  — {testimonial.author}
                </p>
                {testimonial.role && (
                  <p className={`mt-1 text-xs ${isActive ? 'text-cyan-100/80' : 'text-slate-400'}`}>
                    {testimonial.role}
                  </p>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => move(-1)}
          className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-slate-900/90 text-slate-100 transition hover:border-cyan-300/60 hover:bg-cyan-950"
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => move(1)}
          className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-slate-900/90 text-slate-100 transition hover:border-cyan-300/60 hover:bg-cyan-950"
        >
          <ChevronRight aria-hidden="true" size={22} />
        </button>
      </div>
    </div>
  );
}

function CryptoIcon({
  name,
  size = 32,
  fallback,
  kind,
}: {
  name: string;
  size?: number;
  fallback?: string;
  kind?: 'token' | 'network' | 'exchange';
}) {
  const n = name.trim();
  const lower = n.toLowerCase();

  const exchanges = new Set([
    'uniswap',
    'uniswap v2',
    'uniswap v3',
    'sushi',
    'sushiswap',
    'pancake',
    'pancakeswap',
    'raydium',
    '1inch',
  ]);
  const networks = new Set([
    'ethereum',
    'polygon',
    'optimism',
    'base',
    'arbitrum',
    'scroll',
    'fantom',
    'linea',
    'mantle',
    'solana',
  ]);
  const tokens = new Set([
    'bitcoin',
    'eth',
    'ethereum',
    'usdc',
    'usdt',
    'dai',
    'solana',
    'sol',
    'matic',
    'arb',
  ]);

  const type: 'token' | 'network' | 'exchange' = kind
    ? kind
    : exchanges.has(lower)
      ? 'exchange'
      : networks.has(lower)
        ? 'network'
        : 'token';

  try {
    if (type === 'exchange') return <ExchangeIcon name={n} variant="branded" size={String(size)} />;
    if (type === 'network') return <NetworkIcon name={n} variant="branded" size={String(size)} />;
    return <TokenIcon name={n} variant="branded" size={String(size)} />;
  } catch {
    // Ignore runtime icon errors and fallback to local asset.
  }

  const fallbackSrc = `/${(fallback || name).toLowerCase()}.svg`;
  return <Image src={fallbackSrc} alt={name} width={size} height={size} className="opacity-90" />;
}

const NETWORK_LOGOS = [
  'Ethereum',
  'Polygon',
  'Optimism',
  'Base',
  'Arbitrum',
  'Scroll',
  'Fantom',
  'Linea',
  'Mantle',
];

function NetworkLogoCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredLogo, setHoveredLogo] = React.useState<string | null>(null);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);

  React.useEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    const measure = () => setTrackWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();

    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (shouldReduceMotion || hoveredLogo || !trackWidth) return;

    const next = x.get() - (delta / 1000) * 56;
    x.set(next <= -trackWidth ? next % trackWidth : next);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <motion.div style={{ x }} className="flex w-max">
        <div ref={measureRef} className="flex">
          {NETWORK_LOGOS.map(name => (
            <NetworkLogoCell
              key={`primary-${name}`}
              name={name}
              hoveredLogo={hoveredLogo}
              setHoveredLogo={setHoveredLogo}
            />
          ))}
        </div>
        <div className="flex" aria-hidden="true">
          {NETWORK_LOGOS.map(name => (
            <NetworkLogoCell
              key={`duplicate-${name}`}
              name={name}
              hoveredLogo={hoveredLogo}
              setHoveredLogo={setHoveredLogo}
              duplicate
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NetworkLogoCell({
  name,
  hoveredLogo,
  setHoveredLogo,
  duplicate = false,
}: {
  name: string;
  hoveredLogo: string | null;
  setHoveredLogo: React.Dispatch<React.SetStateAction<string | null>>;
  duplicate?: boolean;
}) {
  const isDimmed = hoveredLogo !== null && hoveredLogo !== name;

  return (
    <motion.button
      type="button"
      onPointerEnter={() => setHoveredLogo(name)}
      onPointerLeave={() => setHoveredLogo(current => (current === name ? null : current))}
      onFocus={() => setHoveredLogo(name)}
      onBlur={() => setHoveredLogo(current => (current === name ? null : current))}
      animate={{
        filter: isDimmed ? 'grayscale(1)' : 'grayscale(0)',
        opacity: isDimmed ? 0.48 : 1,
      }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex h-[72px] min-w-[148px] shrink-0 items-center justify-center px-5 md:h-[82px] md:min-w-[176px] md:px-7"
      aria-label={`${name} network`}
      aria-hidden={duplicate}
      tabIndex={duplicate ? -1 : 0}
    >
      <span className="flex items-center gap-3 whitespace-nowrap">
        <CryptoIcon name={name} size={40} kind="network" />
        <span className="text-sm font-semibold tracking-tight text-slate-200 md:text-base">
          {name}
        </span>
      </span>
    </motion.button>
  );
}

interface LandingStat {
  value: string;
  label: string;
}

function StatsShowcase({ title, items }: { title: string; items: LandingStat[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const spring = { type: 'spring' as const, stiffness: 320, damping: 32 };
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div className="relative overflow-hidden" variants={fadeUp}>
      <div className="relative px-6 py-14 text-center sm:px-8 sm:py-16 md:px-10 md:py-[4.5rem]">
        <h2 className={`${sectionHeadingClass} mx-auto text-center`}>{title}</h2>
      </div>
      <div
        className="relative grid grid-cols-2 md:grid-cols-4"
        onMouseLeave={() => setActiveIndex(0)}
      >
        {items.map((stat, index) => {
          const isActive = index === activeIndex;

          return (
            <motion.button
              key={`${stat.label}-${index}`}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              aria-pressed={isActive}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative overflow-hidden px-6 py-8 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset md:px-8 md:py-10"
            >
              {isActive && (
                <>
                  <motion.div
                    layoutId="nyaltx-stats-left"
                    transition={spring}
                    className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent md:hidden"
                  />
                  <motion.div
                    layoutId="nyaltx-stats-right"
                    transition={spring}
                    className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent md:hidden"
                  />
                  <motion.div
                    layoutId="nyaltx-stats-top"
                    transition={spring}
                    className="absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent md:block"
                  />
                  <motion.div
                    layoutId="nyaltx-stats-bottom"
                    transition={spring}
                    className="absolute inset-x-0 bottom-0 hidden h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent md:block"
                  />
                </>
              )}
              <div className="relative flex min-h-[120px] flex-col items-center justify-center gap-2">
                <span
                  className={`text-[clamp(2.15rem,3.9vw,3.45rem)] leading-none tracking-[-0.07em] transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {stat.value}
                </span>
                <span
                  className={`max-w-[13rem] text-[clamp(0.9rem,1.05vw,1.02rem)] leading-[1.32] tracking-[-0.04em] transition-colors duration-300 ${
                    isActive ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {stat.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function Feature({
  title,
  desc,
  icon,
  href,
  linkText = 'Open Dashboard',
}: {
  title: string;
  desc: string;
  icon?: string;
  href?: string;
  linkText?: string;
}) {
  const Icon = getFeatureIcon(icon, title, desc);

  return (
    <LandingCard>
      <Icon aria-hidden="true" className="text-cyan-300" size={28} strokeWidth={1.75} />
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-gray-300/90 text-sm">{desc}</p>
      {href && (
        <Link
          href={href}
          className="mt-2 inline-flex items-center text-sm font-medium text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          {linkText}
        </Link>
      )}
    </LandingCard>
  );
}

interface LandingNewsStory {
  _id: string;
  title: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt?: string;
  author?: string;
  slug?: string;
  category?: string;
  tags?: string[];
  sourceUrl?: string;
  isSyndicated?: boolean;
}

function NewsHubCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const [stories, setStories] = React.useState<LandingNewsStory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const loadStories = async () => {
      try {
        const response = await fetch('/api/newshub?page=1&limit=8', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to load News Hub stories');
        const data: { articles?: LandingNewsStory[] } = await response.json();
        setStories(Array.isArray(data.articles) ? data.articles : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Landing page News Hub fetch error:', error);
          setFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadStories();
    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(element);
    setContainerWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  const viewportWidth = containerWidth + 48;
  const visibleCount = viewportWidth >= 1024 ? 3 : viewportWidth >= 640 ? 2 : 1;
  const gap = 20;
  const cardWidth = containerWidth
    ? (containerWidth - gap * (visibleCount - 1)) / visibleCount
    : 350;
  const maxOffset = Math.max(0, stories.length - visibleCount);

  React.useEffect(() => {
    setOffset(current => Math.min(current, maxOffset));
  }, [maxOffset]);

  React.useEffect(() => {
    if (shouldReduceMotion || isPaused || loading || failed || maxOffset === 0) return;

    const interval = window.setInterval(() => {
      setOffset(current => (current >= maxOffset ? 0 : current + 1));
    }, 5000);

    return () => window.clearInterval(interval);
  }, [failed, isPaused, loading, maxOffset, shouldReduceMotion]);

  return (
    <section
      className="mx-auto max-w-7xl px-6 py-16 md:py-20"
      aria-labelledby="landing-news-title"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={event => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-cyan-300">NEWS HUB</p>
          <h2 id="landing-news-title" className={sectionHeadingClass}>
            Today in digital markets
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/newshub" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            All stories <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={() => setOffset(current => Math.max(0, current - 1))}
            disabled={offset === 0}
            aria-label="Show previous stories"
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            onClick={() => setOffset(current => Math.min(maxOffset, current + 1))}
            disabled={offset >= maxOffset}
            aria-label="Show more stories"
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="overflow-hidden">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400" role="status">
            Loading the latest stories...
          </p>
        ) : failed ? (
          <p className="py-8 text-center text-sm text-slate-400" role="status">
            Latest stories are temporarily unavailable.
          </p>
        ) : stories.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400" role="status">
            No published stories yet.
          </p>
        ) : (
          <motion.div
            animate={{ x: -(offset * (cardWidth + gap)) }}
            transition={{
              ease: 'easeInOut',
              duration: shouldReduceMotion ? 0 : 0.35,
            }}
            className="flex gap-5"
          >
            {stories.map(story => {
              const imageUrl = story.featuredImage ? toReliableIpfsUrl(story.featuredImage) : '';
              const category = story.category || story.tags?.[0] || 'Markets';
              const dateValue = story.publishedAt || story.createdAt;
              const parsedDate = dateValue ? new Date(dateValue) : null;
              const date =
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recently';
              const card = (
                <article
                  className="h-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-cyan-300/40 hover:bg-white/[0.05]"
                  style={{ width: cardWidth }}
                >
                  <div
                    className="h-44 bg-gradient-to-br from-slate-800 to-cyan-950"
                    aria-hidden="true"
                  >
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <span className="inline-flex rounded-full border border-cyan-300/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                      {category}
                    </span>
                    <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-white">
                      {story.title}
                    </h3>
                    <p className="mt-3 text-xs text-slate-400">
                      {story.author || 'NYALTX'} <span aria-hidden="true">·</span> {date}
                    </p>
                  </div>
                </article>
              );

              return (
                <div key={story._id} className="shrink-0" style={{ width: cardWidth }}>
                  {story.isSyndicated && story.sourceUrl ? (
                    <a
                      href={story.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label={`Read ${story.title} from ${story.author || 'source'}`}
                    >
                      {card}
                    </a>
                  ) : story.slug ? (
                    <Link
                      href={`/news/${story.slug}`}
                      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label={`Read ${story.title}`}
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface LandingEvent {
  id: string | number;
  title: { en?: string } | string;
  date_event: string;
  displayed_date?: string;
  source?: string;
  coins?: Array<{
    image?: string;
    name?: string;
    symbol?: string;
  }>;
}

function UpcomingEventsSection() {
  const shouldReduceMotion = useReducedMotion();
  const [events, setEvents] = React.useState<LandingEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events?page=1&max=50', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to load upcoming events');
        const data: { body?: LandingEvent[] } = await response.json();
        const now = Date.now();
        const upcomingEvents = (Array.isArray(data.body) ? data.body : [])
          .filter(event => {
            const date = Date.parse(event.date_event);
            return Number.isFinite(date) && date >= now;
          })
          .sort((first, second) => Date.parse(first.date_event) - Date.parse(second.date_event))
          .slice(0, 4);

        setEvents(upcomingEvents);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Landing page events fetch error:', error);
          setFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadEvents();
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mx-auto max-w-7xl px-6 py-16 md:py-20"
      aria-labelledby="landing-events-title"
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-cyan-300">EVENTS</p>
          <h2 id="landing-events-title" className={sectionHeadingClass}>
            Upcoming on NYALTX
          </h2>
        </div>
        <Link
          href="/dashboard/events"
          className="text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          View all events <span aria-hidden="true">→</span>
        </Link>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400" role="status">
          Loading upcoming events...
        </p>
      ) : failed ? (
        <p className="py-8 text-center text-sm text-slate-400" role="status">
          Upcoming events are temporarily unavailable.
        </p>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400" role="status">
          No upcoming events listed yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map(event => {
            const date = new Date(event.date_event);
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            const day = date.toLocaleDateString('en-US', { day: '2-digit' });
            const year = date.toLocaleDateString('en-US', { year: 'numeric' });
            const dateLabel =
              event.displayed_date ||
              date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            const title =
              typeof event.title === 'string' ? event.title : event.title?.en || 'Untitled event';
            const token = event.coins?.[0];
            const detailsHref = event.source?.startsWith('https://')
              ? event.source
              : '/dashboard/events';

            return (
              <article
                key={event.id}
                className="grid grid-cols-1 items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan-300/30 hover:bg-white/[0.05] sm:grid-cols-2 sm:gap-5 sm:p-5"
              >
                <time
                  dateTime={date.toISOString()}
                  aria-label={dateLabel}
                  className="mx-auto block w-32 shrink-0 overflow-hidden rounded-xl border-2 border-cyan-500 bg-cyan-500 shadow-lg shadow-cyan-950/30"
                >
                  <div className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 px-2 py-1 text-center text-sm font-medium uppercase tracking-wide text-white">
                    {month}
                  </div>
                  <div className="relative h-24 bg-white">
                    <motion.div
                      initial={shouldReduceMotion ? false : { rotateX: 0 }}
                      animate={{ rotateX: 0 }}
                      transition={{ duration: 0.75, ease: 'easeInOut' }}
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                        backfaceVisibility: 'hidden',
                        transformOrigin: 'bottom',
                      }}
                      className="absolute inset-0 grid place-items-center text-center text-6xl font-semibold text-slate-950"
                    >
                      {day}
                    </motion.div>
                    <motion.div
                      initial={shouldReduceMotion ? false : { rotateX: '180deg' }}
                      animate={{ rotateX: '0deg' }}
                      transition={{ duration: 0.75, ease: 'easeInOut' }}
                      style={{
                        clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
                        backfaceVisibility: 'hidden',
                        transformOrigin: 'top',
                      }}
                      className="absolute inset-0 grid place-items-center text-center text-6xl font-semibold text-slate-950"
                    >
                      {day}
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500">
                        {year}
                      </span>
                    </motion.div>
                  </div>
                </time>
                <div className="flex min-w-0 flex-col justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {token?.image && (
                      <img
                        src={token.image}
                        alt={token.name || token.symbol || 'Token'}
                        loading="lazy"
                        className="h-9 w-9 shrink-0 rounded-full border border-white/10 bg-white/5 object-contain p-1"
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-semibold text-white">{title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Crypto event <span aria-hidden="true">·</span> {dateLabel}
                      </p>
                    </div>
                  </div>
                  <a
                    href={detailsHref}
                    target={detailsHref.startsWith('https://') ? '_blank' : undefined}
                    rel={detailsHref.startsWith('https://') ? 'noopener noreferrer' : undefined}
                    className="self-start text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    Details <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getFeatureIcon(icon: string | undefined, title: string, desc: string): LucideIcon {
  switch (icon?.trim().toLowerCase()) {
    case 'network':
      return Network;
    case 'layers':
      return Layers3;
    case 'megaphone':
      return Megaphone;
    case 'wallet':
      return Wallet;
    case 'chart':
      return BarChart3;
    case 'shield':
      return ShieldCheck;
    case 'sparkles':
      return Sparkles;
  }

  const content = `${title} ${desc}`.toLowerCase();

  if (/network|chain/.test(content)) return Network;
  if (/promot|placement|campaign|marketing/.test(content)) return Megaphone;
  if (/payment|pay|wallet|card/.test(content)) return Wallet;
  if (/analytics|insight|track|monitor|stat/.test(content)) return BarChart3;
  if (/security|secure|protect|custod/.test(content)) return ShieldCheck;
  if (/multi|layer|ecosystem/.test(content)) return Layers3;

  return Sparkles;
}

function Step({ index, title, desc }: { index: number; title: string; desc: string }) {
  return (
    <LandingCard>
      <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-bold">
        {index}
      </div>
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-gray-300/90 text-sm">{desc}</p>
    </LandingCard>
  );
}

function LandingCard({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const accentLineClass =
    'pointer-events-none absolute from-transparent via-cyan-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100';

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative flex h-full min-h-[184px] flex-col items-center justify-center gap-2 overflow-hidden px-6 py-8 text-center"
    >
      <div
        aria-hidden="true"
        className={`${accentLineClass} inset-y-0 left-0 w-px bg-gradient-to-b md:hidden`}
      />
      <div
        aria-hidden="true"
        className={`${accentLineClass} inset-y-0 right-0 w-px bg-gradient-to-b md:hidden`}
      />
      <div
        aria-hidden="true"
        className={`${accentLineClass} inset-x-0 top-0 hidden h-px bg-gradient-to-r md:block`}
      />
      <div
        aria-hidden="true"
        className={`${accentLineClass} inset-x-0 bottom-0 hidden h-px bg-gradient-to-r md:block`}
      />
      <div className="relative flex flex-col items-center justify-center gap-2">{children}</div>
    </motion.div>
  );
}
