import { Header } from '@/components/Header/Header';
import { OrderBook } from '@/components/OrderBook/OrderBook';
import { RecentTrades } from '@/components/OrderBook/RecentTrades';
import { Chart } from '@/components/Chart/Chart';
import { OrderForm } from '@/components/OrderForm/OrderForm';
import { BottomPanel } from '@/components/BottomPanel/BottomPanel';

export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Trading Grid */}
      <div className="grid grid-cols-12 gap-1 p-1 h-[calc(100vh-3.5rem-200px)]">
        {/* Chart Panel - 60% */}
        <div className="col-span-7">
          <Chart />
        </div>

        {/* Right Side - Order Book + Trades */}
        <div className="col-span-2 flex flex-col gap-1">
          {/* Order Book */}
          <div className="flex-1 min-h-0">
            <OrderBook />
          </div>
          {/* Recent Trades */}
          <div className="flex-1 min-h-0">
            <RecentTrades />
          </div>
        </div>

        {/* Order Entry Panel */}
        <div className="col-span-3">
          <OrderForm />
        </div>
      </div>

      {/* Bottom Panel - Positions/Orders */}
      <BottomPanel />
    </main>
  );
}
