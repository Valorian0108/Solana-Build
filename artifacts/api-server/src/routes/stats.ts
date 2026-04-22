import { Router, type IRouter } from "express";
import { db, creatorsTable, tipsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  GetTopCreatorsQueryParams,
  getTopCreatorsQueryLimitDefault,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/platform", async (_req, res) => {
  const [creatorsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(creatorsTable);

  const [tipsAgg] = await db
    .select({
      totalTips: sql<number>`count(*)::int`,
      totalLamports: sql<string>`coalesce(sum(${tipsTable.amountLamports})::text, '0')`,
    })
    .from(tipsTable);

  return res.json({
    totalCreators: Number(creatorsCount?.count ?? 0),
    totalTips: Number(tipsAgg?.totalTips ?? 0),
    totalLamports: Number(tipsAgg?.totalLamports ?? 0),
  });
});

router.get("/stats/top-creators", async (req, res) => {
  const parsed = GetTopCreatorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }
  const limit = parsed.data.limit ?? getTopCreatorsQueryLimitDefault;

  const rows = await db
    .select({
      creator: creatorsTable,
      totalTips: sql<number>`count(${tipsTable.id})::int`,
      totalLamports: sql<string>`coalesce(sum(${tipsTable.amountLamports})::text, '0')`,
    })
    .from(creatorsTable)
    .leftJoin(tipsTable, eq(tipsTable.creatorId, creatorsTable.id))
    .groupBy(creatorsTable.id)
    .orderBy(desc(sql`coalesce(sum(${tipsTable.amountLamports}), 0)`))
    .limit(limit);

  return res.json(
    rows.map(({ creator, totalTips, totalLamports }) => ({
      id: creator.id,
      username: creator.username,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      walletAddress: creator.walletAddress,
      createdAt: creator.createdAt.toISOString(),
      totalTips: Number(totalTips ?? 0),
      totalLamports: Number(totalLamports ?? 0),
    })),
  );
});

export default router;
