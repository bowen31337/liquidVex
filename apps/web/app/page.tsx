export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-text-primary">liquidVex</h1>
          {/* Asset Selector will go here */}
          <div className="text-text-secondary text-sm">BTC-PERP</div>
        </div>
        <div className="flex items-center gap-4">
          {/* Price display */}
          <div className="text-right">
            <div className="font-mono text-lg text-text-primary">$95,420.50</div>
            <div className="text-xs text-long">+2.34%</div>
          </div>
          {/* Wallet Connect Button */}
          <button className="btn btn-accent">Connect Wallet</button>
        </div>
      </header>

      {/* Main Trading Grid */}
      <div className="grid grid-cols-12 gap-1 p-1 h-[calc(100vh-3.5rem-200px)]">
        {/* Chart Panel - 60% */}
        <div className="col-span-7 panel p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
                <button
                  key={tf}
                  className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded"
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-full flex items-center justify-center text-text-tertiary">
            TradingView Chart will be rendered here
          </div>
        </div>

        {/* Right Side - Order Book + Trades */}
        <div className="col-span-2 flex flex-col gap-1">
          {/* Order Book */}
          <div className="panel p-2 flex-1">
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Order Book
            </div>
            <div className="text-text-tertiary text-xs">Order book levels will appear here</div>
          </div>
          {/* Recent Trades */}
          <div className="panel p-2 flex-1">
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Recent Trades
            </div>
            <div className="text-text-tertiary text-xs">Recent trades will appear here</div>
          </div>
        </div>

        {/* Order Entry Panel */}
        <div className="col-span-3 panel p-3">
          <div className="flex mb-4">
            <button className="flex-1 py-2 text-center bg-long text-white rounded-l font-medium">
              Buy / Long
            </button>
            <button className="flex-1 py-2 text-center bg-surface-elevated text-text-secondary rounded-r font-medium hover:text-text-primary">
              Sell / Short
            </button>
          </div>

          <div className="space-y-3">
            {/* Order Type */}
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wider">
                Order Type
              </label>
              <select className="input w-full mt-1">
                <option>Limit</option>
                <option>Market</option>
                <option>Stop Limit</option>
                <option>Stop Market</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wider">Price</label>
              <input
                type="number"
                placeholder="0.00"
                className="input w-full mt-1 font-mono"
              />
            </div>

            {/* Size */}
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wider">Size</label>
              <input type="number" placeholder="0.00" className="input w-full mt-1 font-mono" />
              <div className="flex gap-1 mt-2">
                {['25%', '50%', '75%', '100%'].map((pct) => (
                  <button
                    key={pct}
                    className="flex-1 py-1 text-xs text-text-secondary bg-surface-elevated rounded hover:text-text-primary"
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage */}
            <div>
              <div className="flex justify-between text-xs text-text-secondary uppercase tracking-wider">
                <span>Leverage</span>
                <span className="text-text-primary">10x</span>
              </div>
              <input type="range" min="1" max="50" defaultValue="10" className="w-full mt-1" />
            </div>

            {/* Options */}
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded" />
                Reduce Only
              </label>
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded" />
                Post Only
              </label>
            </div>

            {/* Submit Button */}
            <button className="btn btn-buy w-full py-3 text-lg font-semibold">Buy / Long</button>

            {/* Order Summary */}
            <div className="text-xs text-text-tertiary space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between">
                <span>Order Value</span>
                <span className="text-text-secondary font-mono">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Available</span>
                <span className="text-text-secondary font-mono">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel - Positions/Orders */}
      <div className="h-[200px] border-t border-border bg-surface">
        <div className="flex border-b border-border">
          {['Positions', 'Open Orders', 'Order History', 'Trade History'].map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm ${
                i === 0
                  ? 'text-text-primary border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
              {i === 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-surface-elevated rounded">0</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-4 text-center text-text-tertiary text-sm">
          Connect your wallet to view positions and orders
        </div>
      </div>
    </main>
  );
}
