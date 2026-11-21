'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import { NEWS_PAYPAL_CRYPTO_DRAFT_KEY } from '@/lib/newsCryptoDraft';
import { useEffect, useState } from 'react';

const SubmitNewsModal = dynamic(
  () => import('@/components/NewsHub/SubmitNewsModal').then(module => module.default),
  { ssr: false }
);

type PublishingPlan = 'feed' | 'slider' | 'test';

const plans: {
  id: PublishingPlan;
  number: string;
  label: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}[] = [
  {
    id: 'feed',
    number: '01',
    label: 'Publish',
    name: 'News Release',
    price: '$99',
    description: 'Publish your announcement on NYALTX News Hub.',
    features: [
      'Dedicated article page',
      'Company logo and featured image',
      'Company links and shareable URL',
    ],
  },
  {
    id: 'slider',
    number: '02',
    label: 'Featured Visibility',
    name: 'Featured News Release',
    price: '$199',
    description: 'Give your announcement additional exposure on NYALTX.',
    features: [
      'Everything in News Release',
      'Seven days of featured placement',
      'Branded social promotional graphic and NYALTX social posts',
    ],
    featured: true,
  },
];

export default function NewsPublishingPage({
  openModalOnLoad = false,
  initialPlan = 'feed',
  enableTestPlan = false,
}: {
  openModalOnLoad?: boolean;
  initialPlan?: PublishingPlan;
  enableTestPlan?: boolean;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PublishingPlan>(initialPlan);
  const [modalOpen, setModalOpen] = useState(openModalOnLoad);

  useEffect(() => {
    const hasCryptoReturn = new URLSearchParams(window.location.search).has('paypalCryptoStatus');
    let hasSavedDraft = false;
    try {
      hasSavedDraft = Boolean(sessionStorage.getItem(NEWS_PAYPAL_CRYPTO_DRAFT_KEY));
    } catch (error) {
      console.error('Could not restore the pending news payment draft:', error);
    }

    if (hasCryptoReturn || hasSavedDraft) setModalOpen(true);
  }, []);

  const openSubmitModal = (plan: PublishingPlan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const closeSubmitModal = () => {
    try {
      const savedDraft = sessionStorage.getItem(NEWS_PAYPAL_CRYPTO_DRAFT_KEY);
      if (!savedDraft || !JSON.parse(savedDraft)?.paymentId) {
        sessionStorage.removeItem(NEWS_PAYPAL_CRYPTO_DRAFT_KEY);
      }
    } catch (error) {
      console.error('Could not clear the abandoned news payment draft:', error);
    }
    setModalOpen(false);
  };

  return (
    <main className="nps-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .nps-page{--ink:#eaf2ff;--muted:#91a3bd;--line:rgba(148,174,211,.16);--cyan:#67d8ff;min-height:100vh;background:#070b12;color:var(--ink);font:16px/1.6 Arial,sans-serif}
            .nps-page *{box-sizing:border-box}
            .nps-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
            .nps-hero{position:relative;isolation:isolate;overflow:hidden;width:100%;margin:0 auto;border:1px solid rgba(132,177,235,.2);border-radius:0;background:radial-gradient(ellipse at 70% 88%,rgba(38,113,224,.25),transparent 42%),radial-gradient(ellipse at 88% 12%,rgba(30,119,190,.15),transparent 35%),linear-gradient(145deg,#07152f 0%,#040c22 52%,#080f24 100%);box-shadow:0 28px 90px rgba(0,0,0,.3)}
            .nps-hero:before{position:absolute;z-index:0;inset:0;pointer-events:none;content:'';opacity:.34;background-image:radial-gradient(circle,rgba(118,176,255,.72) 1px,transparent 1.4px);background-size:22px 22px;mask-image:radial-gradient(ellipse at 68% 48%,#000 0%,transparent 72%)}
            .nps-hero:after{position:absolute;z-index:0;right:-12%;bottom:4%;width:65%;height:45%;pointer-events:none;content:'';background:radial-gradient(ellipse,rgba(65,151,255,.2),transparent 70%);filter:blur(18px)}
            .nps-hero>*{position:relative;z-index:1}
            .nps-btn{position:relative;display:inline-flex;justify-content:center;align-items:center;min-height:44px;border:1px solid transparent;border-radius:999px;background:linear-gradient(180deg,#fff,#dceaff);color:#071326!important;cursor:pointer;font:inherit;font-size:14px;font-weight:700;padding:11px 21px;text-align:center;text-decoration:none;box-shadow:inset 0 1px 0 #fff,0 8px 24px rgba(99,166,255,.15);transition:transform .2s ease,filter .2s ease,box-shadow .2s ease}
            .nps-btn:hover{filter:brightness(1.04);transform:translateY(-2px);box-shadow:inset 0 1px 0 #fff,0 12px 28px rgba(99,166,255,.23)}
            .nps-btn:focus-visible{outline:2px solid #7cc4ff;outline-offset:3px}
            .nps-btn:disabled{cursor:wait;opacity:.65}
            .nps-btn-outline{background:rgba(7,18,40,.55);border-color:rgba(171,201,241,.28);color:#eaf2ff!important;box-shadow:none}
            .nps-btn-outline:hover{background:rgba(23,43,76,.8);box-shadow:0 8px 24px rgba(0,0,0,.15)}
            .nps-btn-small{min-height:38px;font-size:13px;padding:8px 16px}
            .nps-hero-grid{display:block;padding:clamp(64px,10vw,120px) 32px clamp(64px,10vw,120px)}
            .nps-hero-grid>div{max-width:900px}
            .nps-eyebrow{display:flex;align-items:center;gap:10px;color:#8bdcff;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase}
            .nps-page h1,.nps-page h2,.nps-page h3,.nps-page p{margin:0}
            .nps-page h1{max-width:780px;color:#f4f8ff;font-size:clamp(44px,6.6vw,82px);font-weight:500;letter-spacing:-.065em;line-height:.98;margin:21px 0 22px}
            .nps-page h1 em{color:#9bcaff;font-family:Georgia,Cambria,"Times New Roman",serif;font-size:1.02em;font-weight:400;font-style:italic;letter-spacing:-.055em}
            .nps-page h2{color:#f4f8ff;font-size:clamp(28px,3vw,36px);font-weight:550;letter-spacing:-1.2px;line-height:1.15;margin:7px 0 12px}
            .nps-page h3{color:#edf4ff;font-size:21px;font-weight:600;letter-spacing:-.35px;line-height:1.2}
            .nps-lead{max-width:650px;color:#aebfd9;font-size:17px;line-height:1.75}
            .nps-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
            .nps-section{padding:76px 0}
            .nps-section:nth-of-type(even){background:linear-gradient(180deg,rgba(9,15,27,.56),rgba(7,11,18,0))}
            .nps-muted{color:var(--muted)}
            .nps-subhead{max-width:750px;color:#9aabc3}
            .nps-plans{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:28px}
            .nps-plan{position:relative;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(139,168,209,.18);border-radius:20px;background:linear-gradient(145deg,#101d32,#0a1221);padding:28px;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}
            .nps-plan-featured{border-color:rgba(98,198,255,.66);background:radial-gradient(ellipse at 100% 0,rgba(35,119,200,.16),transparent 45%),linear-gradient(145deg,#10213b,#0a1323);box-shadow:0 16px 45px rgba(16,91,170,.12)}
            .nps-plan-featured:before{position:absolute;top:0;left:28px;width:100px;height:1px;content:'';background:linear-gradient(90deg,transparent,#7dd6ff,transparent)}
            .nps-plan-tag{color:#82d8ff;font-size:10px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;text-transform:uppercase}
            .nps-price{color:#f1f6ff;font-size:44px;font-weight:650;letter-spacing:-2px;line-height:1.2;margin-top:18px}
            .nps-price small{color:var(--muted);font-size:13px;font-weight:400;letter-spacing:0}
            .nps-discount{color:#83d8ff;font-size:12px;font-weight:700;margin:4px 0 16px}
            .nps-description{color:#a3b4cc;font-size:14px;min-height:68px}
            .nps-plan ul{flex:1;list-style:none;margin:18px 0 24px;padding:0}
            .nps-plan li{position:relative;border-top:1px solid rgba(139,168,209,.13);font-size:13px;padding:9px 0 9px 22px}
            .nps-plan li:before{position:absolute;left:0;color:#7ad9ff;content:'✓';font-weight:700}
            .nps-footer{border-top:1px solid var(--line);background:#070b12;color:#94a6bf;font-size:12px;padding:28px 0}
            .nps-footer a{color:#7ccfff;text-decoration:none}
            @media(max-width:900px){.nps-wrap{padding:0 22px}.nps-hero-grid{padding:64px 22px}}
            @media(max-width:640px){.nps-wrap{padding:0 18px}.nps-hero-grid{padding:56px 18px}.nps-page h1{font-size:clamp(42px,12vw,60px);margin:18px 0}.nps-lead{font-size:15px}.nps-section{padding:52px 0}.nps-plans{grid-template-columns:1fr}.nps-description{min-height:0}.nps-plan{padding:22px}}
            @media(prefers-reduced-motion:reduce){.nps-page *{scroll-behavior:auto!important;transition-duration:.01ms!important}}
          `,
        }}
      />

      <PublicHeader />

      <section className="nps-hero">
        <div className="nps-wrap nps-hero-grid">
          <div>
            <h1>
              Your story deserves
              <br />
              <em>more than a headline.</em>
            </h1>
            <p className="nps-lead">
              Reach fintech, digital asset and capital markets audiences with a streamlined
              announcement and product-launch publishing process on NYALTX News Hub.
            </p>
            <div className="nps-actions">
              <a className="nps-btn" href="#news">
                Explore packages
              </a>
              <Link className="nps-btn nps-btn-outline" href="/newshub">
                Browse the News Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="nps-section" id="news">
        <div className="nps-wrap">
          <div className="nps-eyebrow">01 / News Hub</div>
          <h2>Publish your news. Expand your visibility.</h2>
          <p className="nps-muted nps-subhead">
            Straightforward, one-time publishing options for corporate announcements, product
            launches and industry updates.
          </p>
          <div className="nps-plans">
            {plans.map(plan => (
              <article
                className={`nps-plan${plan.featured ? ' nps-plan-featured' : ''}`}
                key={plan.id}
              >
                <div className="nps-plan-tag">
                  {plan.number} / {plan.label}
                </div>
                <h3>{plan.name}</h3>
                <div className="nps-price">
                  {plan.price}
                  <small> / release</small>
                </div>
                <p className="nps-description">{plan.description}</p>
                <ul>
                  {plan.features.map(feature => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="nps-actions">
                  <button
                    className="nps-btn"
                    onClick={() => openSubmitModal(plan.id)}
                    type="button"
                  >
                    {plan.id === 'feed' ? 'Publish Your News — $99' : 'Get Featured — $199'}
                  </button>
                  <a className="nps-btn nps-btn-outline" href="https://www.nyaltx.pro/news-hub">
                    View News Hub
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="nps-footer">
        <div className="nps-wrap">
          NYALTX · New York Alt Exchange &nbsp; | &nbsp; News Hub publishing
        </div>
      </footer>

      {modalOpen && (
        <SubmitNewsModal
          isOpen={modalOpen}
          initialType="news"
          initialPlan={selectedPlan}
          enableTestPlan={enableTestPlan}
          onClose={closeSubmitModal}
        />
      )}
    </main>
  );
}
