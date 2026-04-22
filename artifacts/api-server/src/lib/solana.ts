import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

export const solanaConnection: Connection = new Connection(
  clusterApiUrl("devnet"),
  "confirmed",
);

export interface VerifiedTip {
  amountLamports: bigint;
  fromWallet: string | null;
}

/**
 * Verify a Solana Devnet transaction signature actually transferred at least
 * `expectedLamports` to `creatorWallet`. Returns the verified amount and
 * sender wallet, or throws.
 */
export async function verifyTipTransaction(
  signature: string,
  creatorWallet: string,
  expectedLamports: bigint,
): Promise<VerifiedTip> {
  const tx = await solanaConnection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || !tx.meta) {
    throw new Error("Transaction not found on Solana Devnet");
  }
  if (tx.meta.err) {
    throw new Error("Transaction failed on-chain");
  }

  const accountKeys = tx.transaction.message.getAccountKeys
    ? tx.transaction.message
        .getAccountKeys()
        .staticAccountKeys.map((k) => k.toBase58())
    : tx.transaction.message.staticAccountKeys.map((k: PublicKey) =>
        k.toBase58(),
      );

  const recipientIndex = accountKeys.indexOf(creatorWallet);
  if (recipientIndex === -1) {
    throw new Error("Creator wallet not part of transaction");
  }

  const pre = BigInt(tx.meta.preBalances[recipientIndex] ?? 0);
  const post = BigInt(tx.meta.postBalances[recipientIndex] ?? 0);
  const delta = post - pre;

  if (delta < expectedLamports) {
    throw new Error(
      `Transferred amount (${delta}) is less than expected (${expectedLamports})`,
    );
  }

  // Best-effort sender detection: the first account that lost approximately
  // expectedLamports (plus fees) and isn't the recipient.
  let from: string | null = null;
  for (let i = 0; i < accountKeys.length; i++) {
    if (i === recipientIndex) continue;
    const before = BigInt(tx.meta.preBalances[i] ?? 0);
    const after = BigInt(tx.meta.postBalances[i] ?? 0);
    if (before - after >= expectedLamports) {
      from = accountKeys[i] ?? null;
      break;
    }
  }

  return { amountLamports: delta, fromWallet: from };
}
