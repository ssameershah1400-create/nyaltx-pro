import { NextRequest, NextResponse } from 'next/server';
import {
  getNewshubArticles,
  getNewshubBanners,
  getNewshubCategories,
  NEWSHUB_CATEGORIES,
} from '@/lib/newshubInitialData';
import { getNews } from '@/lib/rss';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const [banners, feed, categories] = await Promise.all([
      getNewshubBanners(),
      getNewshubArticles(category || 'All', page, limit),
      getNewshubCategories(),
    ]);

    return NextResponse.json({
      success: true,
      banners,
      ...feed,
      categories,
    });
  } catch (error: any) {
    console.error('Error fetching newshub data:', error);
    const category = new URL(request.url).searchParams.get('category');
    const limit = Math.min(
      Math.max(parseInt(new URL(request.url).searchParams.get('limit') || '12', 10) || 12, 1),
      100
    );
    const page = Math.max(
      parseInt(new URL(request.url).searchParams.get('page') || '1', 10) || 1,
      1
    );
    const rssItems = await getNews();
    const syndicatedArticles =
      !category || category === 'All' || category === 'DeFi'
        ? rssItems.map(item => ({
            _id: `rss-${item.id}`,
            title: item.title,
            excerpt: item.description
              ?.replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
            featuredImage: item.image,
            publishedAt: item.pubDate?.toISOString(),
            createdAt: item.pubDate?.toISOString(),
            author: item.source,
            category: 'DeFi',
            sourceUrl: item.link,
            featuredInBanner: false,
            isSyndicated: true,
            views: 0,
          }))
        : [];
    const offset = (page - 1) * limit;
    const articles = syndicatedArticles.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      degraded: true,
      banners: [],
      articles,
      trendingArticles: syndicatedArticles.slice(0, 4),
      pagination: {
        total: syndicatedArticles.length,
        page,
        limit,
        pages: Math.ceil(syndicatedArticles.length / limit) || 1,
      },
      categories: NEWSHUB_CATEGORIES,
    });
  }
}
