import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const creatorsTable = pgTable(
  "creators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    avatarUrl: text("avatar_url"),
    walletAddress: text("wallet_address").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("creators_created_at_idx").on(t.createdAt)],
);

export type Creator = typeof creatorsTable.$inferSelect;
