import { http, createConfig } from 'wagmi';
import { arbitrum } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID (replace with your actual project ID in production)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1234567890abcdef1234567890abcdef';

// Create config with connectors that are safe for SSR
// The walletConnect connector needs browser APIs, so we conditionally include it
const connectors = [injected()];

// Only add walletConnect if we're in a browser environment
if (typeof window !== 'undefined') {
  connectors.push(
    walletConnect({
      projectId,
      showQrModal: true,
    }) as any // Type assertion to bypass wagmi version compatibility issues
  );
}

export const wagmiConfig = createConfig({
  chains: [arbitrum],
  connectors,
  transports: {
    [arbitrum.id]: http(),
  },
  ssr: true,
});
