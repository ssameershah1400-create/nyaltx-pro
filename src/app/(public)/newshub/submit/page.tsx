import type { Metadata } from 'next';
import NewsPublishingPage from '@/page-components/Newshub/NewsPublishingPage';
import { isNewsSandboxTestEnabled } from '@/lib/paypalEnvironment';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nyaltx.pro'),
  title: 'Submit News | NYALTX',
  description:
    'Publish corporate announcements, product launches and industry updates across NYALTX.',
  alternates: {
    canonical: 'https://www.nyaltx.pro/newshub/submit',
  },
  openGraph: {
    title: 'Submit News | NYALTX',
    description:
      'Publish corporate announcements, product launches and industry updates across NYALTX.',
    type: 'website',
    url: 'https://www.nyaltx.pro/newshub/submit',
    siteName: 'NYALTX',
  },
};

interface NewsPublishingRouteProps {
  searchParams: Promise<{ modal?: string; plan?: string }>;
}

export default async function NewsPublishingRoute({ searchParams }: NewsPublishingRouteProps) {
  const { modal, plan } = await searchParams;
  const testPlanEnabled = isNewsSandboxTestEnabled();
  const initialPlan =
    plan === 'slider' ? 'slider' : plan === 'test' && testPlanEnabled ? 'test' : 'feed';

  return (
    <NewsPublishingPage
      openModalOnLoad={modal === 'open'}
      initialPlan={initialPlan}
      enableTestPlan={testPlanEnabled}
    />
  );
}
