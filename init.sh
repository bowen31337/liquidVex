#!/bin/bash

# liquidVex - Hyperliquid DEX Trading Interface
# Development Environment Setup Script

set -e

echo "=========================================="
echo "liquidVex Development Environment Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed.${NC}"
        echo "Please install $1 and try again."
        exit 1
    else
        echo -e "${GREEN}✓${NC} $1 found"
    fi
}

echo -e "${BLUE}Checking prerequisites...${NC}"
check_command node
check_command pnpm
check_command python3
check_command uv

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version $(node -v)"

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]); then
    echo -e "${RED}Error: Python 3.11+ is required. Current version: $PYTHON_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Python version $PYTHON_VERSION"

echo ""
echo -e "${BLUE}Setting up project structure...${NC}"

# Create monorepo structure if not exists
mkdir -p apps/web
mkdir -p apps/api
mkdir -p packages/shared-config

# Initialize root package.json if not exists
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Creating root package.json...${NC}"
    cat > package.json << 'EOF'
{
  "name": "liquidvex",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=@liquidvex/web",
    "dev:api": "cd apps/api && uv run python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
fi

# Create pnpm-workspace.yaml if not exists
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo -e "${YELLOW}Creating pnpm-workspace.yaml...${NC}"
    cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
fi

# Create turbo.json if not exists
if [ ! -f "turbo.json" ]; then
    echo -e "${YELLOW}Creating turbo.json...${NC}"
    cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "cache": false
    },
    "test:e2e": {
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
EOF
fi

# Create Next.js app if not exists
if [ ! -f "apps/web/package.json" ]; then
    echo -e "${YELLOW}Creating Next.js frontend app...${NC}"
    cat > apps/web/package.json << 'EOF'
{
  "name": "@liquidvex/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint && biome check .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf .next node_modules"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.28.0",
    "wagmi": "^2.5.0",
    "viem": "^2.8.0",
    "@walletconnect/modal": "^2.6.0",
    "lightweight-charts": "^4.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@biomejs/biome": "^1.6.0",
    "vitest": "^1.4.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
EOF
fi

# Create Python API setup if not exists
if [ ! -f "apps/api/pyproject.toml" ]; then
    echo -e "${YELLOW}Creating FastAPI backend app...${NC}"
    mkdir -p apps/api
    cat > apps/api/pyproject.toml << 'EOF'
[project]
name = "liquidvex-api"
version = "0.1.0"
description = "liquidVex DEX Trading Interface - Backend API"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.28.0",
    "pydantic>=2.6.0",
    "pydantic-settings>=2.2.0",
    "httpx>=0.27.0",
    "python-dotenv>=1.0.0",
    "websockets>=12.0",
    "hyperliquid-python-sdk>=0.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "mypy>=1.9.0",
    "ruff>=0.3.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "W", "B", "UP"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
EOF
fi

# Create basic main.py for FastAPI if not exists
if [ ! -f "apps/api/main.py" ]; then
    cat > apps/api/main.py << 'EOF'
"""
liquidVex API - Hyperliquid DEX Trading Interface Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="liquidVex API",
    description="Backend API for liquidVex - Hyperliquid DEX Trading Interface",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint - API health check."""
    return {"status": "ok", "message": "liquidVex API is running"}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
EOF
fi

# Create .env.example files
echo -e "${YELLOW}Creating environment files...${NC}"

cat > .env.example << 'EOF'
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Backend Environment Variables
# Add any backend-specific env vars here
EOF

if [ ! -f "apps/web/.env.local" ]; then
    cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOF
fi

echo ""
echo -e "${BLUE}Installing dependencies...${NC}"

# Install Node.js dependencies
echo -e "${YELLOW}Installing Node.js dependencies with pnpm...${NC}"
pnpm install

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies with uv...${NC}"
cd apps/api
uv sync
cd ../..

echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo ""
echo "  ${YELLOW}Development:${NC}"
echo "    pnpm dev         - Start both frontend and backend in development mode"
echo "    pnpm dev:web     - Start only the Next.js frontend (port 3000)"
echo "    pnpm dev:api     - Start only the FastAPI backend (port 8000)"
echo ""
echo "  ${YELLOW}Build & Test:${NC}"
echo "    pnpm build       - Build all packages"
echo "    pnpm lint        - Run linting"
echo "    pnpm type-check  - Run TypeScript type checking"
echo "    pnpm test        - Run all tests"
echo ""
echo -e "${BLUE}Access Points:${NC}"
echo "    Frontend:     http://localhost:3000"
echo "    Backend API:  http://localhost:8000"
echo "    Swagger Docs: http://localhost:8000/docs"
echo "    ReDoc:        http://localhost:8000/redoc"
echo ""
echo -e "${GREEN}Happy trading! 🚀${NC}"
