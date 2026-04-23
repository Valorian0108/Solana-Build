# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Spray — Solana Devnet Tip Jar (artifacts/spray)

A creator tip jar dApp for Nigerian creators on Solana **Devnet**. Built as a grant-application proof-of-work for Superteam Nigeria / Solana Foundation.

- **Network**: Solana Devnet only (`clusterApiUrl("devnet")`).
- **Wallets**: Phantom + Solflare via `@solana/wallet-adapter-react` + `@solana/wallet-adapter-react-ui` (CSS imported in `main.tsx`).
- **Routes**: `/` home, `/creators` directory, `/become-a-creator` onboarding, `/c/:username` profile + tip flow.
- **Tip flow**: client builds a `SystemProgram.transfer` tx, `sendTransaction` via wallet adapter, waits for `confirmed` confirmation, then POSTs `{signature, amountLamports, tipperName, tipperWallet, message}` to `/api/creators/:username/tips`.
- **On-chain verification (server)**: `artifacts/api-server/src/lib/solana.ts` re-fetches the tx via `getTransaction` against Devnet, asserts the recipient's lamport balance delta `>= expectedLamports`. Idempotent on the `tips.signature` UNIQUE constraint.
- **DB**: `lib/db/src/schema/creators.ts`, `lib/db/src/schema/tips.ts` (`amountLamports` stored as bigint; serialized as Number in JSON).
- **Polyfill**: `Buffer` is patched onto `globalThis` in `main.tsx` for browser web3.js compatibility.
- **API**: see `lib/api-spec/openapi.yaml`. After edits run `pnpm --filter @workspace/api-spec run codegen`.
