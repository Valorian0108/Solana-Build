import { Router, type IRouter } from "express";
import { db, creatorsTable, tipsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  RecordTipBody,
  ListCreatorTipsQueryParams,
  ListRecentTipsQueryParams,
  listCreatorTipsQueryLimitDefault,
  listRecentTipsQueryLimitDefault,
} from "@workspace/api-zod";
import { verifyTipTransaction } from "../lib/solana";

const router: IRouter = Router();

function serializeTip(
  tip: typeof tipsTable.$inferSelect,
  creatorUsername: string,
) {
  return {
    id: tip.id,
    creatorUsername,
    signature: tip.signature,
    amountLamports: Number(tip.amountLamports),
    tipperName: tip.tipperName,
    tipperWallet: tip.tipperWallet,
    message: tip.message,
    createdAt: tip.createdAt.toISOString(),
  };
}

router.get("/creators/:username/tips", async (req, res) => {
  const parsed = ListCreatorTipsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }
  const limit = parsed.data.limit ?? listCreatorTipsQueryLimitDefault;
  const username = req.params.username.toLowerCase();

  const [creator] = await db
    .select()
    .from(creatorsTable)
    .where(eq(creatorsTable.username, username));
  if (!creator) {
    return res.status(404).json({ message: "Creator not found" });
  }

  const rows = await db
    .select()
    .from(tipsTable)
    .where(eq(tipsTable.creatorId, creator.id))
    .orderBy(desc(tipsTable.createdAt))
    .limit(limit);

  return res.json(rows.map((t) => serializeTip(t, creator.username)));
});

router.post("/creators/:username/tips", async (req, res) => {
  const parsed = RecordTipBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues[0]?.message ?? "Invalid body" });
  }
  const body = parsed.data;
  const username = req.params.username.toLowerCase();

  const [creator] = await db
    .select()
    .from(creatorsTable)
    .where(eq(creatorsTable.username, username));
  if (!creator) {
    return res.status(404).json({ message: "Creator not found" });
  }

  // Idempotency: if signature already recorded, return existing.
  const [existing] = await db
    .select()
    .from(tipsTable)
    .where(eq(tipsTable.signature, body.signature));
  if (existing) {
    return res.status(201).json(serializeTip(existing, creator.username));
  }

  let verifiedAmount: bigint;
  let fromWallet: string | null;
  try {
    const verified = await verifyTipTransaction(
      body.signature,
      creator.walletAddress,
      BigInt(body.amountLamports),
    );
    verifiedAmount = verified.amountLamports;
    fromWallet = verified.fromWallet;
  } catch (err) {
    req.log.warn(
      { err, signature: body.signature },
      "tip verification failed",
    );
    return res.status(400).json({
      message: `Tip verification failed: ${
        (err as { message?: string })?.message ?? "unknown error"
      }`,
    });
  }

  const [created] = await db
    .insert(tipsTable)
    .values({
      creatorId: creator.id,
      signature: body.signature,
      amountLamports: verifiedAmount,
      tipperName: body.tipperName.slice(0, 60),
      tipperWallet: body.tipperWallet ?? fromWallet,
      message: body.message.slice(0, 280),
    })
    .returning();

  if (!created) {
    return res.status(500).json({ message: "Failed to record tip" });
  }
  return res.status(201).json(serializeTip(created, creator.username));
});

router.get("/tips/recent", async (req, res) => {
  const parsed = ListRecentTipsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }
  const limit = parsed.data.limit ?? listRecentTipsQueryLimitDefault;

  const rows = await db
    .select({
      tip: tipsTable,
      creator: creatorsTable,
    })
    .from(tipsTable)
    .innerJoin(creatorsTable, eq(tipsTable.creatorId, creatorsTable.id))
    .orderBy(desc(tipsTable.createdAt))
    .limit(limit);

  return res.json(
    rows.map(({ tip, creator }) => ({
      ...serializeTip(tip, creator.username),
      creatorDisplayName: creator.displayName,
      creatorAvatarUrl: creator.avatarUrl,
    })),
  );
});

export default router;
