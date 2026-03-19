import { db } from "./db";
import {
  users, airdrops,
  type User, type InsertUser, type UpdateUserRequest,
  type Airdrop, type InsertAirdrop, type UpdateAirdropRequest
} from "@shared/schema";
import { eq, ilike, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUserRequest): Promise<User>;

  // Airdrops
  getAirdrops(network?: string, search?: string): Promise<Airdrop[]>;
  getAirdrop(id: number): Promise<Airdrop | undefined>;
  createAirdrop(airdrop: InsertAirdrop): Promise<Airdrop>;
  updateAirdrop(id: number, airdrop: UpdateAirdropRequest): Promise<Airdrop>;
  deleteAirdrop(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: UpdateUserRequest): Promise<User> {
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAirdrops(network?: string, search?: string): Promise<Airdrop[]> {
    let query = db.select().from(airdrops);
    let conditions = [];

    if (network) {
      conditions.push(eq(airdrops.network, network));
    }
    
    if (search) {
      conditions.push(ilike(airdrops.tokenName, `%${search}%`));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  }

  async getAirdrop(id: number): Promise<Airdrop | undefined> {
    const [airdrop] = await db.select().from(airdrops).where(eq(airdrops.id, id));
    return airdrop;
  }

  async createAirdrop(airdrop: InsertAirdrop): Promise<Airdrop> {
    const [created] = await db.insert(airdrops).values(airdrop).returning();
    return created;
  }

  async updateAirdrop(id: number, updateData: UpdateAirdropRequest): Promise<Airdrop> {
    const [updated] = await db.update(airdrops).set(updateData).where(eq(airdrops.id, id)).returning();
    return updated;
  }

  async deleteAirdrop(id: number): Promise<void> {
    await db.delete(airdrops).where(eq(airdrops.id, id));
  }
}

export const storage = new DatabaseStorage();
