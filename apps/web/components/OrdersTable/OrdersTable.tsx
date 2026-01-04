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

export function OrdersTable() {
  const { openOrders, setOpenOrders, removeOpenOrder, updateOpenOrder } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getOpenOrders, modifyOrder } = useApi();
  const { success, error } = useToast();
  const [cancelling, setCancelling] = useState<Set<number>>(new Set());
  const [cancellingAll, setCancellingAll] = useState(false);

  // Modal state
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmittingModify, setIsSubmittingModify] = useState(false);

  // Load orders when wallet connects
  useEffect(() => {
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
  }, [isConnected, address]);

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const handleCancel = async (oid: number) => {
    if (!address) return;

    setCancelling(prev => new Set(prev).add(oid));
    try {
      // In real implementation:
      // await cancelOrder({ coin: order.coin, oid, signature: '...', timestamp: Date.now() });
      await new Promise(resolve => setTimeout(resolve, 300)); // Mock delay
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
    if (!address || openOrders.length === 0) return;

    setCancellingAll(true);
    try {
      // In real implementation:
      // await cancelAllOrders({ signature: '...', timestamp: Date.now() });
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock delay
      setOpenOrders([]); // Clear all orders
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
    if (!selectedOrder || !address) return;

    setIsSubmittingModify(true);
    try {
      // Call the API to modify the order
      await modifyOrder({
        oid: selectedOrder.oid,
        coin: selectedOrder.coin,
        limitPx: newPx,
        sz: newSz,
      });

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

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none">
        Connect your wallet to view orders
      </div>
    );
  }

  if (openOrders.length === 0) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none">
        No open orders
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto">
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
