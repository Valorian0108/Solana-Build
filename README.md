# Spray

A tip jar dApp for African creators, built on Solana Devnet.

Spray lets fans send SOL tips directly to their favourite creators — musicians, artists, writers — with no middleman. Every tip is verified on-chain before being recorded.

**Live demo:** _coming soon_  
**Network:** Solana Devnet

---

## What It Does

- Creators register a profile with a username, wallet address, and bio
- Fans browse the creator directory and visit any creator's page
- Fans connect their Phantom or Solflare wallet and send a SOL tip with a message
- The server verifies the transaction on-chain before recording it — no fake tips
- Creators see their tip history and total earnings on their profile

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/creators` | Browse all creators |
| `/become-a-creator` | Register as a creator |
| `/c/:username` | Creator profile + tip flow |

## Stack

- **Frontend:** React + Vite + Wouter
- **Wallets:** Phantom & Solflare via `@solana/wallet-adapter-react`
- **Blockchain:** Solana web3.js — `SystemProgram.transfer`, on-chain tx verification
- **Backend:** Express 5 + Node.js
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod + Orval codegen from OpenAPI spec

## How Tipping Works

1. Fan connects wallet on a creator's page
2. Selects a SOL amount and optionally adds a message
3. Wallet signs and sends a `SystemProgram.transfer` transaction
4. The app submits the transaction signature to the backend
5. The server re-fetches the transaction from Devnet and verifies the recipient received the correct amount
6. Only then is the tip recorded in the database (duplicate signatures are rejected)

## Running Locally

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Add DATABASE_URL to .env

# Push DB schema
pnpm --filter @workspace/db run push

# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/spray run dev
