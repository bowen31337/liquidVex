# liquidVex - Hyperliquid DEX Trading Interface

A professional-grade trading interface for the Hyperliquid decentralized exchange, built with Next.js and FastAPI.

## Overview

liquidVex provides a comprehensive trading experience with real-time market data, advanced charting, and seamless wallet integration for the Hyperliquid DEX.

### Key Features

- **Real-time Market Data**: Live order book, trades, and price updates via WebSocket
- **Advanced Charting**: TradingView-powered candlestick charts with multiple timeframes
- **Order Management**: Market, limit, and stop orders with leverage support
- **Position Tracking**: Real-time P&L, liquidation prices, and margin monitoring
- **Wallet Integration**: Connect with MetaMask, WalletConnect, and other EVM wallets
- **Dark Trading Theme**: Professional dark interface optimized for extended trading sessions

## Tech Stack

### Frontend (`apps/web`)
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand + TanStack Query
- **Styling**: TailwindCSS with custom trading theme
- **Charts**: TradingView Lightweight Charts
- **Wallet**: wagmi + viem

### Backend (`apps/api`)
- **Framework**: FastAPI (Python 3.11+)
- **Package Manager**: uv
- **Real-time**: WebSocket endpoints
- **Validation**: Pydantic v2

### Infrastructure
- **Monorepo**: Turborepo with pnpm workspaces
- **Linting**: Biome (TypeScript), Ruff (Python)
- **Type Checking**: TypeScript strict, mypy
- **Testing**: Vitest (frontend), pytest (backend), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- uv (Python package manager)

### Quick Setup

Run the initialization script:

```bash
chmod +x init.sh
./init.sh
```

Or manually:

```bash
# Install Node dependencies
pnpm install

# Set up Python environment
cd apps/api
uv venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
uv pip install -e ".[dev]"
cd ../..

# Copy environment files
cp .env.example .env.local
```

### Development

```bash
# Start all services
pnpm dev

# Or start individually
pnpm dev:web   # Next.js on http://localhost:3000
pnpm dev:api   # FastAPI on http://localhost:8000
```

### Building

```bash
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Frontend tests
pnpm test:web

# Backend tests
pnpm test:api

# E2E tests
pnpm test:e2e
```

### Linting

```bash
pnpm lint
pnpm type-check
```

## Project Structure

```
liquidvex/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand stores
│   │   └── types/           # TypeScript types
│   └── api/                 # FastAPI backend
│       ├── main.py          # App entry point
│       └── routers/         # API endpoints
├── packages/                # Shared packages
├── feature_list.json        # E2E test specifications
├── init.sh                  # Setup script
├── turbo.json               # Turborepo config
└── biome.json               # Linting config
```

## API Endpoints

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta` | GET | Exchange metadata and trading pairs |
| `/api/asset/{coin}` | GET | Asset-specific information |
| `/api/funding/{coin}` | GET | Current funding rate |
| `/api/candles/{coin}` | GET | Historical OHLCV data |
| `/api/account/state/{address}` | GET | Account state and balances |
| `/api/account/positions/{address}` | GET | Open positions |
| `/api/account/orders/{address}` | GET | Open orders |
| `/api/trade/place` | POST | Place new order |
| `/api/trade/cancel` | POST | Cancel order |
| `/api/trade/modify` | POST | Modify order |

### WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `/ws/orderbook/{coin}` | Real-time L2 order book |
| `/ws/trades/{coin}` | Live trade stream |
| `/ws/candles/{coin}/{interval}` | Real-time candle updates |
| `/ws/allMids` | All mid prices |
| `/ws/user/{address}` | User account updates |

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `bg-background` | `#0a0a0a` | Main background |
| `bg-surface` | `#171717` | Panels, cards |
| `border-border` | `#262626` | Borders |
| `text-muted` | `#a1a1aa` | Secondary text |
| `text-long` / `text-buy` | `#22c55e` | Buy/long actions |
| `text-short` / `text-sell` | `#ef4444` | Sell/short actions |
| `text-profit` | `#22c55e` | Positive P&L |
| `text-loss` | `#ef4444` | Negative P&L |

### Typography

- **UI Font**: Inter (400, 500, 600, 700)
- **Mono Font**: JetBrains Mono (prices, data)

## Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Hyperliquid Configuration
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
HYPERLIQUID_WS_URL=wss://api.hyperliquid.xyz

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint`
6. Commit: `git commit -m 'Add my feature'`
7. Push: `git push origin feature/my-feature`
8. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built for traders, by traders. 📈
