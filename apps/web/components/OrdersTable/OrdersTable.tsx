/**
 * Open Orders Table component
 */

'use client';

import { useEffect, useState } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast/Toast';
import { Order } from '../../types';
import { OrderModifyModal } from '../Modal/OrderModifyModal';
import { Modal } from '../Modal/Modal';

export function OrdersTable() {
  const { openOrders, setOpenOrders, removeOpenOrder, updateOpenOrder, addOrderHistory } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getOpenOrders, modifyOrder, cancelOrder, cancelAllOrders } = useApi();
  const { success, error } = useToast();
  const [cancelling, setCancelling] = useState<Set<number>>(new Set());
  const [cancellingAll, setCancellingAll] = useState(false);
  const [showCancelAllModal, setShowCancelAllModal] = useState(false);

  // Check for test mode
  const isTestMode = (() => {
    if (typeof process !== 'undefined' &&
        (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || process.env.NODE_ENV === 'test')) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('testMode') === 'true' || urlParams.has('testMode');
    }
    return false;
  })();

  // Modal state
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmittingModify, setIsSubmittingModify] = useState(false);

  // Load orders when wallet connects
  useEffect(() => {
    // In test mode, don't load from API (orders are added directly to store)
    if (isTestMode) {
      return;
    }

    if (isConnected && address) {
      const loadOrders = async () => {
        try {
          const data = await getOpenOrders(address);
          setOpenOrders(data);
        } catch (err) {
          console.error('Failed to load orders:', err);
        }
      };
      loadOrders();

      // Refresh every 5 seconds
      const interval = setInterval(loadOrders, 5000);
      return () => clearInterval(interval);
    } else {
      setOpenOrders([]);
      return;
    }
  }, [isConnected, address, isTestMode]);

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const handleCancel = async (oid: number) => {
    // In test mode, allow cancel without wallet
    if (!address && !isTestMode) return;

    // Find the order to get the coin
    const order = openOrders.find(o => o.oid === oid);
    if (!order) return;

    setCancelling(prev => new Set(prev).add(oid));
    try {
      // Generate mock signature (in production, wallet would sign)
      // Generate a 130-character hex signature (64 bytes for r + 64 bytes for s + '0x' prefix)
      const generateHex = (length: number) => {
        let result = '';
        const chars = '0123456789abcdef';
        for (let i = 0; i < length; i++) {
          result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
      };
      const signature = `0x${generateHex(128)}`;
      const timestamp = Date.now();

      // Call the real API (or skip in test mode)
      if (!isTestMode) {
        await cancelOrder({
          coin: order.coin,
          oid,
          signature,
          timestamp,
        });
      } else {
        // In test mode, add a small delay to allow UI to show loading state
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add to order history with canceled status
      const canceledOrder = {
        ...order,
        status: 'canceled' as const,
        timestamp: Date.now(),
      };
      addOrderHistory(canceledOrder);

      // Remove from open orders
      removeOpenOrder(oid);
      success('Order cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      error('Failed to cancel order');
    } finally {
      setCancelling(prev => {
        const next = new Set(prev);
        next.delete(oid);
        return next;
      });
    }
  };

  const handleCancelAll = async () => {
    // In test mode, allow cancel without wallet
    if ((!address && !isTestMode) || openOrders.length === 0) return;

    // Show confirmation modal instead of immediately canceling
    setShowCancelAllModal(true);
  };

  const handleConfirmCancelAll = async () => {
    setShowCancelAllModal(false);
    setCancellingAll(true);
    try {
      // Generate mock signature
      const generateHex = (length: number) => {
        let result = '';
        const chars = '0123456789abcdef';
        for (let i = 0; i < length; i++) {
          result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
      };
      const signature = `0x${generateHex(128)}`;
      const timestamp = Date.now();

      // Call the real API (or skip in test mode)
      if (!isTestMode) {
        await cancelAllOrders(undefined, signature, timestamp);
      } else {
        // In test mode, add a small delay to allow UI to show loading state
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add all orders to history with canceled status
      const canceledOrders = openOrders.map(order => ({
        ...order,
        status: 'canceled' as const,
        timestamp: Date.now(),
      }));
      canceledOrders.forEach(order => addOrderHistory(order));

      // Clear all open orders
      setOpenOrders([]);
      success('All orders cancelled');
    } catch (err) {
      console.error('Failed to cancel all orders:', err);
      error('Failed to cancel all orders');
    } finally {
      setCancellingAll(false);
    }
  };

  // Modify modal handlers
  const handleOpenModifyModal = (order: Order) => {
    setSelectedOrder(order);
    setModifyModalOpen(true);
  };

  const handleConfirmModify = async (newPx?: number, newSz?: number) => {
    if (!selectedOrder) return;
    if (!address && !isTestMode) return;

    setIsSubmittingModify(true);
    try {
      // In test mode, skip API call
      if (!isTestMode) {
        // Call the API to modify the order
        await modifyOrder({
          oid: selectedOrder.oid,
          coin: selectedOrder.coin,
          limitPx: newPx,
          sz: newSz,
        });
      }

      // Update order in store
      const updates: Partial<Order> = {};
      if (newPx !== undefined) updates.limitPx = newPx;
      if (newSz !== undefined) updates.sz = newSz;
      updateOpenOrder(selectedOrder.oid, updates);

      // Show success toast
      success(`Order ${selectedOrder.oid} modified successfully`);

      // Close modal
      setModifyModalOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Failed to modify order:', err);
      error(`Failed to modify order ${selectedOrder.oid}`);
    } finally {
      setIsSubmittingModify(false);
    }
  };

  const handleCancelModify = () => {
    setModifyModalOpen(false);
    setSelectedOrder(null);
    setIsSubmittingModify(false);
  };

  if (!isConnected && !isTestMode) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none" data-testid="orders-table">
        Connect your wallet to view orders
      </div>
    );
  }

  if (openOrders.length === 0) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none" data-testid="orders-table">
        No open orders
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto" data-testid="orders-table">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Type</th>
              <th>Price</th>
              <th>Size</th>
              <th>Filled</th>
              <th>Status</th>
              <th>
                Actions
                {openOrders.length > 0 && (
                  <button
                    onClick={handleCancelAll}
                    disabled={cancellingAll}
                    className="ml-2 px-2 py-0.5 text-xs bg-short hover:bg-short-muted text-white rounded disabled:opacity-50"
                    data-testid="cancel-all-orders"
                    aria-label="Cancel All"
                  >
                    {cancellingAll ? 'Cancelling...' : 'Cancel All'}
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {openOrders.map((order) => (
              <tr key={order.oid}>
                <td>{formatTime(order.timestamp)}</td>
                <td>{order.coin}</td>
                <td className={order.side === 'B' ? 'text-long' : 'text-short'}>
                  {order.side === 'B' ? 'Buy' : 'Sell'}
                </td>
                <td>{order.orderType}</td>
                <td>{formatNumber(order.limitPx)}</td>
                <td>{formatNumber(order.sz, 4)}</td>
                <td>{formatNumber(order.origSz - order.sz, 4)}</td>
                <td>{order.status}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModifyModal(order)}
                      disabled={cancelling.has(order.oid)}
                      className="px-2 py-1 text-xs bg-accent hover:bg-accent-muted text-white rounded disabled:opacity-50"
                      data-testid={`modify-order-${order.oid}`}
                    >
                      Modify
                    </button>
                    <button
                      onClick={() => handleCancel(order.oid)}
                      disabled={cancelling.has(order.oid)}
                      className="px-2 py-1 text-xs bg-short hover:bg-short-muted text-white rounded disabled:opacity-50"
                      data-testid={`cancel-order-${order.oid}`}
                    >
                      {cancelling.has(order.oid) ? '...' : 'Cancel'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Cancel All Confirmation Modal */}
      <Modal
        isOpen={showCancelAllModal}
        onClose={() => setShowCancelAllModal(false)}
        title="Cancel All Orders"
      >
        <div className="space-y-4">
          <div className="text-text-secondary">
            Are you sure you want to cancel all {openOrders.length} open orders?
          </div>
          <div className="bg-surface-elevated p-3 rounded">
            <div className="text-sm text-text-tertiary mb-2">Orders to cancel:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {openOrders.map((order) => (
                <div key={order.oid} className="flex justify-between text-sm">
                  <span className={order.side === 'B' ? 'text-long' : 'text-short'}>
                    {order.side === 'B' ? 'Buy' : 'Sell'} {order.sz} {order.coin}
                  </span>
                  <span className="text-text-tertiary">${formatNumber(order.limitPx)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowCancelAllModal(false)}
              className="px-4 py-2 text-text-secondary border border-border rounded hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCancelAll}
              disabled={cancellingAll}
              className="px-4 py-2 bg-short hover:bg-short-muted text-white rounded disabled:opacity-50"
              data-testid="confirm-cancel-all"
            >
              {cancellingAll ? 'Cancelling...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Order Modify Modal */}
      <OrderModifyModal
        isOpen={modifyModalOpen}
        order={selectedOrder}
        onConfirm={handleConfirmModify}
        onCancel={handleCancelModify}
        isSubmitting={isSubmittingModify}
      />
    </>
  );
}
