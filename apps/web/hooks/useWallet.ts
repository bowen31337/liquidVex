/**
 * Custom hook for wallet connection using wagmi/viem
 */

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { arbitrum } from 'viem/chains';
import { metaMask, walletConnect } from 'wagmi/connectors';
import { useState, useEffect } from 'react';

export function useWallet() {
  const account = useAccount();
  const { connect, error: connectError, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: account.address,
    chainId: arbitrum.id,
  });

  // State for MetaMask availability
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  // Check MetaMask availability on mount
  useEffect(() => {
    const checkMetaMask = () => {
      const hasMetaMask = typeof window !== 'undefined' &&
        (window as any).ethereum !== undefined &&
        (window as any).ethereum.isMetaMask === true;
      setIsMetaMaskAvailable(hasMetaMask);
    };

    checkMetaMask();

    // Listen for MetaMask availability changes
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', checkMetaMask);
      return () => {
        window.removeEventListener('ethereum#initialized', checkMetaMask);
      };
    }
    return undefined;
  }, []);

  const connectMetaMask = async () => {
    if (!isMetaMaskAvailable) {
      throw new Error('MetaMask extension not detected. Please install MetaMask to connect.');
    }

    try {
      const connector = metaMask();
      await connect({ connector });
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw error;
    }
  };

  const connectWalletConnect = async () => {
    try {
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default';

      if (projectId === 'default' || !projectId) {
        throw new Error('WalletConnect project ID not configured. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable.');
      }

      const connector = walletConnect({
        projectId,
        metadata: {
          name: 'liquidVex',
          description: 'Hyperliquid DEX Trading Interface',
          url: 'https://liquidvex.example.com',
          icons: ['https://liquidvex.example.com/icon.png']
        }
      });
      await connect({ connector });
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw error;
    }
  };

  const switchToArbitrum = async () => {
    if (account.chain?.id !== arbitrum.id) {
      try {
        await switchChain({ chainId: arbitrum.id });
      } catch (error) {
        console.error('Failed to switch to Arbitrum:', error);
        throw error;
      }
    }
  };

  return {
    // Account state
    address: account.address,
    isConnected: account.isConnected,
    chain: account.chain,
    isConnecting,
    isMetaMaskAvailable,

    // Connection methods
    connectMetaMask,
    connectWalletConnect,
    disconnect,

    // Chain management
    switchToArbitrum,
    needsArbitrum: account.chain?.id !== arbitrum.id,

    // Balance
    balance: balance?.value,
    balanceFormatted: balance?.formatted,
    balanceSymbol: balance?.symbol,
    balanceLoading,

    // Errors
    connectError,
  };
}