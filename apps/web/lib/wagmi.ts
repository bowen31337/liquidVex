import { http, createConfig } from 'wagmi';
import { arbitrum } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID (replace with your actual project ID in production)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1234567890abcdef1234567890abcdef';

export const wagmiConfig = createConfig({
  chains: [arbitrum],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: false,
    }),
  ],
  transports: {
    [arbitrum.id]: http(),
  },
  ssr: true,
});
