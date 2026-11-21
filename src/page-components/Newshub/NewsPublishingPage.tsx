'use client';

import dynamic from 'next/dynamic';
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
            .nps-hero{position:relative;isolation:isolate;overflow:hidden;width:100%;margin:-80px auto 0;border:1px solid rgba(132,177,235,.2);border-radius:0;background:radial-gradient(ellipse at 70% 88%,rgba(38,113,224,.25),transparent 42%),radial-gradient(ellipse at 88% 12%,rgba(30,119,190,.15),transparent 35%),linear-gradient(145deg,#07152f 0%,#040c22 52%,#080f24 100%);box-shadow:0 28px 90px rgba(0,0,0,.3)}
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
            .nps-hero-grid{display:flex;min-height:100vh;padding:108px 32px 72px}
            .nps-hero-grid>div{display:flex;flex:1;flex-direction:column;justify-content:center;max-width:900px;margin:0 auto;text-align:center}
            .nps-page h1,.nps-page h2,.nps-page h3,.nps-page p{margin:0}
            .nps-page h1{max-width:780px;margin:21px auto 22px;color:#f4f8ff;font-size:clamp(44px,6.6vw,82px);font-weight:500;letter-spacing:-.065em;line-height:.98}
            .nps-page h1 em{color:#9bcaff;font-family:Georgia,Cambria,"Times New Roman",serif;font-size:1.02em;font-weight:400;font-style:italic;letter-spacing:-.055em}
            .nps-page h2{color:#f4f8ff;font-size:clamp(30px,4vw,44px);font-weight:500;letter-spacing:-.055em;line-height:1.02;margin:7px 0 12px}
            .nps-page h3{color:#edf4ff;font-size:21px;font-weight:600;letter-spacing:-.35px;line-height:1.2}
            .nps-hero .nps-lead{max-width:650px;margin:0 auto;color:#aebfd9;font-size:17px;line-height:1.75;text-align:center}
            .nps-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:28px}
            .nps-section{padding:76px 0}
            .nps-section:nth-of-type(even){background:linear-gradient(180deg,rgba(9,15,27,.56),rgba(7,11,18,0))}
            .nps-section#news{background-color:#0b0b0b;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 1px,transparent 1px 10px)}
            .nps-section#news h2,.nps-section#news .nps-subhead{text-align:center}
            .nps-section#news .nps-subhead{margin-inline:auto}
            .nps-muted{color:var(--muted)}
            .nps-subhead{max-width:750px;color:#9aabc3}
            .nps-plans{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:28px}
            .nps-plan-frame{position:relative;display:flex;min-width:0}
            .nps-plan-corner{position:absolute;z-index:1;width:12px;height:12px;border:0 solid #67d8ff;pointer-events:none}
            .nps-plan-corner-tl{top:-6px;left:-6px;border-top-width:1.5px;border-left-width:1.5px}
            .nps-plan-corner-tr{top:-6px;right:-6px;border-top-width:1.5px;border-right-width:1.5px}
            .nps-plan-corner-bl{bottom:-6px;left:-6px;border-bottom-width:1.5px;border-left-width:1.5px}
            .nps-plan-corner-br{right:-6px;bottom:-6px;border-right-width:1.5px;border-bottom-width:1.5px}
            .nps-plan{position:relative;display:flex;flex:1;flex-direction:column;gap:18px;border:1px solid #262626;border-radius:0;background:#181818;color:#eee;padding:26px 22px 22px;transition:transform .35s ease,box-shadow .35s,border-color .25s}
            .nps-plan:hover{transform:translateY(-4px);border-color:#464646;box-shadow:0 10px 30px -14px rgba(0,0,0,.8)}
            .nps-plan-featured{border-color:rgba(103,216,255,.62);background:linear-gradient(145deg,#102440,#0b172b);color:#eaf2ff;box-shadow:0 12px 36px rgba(103,216,255,.12)}
            .nps-plan-featured:hover{border-color:#9be7ff;box-shadow:0 14px 38px rgba(0,0,0,.45),0 0 24px rgba(103,216,255,.12)}
            .nps-plan-tag{color:#a0a0a0;font-size:10px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase}
            .nps-plan-featured .nps-plan-tag{color:#8bdcff}
            .nps-plan h3{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#f1f1f1;font-size:clamp(18px,2.1vw,22px);font-weight:500;letter-spacing:-.04em;line-height:1.08}
            .nps-plan-featured h3{color:#f4f8ff}
            .nps-plan-featured .nps-plan-badge{color:#8bdcff}
            .nps-plan-badge{flex:none;border:1px solid currentColor;color:#777;font-size:9px;font-weight:500;letter-spacing:.03em;padding:3px 7px}
            .nps-price{display:flex;align-items:baseline;gap:7px;color:#f1f1f1;font-size:46px;font-weight:500;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
            .nps-price small{color:#929292;font-size:12px;font-weight:400;letter-spacing:0}
            .nps-plan-featured .nps-price{color:#f4f8ff}
            .nps-plan-featured .nps-price small{color:#91a3bd}
            .nps-discount{color:#83d8ff;font-size:12px;font-weight:700;margin:4px 0 16px}
            .nps-description{min-height:3em;color:#929292;font-size:13px;line-height:1.5}
            .nps-plan-featured .nps-description{color:#aebfd9}
            .nps-plan ul{display:grid;flex:1;gap:10px;border-top:1px dashed #363636;list-style:none;margin:0;padding:16px 0 0}
            .nps-plan-featured ul{border-top-color:rgba(103,216,255,.3)}
            .nps-plan li{display:flex;align-items:flex-start;gap:9px;color:#c9c9c9;font-size:13px;line-height:1.45}
            .nps-plan li:before{flex:none;color:#eee;content:'✓';font-weight:700}
            .nps-plan-featured li{color:#d8e6f8}
            .nps-plan-featured li:before{color:#67d8ff}
            .nps-plan .nps-actions{display:grid;grid-template-columns:minmax(0,1fr);justify-content:stretch;gap:9px;margin-top:auto;padding-top:4px}
            .nps-plan .nps-btn{width:100%;min-height:44px;border-radius:2px;background:#eee;color:#121212!important;box-shadow:none;font-size:13px;font-weight:600}
            .nps-plan .nps-btn:hover{transform:translateY(-1px);background:#fff;box-shadow:none}
            .nps-plan-featured .nps-btn{background:#67d8ff;color:#071326!important;box-shadow:0 8px 24px rgba(103,216,255,.16)}
            .nps-plan-featured .nps-btn:hover{background:#9be7ff;box-shadow:0 10px 28px rgba(103,216,255,.22)}
            .nps-plan .nps-btn-outline{border:1px solid #444;background:transparent;color:#ccc!important}
            .nps-plan .nps-btn-outline:hover{border-color:#aaa;background:#222}
            .nps-plan-featured .nps-btn-outline{border-color:rgba(171,201,241,.45);color:#eaf2ff!important}
            .nps-plan-featured .nps-btn-outline:hover{border-color:#67d8ff;background:rgba(23,43,76,.8)}
            @media(max-width:900px){.nps-wrap{padding:0 22px}.nps-hero-grid{padding:104px 22px 64px}}
            @media(max-width:640px){.nps-wrap{padding:0 18px}.nps-hero-grid{padding:100px 18px 48px}.nps-page h1{font-size:clamp(42px,12vw,60px);margin:18px 0}.nps-lead{font-size:15px}.nps-section{padding:52px 0}.nps-plans{grid-template-columns:1fr}.nps-description{min-height:0}.nps-plan{padding:22px}}
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
              <button
                className="nps-btn nps-btn-outline"
                onClick={() => openSubmitModal('feed')}
                type="button"
              >
                Submit your news
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="nps-section" id="news">
        <div className="nps-wrap">
          <h2>Publish your news. Expand your visibility.</h2>
          <p className="nps-muted nps-subhead">
            Straightforward, one-time publishing options for corporate announcements, product
            launches and industry updates.
          </p>
          <div className="nps-plans">
            {plans.map(plan => (
              <div className="nps-plan-frame" key={plan.id}>
                {plan.featured && (
                  <>
                    <span className="nps-plan-corner nps-plan-corner-tl" aria-hidden="true" />
                    <span className="nps-plan-corner nps-plan-corner-tr" aria-hidden="true" />
                    <span className="nps-plan-corner nps-plan-corner-bl" aria-hidden="true" />
                    <span className="nps-plan-corner nps-plan-corner-br" aria-hidden="true" />
                  </>
                )}
                <article className={`nps-plan${plan.featured ? ' nps-plan-featured' : ''}`}>
                  <div className="nps-plan-tag">
                    {plan.number} / {plan.label}
                  </div>
                  <h3>
                    {plan.name}
                    {plan.featured && <span className="nps-plan-badge">Featured</span>}
                  </h3>
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
              </div>
            ))}
          </div>
        </div>
      </section>


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
