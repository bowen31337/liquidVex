import { Header } from '@/components/Header/Header';
import { BottomPanel } from '@/components/BottomPanel/BottomPanel';
import { ToastContainer } from '@/components/Toast/Toast';
import { TradingGrid } from '@/components/TradingGrid/TradingGrid';

export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen">
      {/* Toast Notifications */}
      <ToastContainer />
      {/* Header */}
      <Header />

      {/* Main Trading Grid with Resizable Panels */}
      <TradingGrid />

      {/* Bottom Panel - Positions/Orders */}
      <BottomPanel />
    </main>
  );
}
