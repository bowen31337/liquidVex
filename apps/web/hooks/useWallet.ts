/**
 * Custom hook for wallet connection using wagmi/viem
 */

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { arbitrum } from 'viem/chains';
import { metaMask, walletConnect } from 'wagmi/connectors';

export function useWallet() {
  const account = useAccount();
  const { connect, connectors, error: connectError, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: account.address,
    chainId: arbitrum.id,
  });

  const connectMetaMask = async () => {
    const connector = metaMask();
    await connect({ connector });
  };

  const connectWalletConnect = async () => {
    const connector = walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default',
    });
    await connect({ connector });
  };

  const switchToArbitrum = async () => {
    if (account.chain?.id !== arbitrum.id) {
      await switchChain({ chainId: arbitrum.id });
    }
  };

  return {
    // Account state
    address: account.address,
    isConnected: account.isConnected,
    chain: account.chain,
    isConnecting,

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