export const NYAX_POOL_ADDRESS = '0x9861039bF9b66b3b30d59da1e7d4034fd08b8b3f';
const GECKOTERMINAL_API_URL = `https://api.geckoterminal.com/api/v2/networks/eth/pools/${NYAX_POOL_ADDRESS}`;

interface GeckoTerminalPoolResponse {
  data?: {
    attributes?: {
      base_token_price_usd?: string;
      price_change_percentage?: { h24?: string };
      volume_usd?: { h24?: string };
      market_cap_usd?: string | null;
      fdv_usd?: string;
    };
  };
}

export async function fetchNyaxMarketData() {
  const response = await fetch(GECKOTERMINAL_API_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'NYALTX-Price/1.0',
    },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`NYAX price provider returned HTTP ${response.status}.`);
  }

  const data: GeckoTerminalPoolResponse = await response.json();
  const attributes = data.data?.attributes;
  const priceUsd = Number(attributes?.base_token_price_usd);

  if (!attributes || !Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error('NYAX price provider returned an invalid token price.');
  }

  return { attributes, priceUsd };
}
