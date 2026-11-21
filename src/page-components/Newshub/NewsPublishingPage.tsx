'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { NEWS_PAYPAL_CRYPTO_DRAFT_KEY } from '@/lib/newsCryptoDraft';
import { useEffect, useState, type FormEvent } from 'react';

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
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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

  const openInquiryModal = (subject: string) => {
    setInquirySubject(subject);
    setInquiryStatus('idle');
    setInquiryOpen(true);
  };

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setInquiryStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          subject: inquirySubject,
          message: form.get('message'),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send inquiry');
      setInquiryStatus('sent');
    } catch (error) {
      console.error('Could not send media inquiry:', error);
      setInquiryStatus('error');
    }
  };

  return (
    <main className="nps-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .nps-page{--ink:#eaf2ff;--muted:#91a3bd;--line:rgba(148,174,211,.16);--cyan:#67d8ff;min-height:100vh;background:#070b12;color:var(--ink);font:16px/1.6 Arial,sans-serif}
            .nps-page *{box-sizing:border-box}
            .nps-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
            .nps-hero{position:relative;isolation:isolate;overflow:hidden;width:min(1440px,calc(100% - 40px));margin:20px auto 0;border:1px solid rgba(132,177,235,.2);border-radius:28px;background:radial-gradient(ellipse at 70% 88%,rgba(38,113,224,.25),transparent 42%),radial-gradient(ellipse at 88% 12%,rgba(30,119,190,.15),transparent 35%),linear-gradient(145deg,#07152f 0%,#040c22 52%,#080f24 100%);box-shadow:0 28px 90px rgba(0,0,0,.3)}
            .nps-hero:before{position:absolute;z-index:0;inset:0;pointer-events:none;content:'';opacity:.34;background-image:radial-gradient(circle,rgba(118,176,255,.72) 1px,transparent 1.4px);background-size:22px 22px;mask-image:radial-gradient(ellipse at 68% 48%,#000 0%,transparent 72%)}
            .nps-hero:after{position:absolute;z-index:0;right:-12%;bottom:4%;width:65%;height:45%;pointer-events:none;content:'';background:radial-gradient(ellipse,rgba(65,151,255,.2),transparent 70%);filter:blur(18px)}
            .nps-hero>*{position:relative;z-index:1}
            .nps-nav{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;padding:22px 0;border-bottom:1px solid rgba(164,194,236,.14)}
            .nps-brand{color:#f5f8ff;font-size:23px;font-weight:750;letter-spacing:-1px;text-decoration:none}
            .nps-brand span{color:#7ac8ff}
            .nps-brand small{display:block;color:#8599b8;font-size:9px;letter-spacing:2px}
            .nps-links{display:flex;align-items:center;gap:22px;flex-wrap:wrap;font-size:13px;font-weight:600}
            .nps-links a{color:#afc2df;text-decoration:none;transition:color .2s ease}
            .nps-links a:hover{color:#fff}
            .nps-btn{position:relative;display:inline-flex;justify-content:center;align-items:center;min-height:44px;border:1px solid transparent;border-radius:999px;background:linear-gradient(180deg,#fff,#dceaff);color:#071326!important;cursor:pointer;font:inherit;font-size:14px;font-weight:700;padding:11px 21px;text-align:center;text-decoration:none;box-shadow:inset 0 1px 0 #fff,0 8px 24px rgba(99,166,255,.15);transition:transform .2s ease,filter .2s ease,box-shadow .2s ease}
            .nps-btn:hover{filter:brightness(1.04);transform:translateY(-2px);box-shadow:inset 0 1px 0 #fff,0 12px 28px rgba(99,166,255,.23)}
            .nps-btn:focus-visible,.nps-links a:focus-visible,.nps-inquiry-close:focus-visible{outline:2px solid #7cc4ff;outline-offset:3px}
            .nps-btn:disabled{cursor:wait;opacity:.65}
            .nps-btn-outline{background:rgba(7,18,40,.55);border-color:rgba(171,201,241,.28);color:#eaf2ff!important;box-shadow:none}
            .nps-btn-outline:hover{background:rgba(23,43,76,.8);box-shadow:0 8px 24px rgba(0,0,0,.15)}
            .nps-btn-small{min-height:38px;font-size:13px;padding:8px 16px}
            .nps-hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.78fr);gap:clamp(36px,6vw,84px);align-items:center;padding:clamp(54px,8vw,96px) 32px clamp(42px,6vw,68px)}
            .nps-eyebrow{display:flex;align-items:center;gap:10px;color:#8bdcff;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase}
            .nps-live-dot{width:7px;height:7px;flex:none;border-radius:50%;background:#79e0ff;box-shadow:0 0 14px rgba(93,201,255,.9)}
            .nps-page h1,.nps-page h2,.nps-page h3,.nps-page p{margin:0}
            .nps-page h1{max-width:780px;color:#f4f8ff;font-size:clamp(44px,6.6vw,82px);font-weight:500;letter-spacing:-.065em;line-height:.98;margin:21px 0 22px}
            .nps-page h1 em{color:#9bcaff;font-family:Georgia,Cambria,"Times New Roman",serif;font-size:1.02em;font-weight:400;font-style:italic;letter-spacing:-.055em}
            .nps-page h2{color:#f4f8ff;font-size:clamp(28px,3vw,36px);font-weight:550;letter-spacing:-1.2px;line-height:1.15;margin:7px 0 12px}
            .nps-page h3{color:#edf4ff;font-size:21px;font-weight:600;letter-spacing:-.35px;line-height:1.2}
            .nps-lead{max-width:650px;color:#aebfd9;font-size:17px;line-height:1.75}
            .nps-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
            .nps-hero-card{position:relative;overflow:hidden;border:1px solid rgba(126,176,238,.25);border-radius:20px;background:linear-gradient(145deg,rgba(11,28,58,.84),rgba(5,14,34,.76));box-shadow:0 24px 65px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.05);padding:23px 25px;backdrop-filter:blur(16px)}
            .nps-hero-card:before{position:absolute;top:0;left:24px;width:86px;height:1px;content:'';background:linear-gradient(90deg,transparent,#80caff,transparent)}
            .nps-hero-card-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}
            .nps-card-kicker{margin-top:5px;color:#768dab;font:10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1.4px}
            .nps-live{flex:none;border:1px solid rgba(97,216,255,.22);border-radius:999px;background:rgba(33,147,196,.1);color:#91e4ff;font-size:9px;font-weight:700;letter-spacing:1px;padding:6px 9px}
            .nps-hero-card p{display:flex;align-items:center;gap:13px;border-top:1px solid rgba(156,187,230,.12);padding:15px 0}
            .nps-check{display:grid;width:30px;height:30px;flex:none;place-items:center;border:1px solid rgba(105,193,255,.28);border-radius:50%;background:rgba(39,118,201,.12);color:#8edbff;font:11px ui-monospace,SFMono-Regular,Menlo,monospace}
            .nps-flow-copy{display:grid;gap:3px}
            .nps-flow-copy strong{color:#e7f1ff;font-size:13px;font-weight:600}
            .nps-flow-copy small{color:#8297b6;font-size:11px;line-height:1.4}
            .nps-hero-shelf{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch;max-width:none;padding:0 32px;background:linear-gradient(180deg,#edf5ff,#dceaff);color:#0a1830}
            .nps-shelf-item{display:flex;align-items:center;gap:14px;min-width:0;padding:19px 24px;border-right:1px solid rgba(20,54,99,.13)}
            .nps-shelf-item:last-child{border-right:0}
            .nps-shelf-index{color:#4d83bb;font:11px ui-monospace,SFMono-Regular,Menlo,monospace}
            .nps-shelf-item>span:nth-child(2){display:grid;gap:2px;min-width:0}
            .nps-shelf-item strong{font-size:13px;font-weight:700}
            .nps-shelf-item small{color:#536984;font-size:11px}
            .nps-shelf-item b{margin-left:auto;color:#10294d;font-size:22px;font-weight:600;letter-spacing:-1px}
            .nps-shelf-note strong{color:#123760}
            .nps-section{padding:76px 0}
            .nps-section:nth-of-type(even){background:linear-gradient(180deg,rgba(9,15,27,.56),rgba(7,11,18,0))}
            .nps-muted{color:var(--muted)}
            .nps-subhead{max-width:750px;color:#9aabc3}
            .nps-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:28px}
            .nps-cards-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:28px}
            .nps-cards-wide{grid-template-columns:1fr}
            .nps-card{display:flex;flex-direction:column;border:1px solid rgba(139,168,209,.16);border-radius:20px;background:linear-gradient(145deg,rgba(15,25,43,.96),rgba(9,16,30,.96));padding:25px;box-shadow:inset 0 1px 0 rgba(255,255,255,.025);transition:transform .2s ease,border-color .2s ease}
            .nps-card:hover{transform:translateY(-3px);border-color:rgba(109,186,255,.35)}
            .nps-card-featured{border-color:rgba(95,197,255,.65);box-shadow:0 12px 40px rgba(28,117,211,.1),inset 0 1px 0 rgba(255,255,255,.04)}
            .nps-card-tag{color:#82d8ff;font-size:10px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;text-transform:uppercase}
            .nps-card p{color:#9eafc7;font-size:14px;margin:12px 0 18px}
            .nps-card-price{color:#f1f6ff;font-size:26px;font-weight:700;letter-spacing:-.5px;margin-top:14px}
            .nps-card-price small{color:var(--muted);font-size:13px;font-weight:400}
            .nps-card ul{flex:1;list-style:none;margin:10px 0 20px;padding:0}
            .nps-card li{position:relative;border-top:1px solid rgba(139,168,209,.12);font-size:13px;padding:9px 0 9px 22px}
            .nps-card li:before{position:absolute;left:0;color:#7ad9ff;content:'✓';font-weight:700}
            .nps-card-actions{margin-top:auto}
            .nps-card-with-visual{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.75fr);align-items:stretch;gap:22px}
            .nps-card-copy{display:flex;flex-direction:column}
            .nps-card-visual{align-self:stretch;margin:0;overflow:hidden;border:1px solid rgba(139,168,209,.16);border-radius:14px;background:#050914}
            .nps-card-visual img{display:block;width:100%;height:100%;object-fit:cover}
            .nps-card-grid .nps-card-tag{margin-bottom:10px}
            .nps-card-grid h3{min-height:56px}
            .nps-card-grid p{min-height:63px}
            .nps-notice{color:#74869f;font-size:12px;margin-top:22px}
            .nps-campaign{border:1px solid rgba(139,168,209,.18);border-radius:20px;background:radial-gradient(ellipse at 90% 50%,rgba(31,108,193,.16),transparent 48%),linear-gradient(145deg,#0e1b31,#09111f);margin-top:28px;padding:28px}
            .nps-campaign h2{margin-bottom:10px}
            .nps-campaign p{color:#a5b7d1;max-width:820px}
            .nps-media-visual{margin-top:28px;overflow:hidden;border:1px solid rgba(139,168,209,.16);border-radius:18px;background:#050914}
            .nps-media-visual img{display:block;width:100%;height:auto}
            .nps-band{background:linear-gradient(120deg,rgba(15,22,35,.9),rgba(9,15,26,.94));border-block:1px solid rgba(148,174,211,.16)}
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
            .nps-campaign-band{display:flex;align-items:center;justify-content:space-between;gap:28px;margin:62px 0 24px;padding:32px}
            .nps-campaign-band p{color:#a5b7d1;max-width:760px;margin-top:8px}
            .nps-campaign-band .nps-actions{margin:0;flex-shrink:0}
            .nps-inquiry-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(2,6,23,.82);backdrop-filter:blur(8px);padding:20px}
            .nps-inquiry-modal{width:min(560px,100%);border:1px solid rgba(139,168,209,.22);border-radius:20px;background:#0d1728;box-shadow:0 24px 80px rgba(0,0,0,.55);padding:28px}
            .nps-inquiry-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}
            .nps-inquiry-head h2{font-size:26px;margin:0}
            .nps-inquiry-close{border:0;background:transparent;color:#94a3b8;font-size:24px;cursor:pointer;line-height:1}
            .nps-inquiry-fields{display:grid;gap:14px}
            .nps-inquiry-fields label{display:grid;gap:7px;color:#cbd5e1;font-size:13px;font-weight:700}
            .nps-inquiry-fields input,.nps-inquiry-fields textarea{width:100%;border:1px solid #334155;border-radius:10px;background:#070b12;color:#f8fafc;font:inherit;padding:11px 12px}
            .nps-inquiry-fields input:focus,.nps-inquiry-fields textarea:focus{border-color:#69caff;outline:2px solid rgba(105,202,255,.18)}
            .nps-inquiry-fields textarea{min-height:120px;resize:vertical}
            .nps-inquiry-status{font-size:14px;margin:14px 0 0}
            .nps-inquiry-status.sent{color:#8ee4ff}.nps-inquiry-status.error{color:#fda4af}
            @media(max-width:900px){.nps-wrap{padding:0 22px}.nps-hero{width:calc(100% - 28px)}.nps-hero-grid{grid-template-columns:minmax(0,1fr) minmax(260px,.82fr);gap:28px;padding:56px 22px 42px}.nps-links{gap:13px}.nps-links .nps-btn{padding-inline:16px}.nps-cards-three{grid-template-columns:repeat(2,minmax(0,1fr))}.nps-card-with-visual{grid-template-columns:1fr}.nps-campaign-band{margin-top:48px}}
            @media(max-width:640px){.nps-wrap{padding:0 18px}.nps-hero{width:calc(100% - 20px);margin-top:10px;border-radius:20px}.nps-nav{align-items:flex-start;padding:18px 0}.nps-links{display:grid;width:100%;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 14px}.nps-links a{padding:7px 0}.nps-links .nps-btn{grid-column:1/-1;width:100%}.nps-hero-grid{grid-template-columns:1fr;gap:30px;padding:46px 18px 34px}.nps-page h1{font-size:clamp(42px,12vw,60px);margin:18px 0}.nps-lead{font-size:15px}.nps-hero-card{padding:20px}.nps-hero-shelf{grid-template-columns:1fr;padding:4px 18px}.nps-shelf-item{padding:15px 2px;border-right:0;border-bottom:1px solid rgba(20,54,99,.13)}.nps-shelf-item:last-child{border-bottom:0}.nps-section{padding:52px 0}.nps-plans,.nps-cards,.nps-cards-three{grid-template-columns:1fr}.nps-description,.nps-card-grid h3,.nps-card-grid p{min-height:0}.nps-plan,.nps-card{padding:22px}.nps-campaign-band{display:block;margin-top:40px;padding:22px}.nps-campaign-band .nps-actions{margin-top:18px}.nps-inquiry-modal{padding:22px}}
            @media(prefers-reduced-motion:reduce){.nps-page *{scroll-behavior:auto!important;transition-duration:.01ms!important}}
          `,
        }}
      />

      <section className="nps-hero">
        <header className="nps-wrap">
          <nav className="nps-nav" aria-label="Publishing navigation">
            <Link className="nps-brand" href="/newshub">
              NYALTX <span>News Hub</span>
              <small>NEW YORK ALT EXCHANGE</small>
            </Link>
            <div className="nps-links">
              <a href="#news">News</a>
              <a href="#projects">Projects</a>
              <a href="#media">Media</a>
              <a href="#roadshows">Roadshows</a>
              <button className="nps-btn" onClick={() => openSubmitModal('feed')} type="button">
                Submit your news
              </button>
            </div>
          </nav>
        </header>

        <div className="nps-wrap nps-hero-grid">
          <div>
            <div className="nps-eyebrow">
              <span aria-hidden="true" className="nps-live-dot" />
              Corporate Visibility &amp; Media Solutions
            </div>
            <h1>
              Your story deserves
              <br />
              <em>more than a headline.</em>
            </h1>
            <p className="nps-lead">
              Reach fintech, digital asset and capital markets audiences through news publishing,
              project discovery, executive interviews, advertising and investor events.
            </p>
            <div className="nps-actions">
              <a className="nps-btn" href="#news">
                Explore packages
              </a>
              <a className="nps-btn nps-btn-outline" href="#media">
                Media services
              </a>
            </div>
          </div>
          <aside className="nps-hero-card">
            <div className="nps-hero-card-head">
              <div>
                <div className="nps-eyebrow">Publishing flow</div>
                <div className="nps-card-kicker">NYALTX / NEWS DESK</div>
              </div>
              <span className="nps-live">READY TO SUBMIT</span>
            </div>
            <p>
              <span className="nps-check">01</span>
              <span className="nps-flow-copy">
                <strong>Write your release</strong>
                <small>Prepare your announcement and media</small>
              </span>
            </p>
            <p>
              <span className="nps-check">02</span>
              <span className="nps-flow-copy">
                <strong>Choose a package</strong>
                <small>Standard publishing or featured distribution</small>
              </span>
            </p>
            <p>
              <span className="nps-check">03</span>
              <span className="nps-flow-copy">
                <strong>Submit and check out</strong>
                <small>Complete your release submission online</small>
              </span>
            </p>
          </aside>
        </div>

        <div className="nps-wrap nps-hero-shelf" aria-label="News publishing highlights">
          <div className="nps-shelf-item">
            <span className="nps-shelf-index">01</span>
            <span><strong>News release</strong><small>One-time publishing</small></span>
            <b>$99</b>
          </div>
          <div className="nps-shelf-item">
            <span className="nps-shelf-index">02</span>
            <span><strong>Featured release</strong><small>Seven-day placement</small></span>
            <b>$199</b>
          </div>
          <div className="nps-shelf-item nps-shelf-note">
            <span className="nps-shelf-index">03</span>
            <span><strong>No membership</strong><small>Required for news publishing</small></span>
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

      <section className="nps-section" id="projects">
        <div className="nps-wrap">
          <div className="nps-eyebrow">02 / Project Discovery</div>
          <h2>Build a stronger NYALTX presence.</h2>
          <p className="nps-muted nps-subhead">
            Project profiles and optional Race to Liberty promotional placements. News and media
            purchases do not require membership.
          </p>
          <div className="nps-cards-three">
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">Project Profile</div>
              <h3>NYALTX Pro</h3>
              <div className="nps-card-price">
                $199 <small>/ year</small>
              </div>
              <p>Establish a dedicated project presence with profile details, links and video.</p>
              <div className="nps-card-actions">
                <a className="nps-btn" href="/pricing">
                  Explore membership
                </a>
              </div>
            </article>
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">Race to Liberty</div>
              <h3>Speed Boat</h3>
              <div className="nps-card-price">$199</div>
              <p>Entry-level project visibility with a defined promotional placement period.</p>
              <div className="nps-card-actions">
                <a className="nps-btn" href="/pricing/race-to-liberty/speedboat">
                  Explore placement
                </a>
              </div>
            </article>
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">Race to Liberty</div>
              <h3>Helicopter / Submarine</h3>
              <div className="nps-card-price">$349–$599</div>
              <p>Extended project promotion and premium visibility options.</p>
              <div className="nps-card-actions">
                <a className="nps-btn" href="/pricing/race-to-liberty/helicopter">
                  Compare options
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="nps-section" id="media">
        <div className="nps-wrap">
          <div className="nps-eyebrow">03 / Fintech Media &amp; Advertising</div>
          <h2>Take your story beyond the news feed.</h2>
          <p className="nps-muted nps-subhead">
            Professional media services powered by Corporate Roadshow. Packages are customized to
            your company&apos;s objectives and distribution needs.
          </p>
          <div className="nps-cards-three">
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">Advertising</div>
              <h3>Dashboard Banner</h3>
              <div className="nps-card-price">
                $750 <small>/ month</small>
              </div>
              <p>Prominent branded advertising on the NYALTX dashboard, subject to availability.</p>
              <div className="nps-card-actions">
                <button
                  className="nps-btn"
                  onClick={() => openInquiryModal('NYALTX Banner Inquiry')}
                  type="button"
                >
                  Request details
                </button>
              </div>
            </article>
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">Podcast Feature</div>
              <h3>Executive Podcast Interview</h3>
              <div className="nps-card-price">$3,500</div>
              <p>
                A high-impact interview on Off Road with Frank Ferraro and Andrea Cataneo for
                investor-focused business visibility.
              </p>
              <ul>
                <li>Audio podcast appearance</li>
                <li>Corporate message positioning</li>
                <li>Shareable episode and custom graphics</li>
                <li>Major podcast distribution and social promotion</li>
              </ul>
              <div className="nps-card-actions">
                <button
                  className="nps-btn"
                  onClick={() => openInquiryModal('Podcast Feature Inquiry')}
                  type="button"
                >
                  Request details
                </button>
              </div>
            </article>
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">Full Media Package</div>
              <h3>Podcast, Video &amp; Commercial</h3>
              <div className="nps-card-price">$8,500</div>
              <p>
                A complete media package with polished video assets for investor relations,
                social media and future advertising.
              </p>
              <ul>
                <li>Two full video edits</li>
                <li>Two short-form video clips</li>
                <li>Custom graphics and podcast/audio feature</li>
                <li>15-30 second commercial and Corporate Roadshow profile</li>
              </ul>
              <div className="nps-card-actions">
                <button
                  className="nps-btn"
                  onClick={() => openInquiryModal('Full Media Package Inquiry')}
                  type="button"
                >
                  Request details
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="nps-section" id="roadshows">
        <div className="nps-wrap">
          <div className="nps-eyebrow">04 / Corporate Roadshow</div>
          <h2>Investor events &amp; premium media campaigns.</h2>
          <p className="nps-muted nps-subhead">
            Customized programs for companies seeking deeper storytelling, investor-facing events
            or large-scale media exposure.
          </p>
          <div className="nps-cards-three">
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">Events</div>
              <h3>Live Roadshows</h3>
              <div className="nps-card-price">
                From <small>$20,000</small>
              </div>
              <p>
                Curated, in-person investor experiences with executive networking, presentations,
                private meetings and on-site media coverage.
              </p>
              <div className="nps-card-actions">
                <button
                  className="nps-btn"
                  onClick={() => openInquiryModal('Live Roadshow Inquiry')}
                  type="button"
                >
                  Request proposal
                </button>
              </div>
            </article>
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">American Roadshow</div>
              <h3>Featured Company Package</h3>
              <div className="nps-card-price">$25,000</div>
              <p>
                Featured participation in a professionally produced TV series with executive
                interviews and investor-facing documentary-style storytelling.
              </p>
              <div className="nps-card-actions">
                <button
                  className="nps-btn"
                  onClick={() => openInquiryModal('American Roadshow Inquiry')}
                  type="button"
                >
                  Request proposal
                </button>
              </div>
            </article>
            <article className="nps-card nps-card-grid">
              <div className="nps-card-tag">National TV Campaign</div>
              <h3>Commercial Placement</h3>
              <div className="nps-card-price">$80,000-$150,000+</div>
              <p>
                Large-scale commercial campaign options across major business and news networks,
                with 50-100 commercial spots.
              </p>
              <div className="nps-card-actions">
                <button
                  className="nps-btn"
                  onClick={() => openInquiryModal('National TV Campaign Inquiry')}
                  type="button"
                >
                  Request proposal
                </button>
              </div>
            </article>
          </div>

          <div className="nps-campaign nps-campaign-band">
            <div>
              <div className="nps-eyebrow">Custom Media Campaigns</div>
              <h2>One company story. Multiple channels.</h2>
              <p>
                Combine a news release, executive interview, branded video and dashboard advertising
                into a coordinated visibility campaign.
              </p>
            </div>
            <div className="nps-actions">
              <button
                className="nps-btn"
                onClick={() => openInquiryModal('Custom Media Campaign')}
                type="button"
              >
                Discuss a campaign
              </button>
            </div>
          </div>

          <p className="nps-notice">
            Concept preview only. Prices and package details are subject to confirmation.
            Distribution is limited to the channels specified for each service; third-party
            newswire pickup, readership, investment outcomes and search ranking are not guaranteed.
          </p>
        </div>
      </section>

      <footer className="nps-footer">
        <div className="nps-wrap">
          NYALTX · New York Alt Exchange &nbsp; | &nbsp; Media services powered by Corporate
          Roadshow
        </div>
      </footer>

      {inquiryOpen && (
        <div
          className="nps-inquiry-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setInquiryOpen(false);
          }}
        >
          <div
            className="nps-inquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nps-inquiry-title"
          >
            <div className="nps-inquiry-head">
              <div>
                <div className="nps-eyebrow">Corporate Roadshow Inquiry</div>
                <h2 id="nps-inquiry-title">{inquirySubject}</h2>
              </div>
              <button
                className="nps-inquiry-close"
                type="button"
                aria-label="Close inquiry"
                onClick={() => setInquiryOpen(false)}
              >
                ×
              </button>
            </div>
            {inquiryStatus === 'sent' ? (
              <div>
                <p className="nps-inquiry-status sent">
                  Your inquiry was sent successfully. Corporate Roadshow will follow up by email.
                </p>
                <div className="nps-actions">
                  <button
                    className="nps-btn"
                    type="button"
                    onClick={() => setInquiryOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitInquiry}>
                <div className="nps-inquiry-fields">
                  <label>
                    Name
                    <input name="name" type="text" required autoComplete="name" />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" required autoComplete="email" />
                  </label>
                  <label>
                    Message
                    <textarea
                      name="message"
                      required
                      defaultValue={`I am interested in ${inquirySubject}.`}
                    />
                  </label>
                </div>
                {inquiryStatus === 'error' && (
                  <p className="nps-inquiry-status error">
                    The inquiry could not be sent. Please try again.
                  </p>
                )}
                <div className="nps-actions">
                  <button
                    className="nps-btn"
                    type="submit"
                    disabled={inquiryStatus === 'sending'}
                  >
                    {inquiryStatus === 'sending' ? 'Sending...' : 'Send inquiry'}
                  </button>
                  <button
                    className="nps-btn nps-btn-outline"
                    type="button"
                    onClick={() => setInquiryOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
