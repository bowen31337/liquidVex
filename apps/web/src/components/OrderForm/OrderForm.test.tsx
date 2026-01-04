/**
 * Unit tests for OrderForm component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderForm } from '@/components/OrderForm/OrderForm';
import { MarketDataProvider } from '@/components/MarketDataProvider';
import { useMarketStore } from '@/stores/marketStore';

// Mock the market store
vi.mock('@/stores/marketStore');

const mockMarketStore = {
  selectedAsset: 'BTC',
  currentPrice: 95000,
  priceIncrement: 0.01,
  sizeIncrement: 0.001,
  markPrice: 95001,
  indexPrice: 95000,
  fundingRate: 0.0001,
  updateOrderBook: vi.fn(),
  updateTrades: vi.fn(),
  updateCandles: vi.fn(),
  updateSelectedAsset: vi.fn(),
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('OrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMarketStore as any).mockReturnValue(mockMarketStore);
  });

  it('should render order form with default values', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Order')).toBeInTheDocument();
    expect(screen.getByText('Limit')).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Sell')).toBeInTheDocument();
  });

  it('should update price when price input changes', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    const priceInput = screen.getByTestId('order-price-input');
    fireEvent.change(priceInput, { target: { value: '96000' } });

    await waitFor(() => {
      expect(priceInput).toHaveValue(96000);
    });
  });

  it('should update size when size input changes', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    const sizeInput = screen.getByTestId('order-size-input');
    fireEvent.change(sizeInput, { target: { value: '0.5' } });

    await waitFor(() => {
      expect(sizeInput).toHaveValue(0.5);
    });
  });

  it('should switch between buy and sell modes', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    const buyButton = screen.getByText('Buy');
    const sellButton = screen.getByText('Sell');

    expect(buyButton).toHaveClass('bg-green-600');
    expect(sellButton).not.toHaveClass('bg-red-600');

    fireEvent.click(sellButton);

    await waitFor(() => {
      expect(sellButton).toHaveClass('bg-red-600');
      expect(buyButton).not.toHaveClass('bg-green-600');
    });
  });

  it('should switch between order types', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    const limitButton = screen.getByText('Limit');
    const marketButton = screen.getByText('Market');

    expect(limitButton).toHaveClass('bg-surface-elevated');
    expect(marketButton).not.toHaveClass('bg-surface-elevated');

    fireEvent.click(marketButton);

    await waitFor(() => {
      expect(marketButton).toHaveClass('bg-surface-elevated');
      expect(limitButton).not.toHaveClass('bg-surface-elevated');
    });
  });

  it('should handle reduce-only checkbox', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    const reduceOnlyCheckbox = screen.getByTestId('reduce-only-checkbox');
    fireEvent.click(reduceOnlyCheckbox);

    await waitFor(() => {
      expect(reduceOnlyCheckbox).toBeChecked();
    });
  });

  it('should handle post-only checkbox', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    const postOnlyCheckbox = screen.getByTestId('post-only-checkbox');
    fireEvent.click(postOnlyCheckbox);

    await waitFor(() => {
      expect(postOnlyCheckbox).toBeChecked();
    });
  });

  it('should display current price correctly', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MarketDataProvider>
          <OrderForm />
        </MarketDataProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Current: 95,000.00')).toBeInTheDocument();
  });
});