import {
  pgTable,
  text,
  timestamp,
  uuid,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { creatorsTable } from "./creators";

export const tipsTable = pgTable(
  "tips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creatorsTable.id, { onDelete: "cascade" }),
    signature: text("signature").notNull().unique(),
    amountLamports: bigint("amount_lamports", { mode: "bigint" }).notNull(),
    tipperName: text("tipper_name").notNull(),
    tipperWallet: text("tipper_wallet"),
    message: text("message").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("tips_creator_id_idx").on(t.creatorId),
    index("tips_created_at_idx").on(t.createdAt),
  ],
);

export type TipRow = typeof tipsTable.$inferSelect;
