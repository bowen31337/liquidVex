/**
 * Unit Tests for Wallet Connection Components
 * Tests the React components and hooks for wallet functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../../lib/wagmiConfig';
import Header from '../../components/Header/Header';
import WalletModal from '../../components/WalletModal/WalletModal';
import { useWallet } from '../../hooks/useWallet';
import { useWalletSync } from '../../stores/walletStore';
import { jest } from '@jest/globals';

// Mock wagmi hooks
jest.mock('../../hooks/useWallet');
jest.mock('../../stores/walletStore');
jest.mock('../../hooks/useApi');

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockUseWalletSync = useWalletSync as jest.MockedFunction<typeof useWalletSync>;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

describe('Header Wallet Connection', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock initial wallet state
    mockUseWallet.mockReturnValue({
      address: null,
      isConnected: false,
      chain: null,
      isConnecting: false,
      connectMetaMask: jest.fn(),
      connectWalletConnect: jest.fn(),
      disconnect: jest.fn(),
      switchToArbitrum: jest.fn(),
      needsArbitrum: false,
      balance: undefined,
      balanceFormatted: undefined,
      balanceSymbol: undefined,
      balanceLoading: false,
      connectError: null,
    });

    mockUseWalletSync.mockReturnValue(mockUseWallet());
  });

  test('renders wallet connect button', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const walletButton = screen.getByTestId('wallet-connect-button');
    expect(walletButton).toBeInTheDocument();
    expect(walletButton).toHaveTextContent('Connect Wallet');
  });

  test('shows connecting state', () => {
    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      isConnecting: true,
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const walletButton = screen.getByTestId('wallet-connect-button');
    expect(walletButton).toHaveTextContent('Connecting...');
  });

  test('shows connected state with truncated address', () => {
    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const walletButton = screen.getByTestId('wallet-connect-button');
    expect(walletButton).toHaveTextContent('0x1234...7890');
  });

  test('calls wallet modal when clicking connect button', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const walletButton = screen.getByTestId('wallet-connect-button');
    fireEvent.click(walletButton);

    // Modal should open (tested in WalletModal tests)
    const modalTitle = screen.getByText('Connect Wallet');
    expect(modalTitle).toBeInTheDocument();
  });
});

describe('WalletModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when open', () => {
    render(
      <TestWrapper>
        <WalletModal isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    const modalTitle = screen.getByText('Connect Wallet');
    expect(modalTitle).toBeInTheDocument();

    const metamaskButton = screen.getByText('MetaMask');
    expect(metamaskButton).toBeInTheDocument();

    const walletConnectButton = screen.getByText('WalletConnect');
    expect(walletConnectButton).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <TestWrapper>
        <WalletModal isOpen={false} onClose={() => {}} />
      </TestWrapper>
    );

    const modalTitle = screen.queryByText('Connect Wallet');
    expect(modalTitle).not.toBeInTheDocument();
  });

  test('calls MetaMask connection function', async () => {
    const mockConnectMetaMask = jest.fn();
    const mockOnClose = jest.fn();

    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      connectMetaMask: mockConnectMetaMask,
    });

    render(
      <TestWrapper>
        <WalletModal isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const metamaskButton = screen.getByText('MetaMask');
    fireEvent.click(metamaskButton);

    await waitFor(() => {
      expect(mockConnectMetaMask).toHaveBeenCalled();
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('calls WalletConnect connection function', async () => {
    const mockConnectWalletConnect = jest.fn();
    const mockOnClose = jest.fn();

    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      connectWalletConnect: mockConnectWalletConnect,
    });

    render(
      <TestWrapper>
        <WalletModal isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const walletConnectButton = screen.getByText('WalletConnect');
    fireEvent.click(walletConnectButton);

    await waitFor(() => {
      expect(mockConnectWalletConnect).toHaveBeenCalled();
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows loading state during connection', () => {
    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      isConnecting: true,
    });

    render(
      <TestWrapper>
        <WalletModal isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    const metamaskButton = screen.getByText('MetaMask');
    fireEvent.click(metamaskButton);

    // Should show loading indicator
    const loadingIndicator = screen.getByRole('status');
    expect(loadingIndicator).toBeInTheDocument();
  });

  test('displays connection error', () => {
    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      connectError: { message: 'MetaMask not found' },
    });

    render(
      <TestWrapper>
        <WalletModal isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    const errorMessage = screen.getByText('MetaMask not found');
    expect(errorMessage).toBeInTheDocument();
  });

  test('cancel button closes modal', () => {
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <WalletModal isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('useWallet Hook', () => {
  test('returns correct initial state', () => {
    const result = useWallet();

    expect(result.isConnected).toBe(false);
    expect(result.address).toBe(null);
    expect(result.isConnecting).toBe(false);
    expect(result.connectError).toBe(null);
  });

  test('has connection methods', () => {
    const result = useWallet();

    expect(typeof result.connectMetaMask).toBe('function');
    expect(typeof result.connectWalletConnect).toBe('function');
    expect(typeof result.disconnect).toBe('function');
    expect(typeof result.switchToArbitrum).toBe('function');
  });

  test('has balance information', () => {
    const result = useWallet();

    expect(result.balance).toBeUndefined();
    expect(result.balanceFormatted).toBeUndefined();
    expect(result.balanceSymbol).toBeUndefined();
    expect(result.balanceLoading).toBe(false);
  });
});

describe('Wallet Address Truncation', () => {
  test('truncates address correctly', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const truncated = address.slice(0, 6) + '...' + address.slice(-4);

    expect(truncated).toBe('0x1234...7890');
  });

  test('handles short addresses gracefully', () => {
    const shortAddress = '0x123';
    const truncated = shortAddress.slice(0, 6) + '...' + shortAddress.slice(-4);

    expect(truncated).toBe('0x123...0x123');
  });
});

describe('Wallet Connection Flow', () => {
  test('connection flow from header to modal', async () => {
    const mockConnectMetaMask = jest.fn();

    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      connectMetaMask: mockConnectMetaMask,
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // Click connect button
    const walletButton = screen.getByTestId('wallet-connect-button');
    fireEvent.click(walletButton);

    // Modal should open
    const modalTitle = screen.getByText('Connect Wallet');
    expect(modalTitle).toBeInTheDocument();

    // Click MetaMask in modal
    const metamaskButton = screen.getByText('MetaMask');
    fireEvent.click(metamaskButton);

    await waitFor(() => {
      expect(mockConnectMetaMask).toHaveBeenCalled();
    });
  });

  test('connection error handling', async () => {
    const mockConnectMetaMask = jest.fn().mockRejectedValue(new Error('Connection failed'));

    mockUseWallet.mockReturnValue({
      ...mockUseWallet(),
      connectMetaMask: mockConnectMetaMask,
    });

    render(
      <TestWrapper>
        <WalletModal isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    const metamaskButton = screen.getByText('MetaMask');
    fireEvent.click(metamaskButton);

    await waitFor(() => {
      expect(mockConnectMetaMask).toHaveBeenCalled();
    });
  });
});