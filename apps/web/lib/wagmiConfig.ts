/**
 * wagmi configuration and provider setup
 *
 * NOTE: This config is created in a Client Component to avoid
 * serialization issues in Next.js App Router.
 */

'use client';

import { createConfig, http } from 'wagmi';
import { arbitrum, arbitrumSepolia, mainnet } from 'wagmi/chains';
import { metaMask, walletConnect } from 'wagmi/connectors';

// Create wagmi config with wagmi v2 API
export const wagmiConfig = createConfig({
  chains: [arbitrum, arbitrumSepolia, mainnet],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
      metadata: {
        name: 'liquidVex',
        description: 'Hyperliquid DEX Trading Interface',
        url: 'https://liquidvex.vercel.app',
        icons: ['https://liquidvex.vercel.app/icon.png'],
      },
    }),
  ],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

// Export chains for use in components
export const chains = [arbitrum, arbitrumSepolia, mainnet];
