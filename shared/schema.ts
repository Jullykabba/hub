import { pgTable, text, serial, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  isPremium: boolean("is_premium").default(false),
  email: text("email"),
  telegram: text("telegram"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const airdrops = pgTable("airdrops", {
  id: serial("id").primaryKey(),
  tokenName: text("token_name").notNull(),
  symbol: text("symbol").notNull(),
  network: text("network").notNull(),
  rewardAmount: text("reward_amount").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  link: text("link").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAirdropSchema = createInsertSchema(airdrops).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserRequest = Partial<InsertUser>;

export type Airdrop = typeof airdrops.$inferSelect;
export type InsertAirdrop = z.infer<typeof insertAirdropSchema>;
export type UpdateAirdropRequest = Partial<InsertAirdrop>;

// Response types
export type AuthResponse = User;
export type AirdropsListResponse = Airdrop[];
