import { Router, type IRouter } from "express";
import { db, creatorsTable, tipsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import {
  CreateCreatorBody,
  ListCreatorsQueryParams,
  GetCreatorParams,
  listCreatorsQueryLimitDefault,
} from "@workspace/api-zod";
import { PublicKey } from "@solana/web3.js";

const router: IRouter = Router();

function isValidSolanaAddress(addr: string): boolean {
  try {
    const pk = new PublicKey(addr);
    return PublicKey.isOnCurve(pk.toBuffer()) || true;
  } catch {
    return false;
  }
}

function serializeCreator(c: typeof creatorsTable.$inferSelect) {
  return {
    id: c.id,
    username: c.username,
    displayName: c.displayName,
    bio: c.bio,
    avatarUrl: c.avatarUrl,
    walletAddress: c.walletAddress,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/creators", async (req, res) => {
  const parsed = ListCreatorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }
  const { search, limit } = parsed.data;
  const effectiveLimit = limit ?? listCreatorsQueryLimitDefault;

  const where = search
    ? or(
        ilike(creatorsTable.username, `%${search}%`),
        ilike(creatorsTable.displayName, `%${search}%`),
      )
    : undefined;

  const rows = await db
    .select()
    .from(creatorsTable)
    .where(where)
    .orderBy(desc(creatorsTable.createdAt))
    .limit(effectiveLimit);

  return res.json(rows.map(serializeCreator));
});

router.post("/creators", async (req, res) => {
  const parsed = CreateCreatorBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues[0]?.message ?? "Invalid body" });
  }
  const body = parsed.data;
  if (!isValidSolanaAddress(body.walletAddress)) {
    return res.status(400).json({ message: "Invalid Solana wallet address" });
  }

  try {
    const [created] = await db
      .insert(creatorsTable)
      .values({
        username: body.username.toLowerCase(),
        displayName: body.displayName,
        bio: body.bio,
        avatarUrl: body.avatarUrl ?? null,
        walletAddress: body.walletAddress,
      })
      .returning();
    if (!created) {
      return res.status(500).json({ message: "Failed to create" });
    }
    res.status(201).json(serializeCreator(created));
    return;
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return res
        .status(409)
        .json({ message: "Username or wallet already taken" });
    }
    req.log.error({ err }, "createCreator failed");
    return res.status(500).json({ message: "Failed to create creator" });
  }
});

router.get("/creators/:username", async (req, res) => {
  const parsed = GetCreatorParams.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid username" });
  }
  const username = parsed.data.username.toLowerCase();
  const [creator] = await db
    .select()
    .from(creatorsTable)
    .where(eq(creatorsTable.username, username));
  if (!creator) {
    return res.status(404).json({ message: "Creator not found" });
  }
  return res.json(serializeCreator(creator));
});

router.get("/creators/:username/stats", async (req, res) => {
  const username = req.params.username.toLowerCase();
  const [creator] = await db
    .select()
    .from(creatorsTable)
    .where(eq(creatorsTable.username, username));
  if (!creator) {
    return res.status(404).json({ message: "Creator not found" });
  }
  const [row] = await db
    .select({
      totalTips: sql<number>`count(*)::int`,
      totalLamports: sql<string>`coalesce(sum(${tipsTable.amountLamports})::text, '0')`,
      uniqueTippers: sql<number>`count(distinct coalesce(${tipsTable.tipperWallet}, ${tipsTable.tipperName}))::int`,
      biggestTipLamports: sql<string>`coalesce(max(${tipsTable.amountLamports})::text, '0')`,
    })
    .from(tipsTable)
    .where(eq(tipsTable.creatorId, creator.id));

  return res.json({
    totalTips: Number(row?.totalTips ?? 0),
    totalLamports: Number(row?.totalLamports ?? 0),
    uniqueTippers: Number(row?.uniqueTippers ?? 0),
    biggestTipLamports: Number(row?.biggestTipLamports ?? 0),
  });
});

export default router;
