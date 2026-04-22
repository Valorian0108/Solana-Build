import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function formatLamports(lamports: number): string {
  const sol = lamportsToSol(lamports);
  // Max 4 decimal places, strip trailing zeros
  return parseFloat(sol.toFixed(4)).toString();
}

export function truncateAddress(address: string | null | undefined): string {
  if (!address) return "";
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export const QUICK_TIP_AMOUNTS = [0.05, 0.1, 0.5, 1.0];
