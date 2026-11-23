import { NextRequest, NextResponse } from 'next/server';
import { fetchNyaxMarketData } from '@/lib/nyaxMarketData';
import { DEFAULT_NEWS_NYAX_TOKEN_ADDRESS } from '@/lib/paymentAddresses';

// NYAX token configuration
import { NYAX_POOL_ADDRESS } from '@/lib/nyaxMarketData';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching NYAX price from GeckoTerminal...');
    
    const { attributes, priceUsd } = await fetchNyaxMarketData();

    // Extract price data
    const priceChange24h = Number(attributes.price_change_percentage?.h24);
    const volume24h = Number(attributes.volume_usd?.h24);
    const marketCap = attributes.market_cap_usd ? parseFloat(attributes.market_cap_usd) : null;
    const fdv = Number(attributes.fdv_usd);

    console.log('✅ NYAX price fetched successfully:', {
      price: priceUsd,
      change24h: priceChange24h,
      volume24h: volume24h
    });

    // Return formatted response
    return NextResponse.json({
      success: true,
      data: {
        symbol: 'NYAX',
        contract_address: DEFAULT_NEWS_NYAX_TOKEN_ADDRESS,
        pool_address: NYAX_POOL_ADDRESS,
        price_usd: priceUsd.toString(),
        price_change_24h: priceChange24h.toString(),
        volume_24h_usd: volume24h.toString(),
        market_cap_usd: marketCap?.toString() || null,
        fdv_usd: fdv.toString(),
        last_updated: new Date().toISOString(),
        source: 'geckoterminal'
      }
    });

  } catch (error) {
    console.error('💥 Error fetching NYAX price:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch NYAX price',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
