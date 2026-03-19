import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from 'express';

// Simulated Auth Middleware for MVP (using wallet address passed in headers or body for brevity in non-auth routes)
// Normally this would be a proper JWT or session cookie.
// For AirdropAlertNG MVP, we'll implement a simple login endpoint that returns the user object,
// and frontend will store it and send the wallet address in a custom header 'x-wallet-address' for protected routes.
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const walletAddress = req.headers['x-wallet-address'] as string;
  if (!walletAddress) {
    return res.status(401).json({ message: 'Unauthorized: No wallet address provided' });
  }
  const user = await storage.getUserByWallet(walletAddress);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized: User not found' });
  }
  (req as any).user = user;
  next();
};

const adminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Auth Routes ---
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      let user = await storage.getUserByWallet(input.walletAddress);
      
      if (!user) {
        // Create new user if they don't exist
        user = await storage.createUser({ 
          walletAddress: input.walletAddress,
          isPremium: false,
          isAdmin: false 
        });
        return res.status(201).json(user);
      }
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, authMiddleware, async (req, res) => {
    const user = (req as any).user;
    res.status(200).json(user);
  });

  app.put(api.auth.update.path, authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      const input = api.auth.update.input.parse(req.body);
      const updatedUser = await storage.updateUser(user.id, input);
      res.status(200).json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // --- Airdrops Routes ---
  app.get(api.airdrops.list.path, async (req, res) => {
    try {
      const network = req.query.network as string | undefined;
      const search = req.query.search as string | undefined;
      const airdropsList = await storage.getAirdrops(network, search);
      res.status(200).json(airdropsList);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.airdrops.create.path, authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const input = api.airdrops.create.input.parse(req.body);
      const newAirdrop = await storage.createAirdrop(input);
      res.status(201).json(newAirdrop);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.airdrops.update.path, authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getAirdrop(id);
      if (!existing) {
        return res.status(404).json({ message: 'Airdrop not found' });
      }
      const input = api.airdrops.update.input.parse(req.body);
      const updated = await storage.updateAirdrop(id, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.airdrops.delete.path, authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getAirdrop(id);
      if (!existing) {
        return res.status(404).json({ message: 'Airdrop not found' });
      }
      await storage.deleteAirdrop(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Crypto Prices Route ---
  app.get(api.crypto.prices.path, async (req, res) => {
    try {
      // Using Coingecko simple price API for top tokens
      const ids = 'bitcoin,ethereum,solana,binancecoin,the-open-network';
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
      
      const response = await fetch(url);
      if (!response.ok) {
         throw new Error('Failed to fetch from CoinGecko');
      }
      const data = await response.json();
      res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      // Return fallback data if API fails to prevent UI breakage
      res.status(200).json({
        "bitcoin": { "usd": 65000, "usd_24h_change": 2.5 },
        "ethereum": { "usd": 3500, "usd_24h_change": 1.2 },
        "solana": { "usd": 150, "usd_24h_change": 5.0 },
        "binancecoin": { "usd": 500, "usd_24h_change": -0.5 },
        "the-open-network": { "usd": 7.5, "usd_24h_change": 10.0 }
      });
    }
  });

  // Call seed database
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingAirdrops = await storage.getAirdrops();
    if (existingAirdrops.length === 0) {
      console.log("Seeding initial airdrops...");
      
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await storage.createAirdrop({
        tokenName: "Arbitrum",
        symbol: "ARB",
        network: "Arbitrum One",
        rewardAmount: "2,000 ARB",
        description: "Official Arbitrum DAO airdrop for early network users and delegates.",
        startDate: now,
        endDate: nextWeek,
        isActive: true,
        link: "https://arbitrum.foundation"
      });

      await storage.createAirdrop({
        tokenName: "ZkSync",
        symbol: "ZK",
        network: "ZkSync Era",
        rewardAmount: "Variable",
        description: "Expected airdrop for users interacting with ZkSync Era mainnet and Lite.",
        startDate: now,
        endDate: nextMonth,
        isActive: true,
        link: "https://zksync.io"
      });

      await storage.createAirdrop({
        tokenName: "Linea",
        symbol: "LINEA",
        network: "Linea Mainnet",
        rewardAmount: "TBA",
        description: "Participate in Linea Voyage campaigns to be eligible for future rewards.",
        startDate: now,
        endDate: nextMonth,
        isActive: true,
        link: "https://linea.build"
      });
    }

    // Seed an admin user for testing purposes
    const adminWallet = "0xAdminWallet1234567890abcdef";
    const existingAdmin = await storage.getUserByWallet(adminWallet);
    if (!existingAdmin) {
      await storage.createUser({
        walletAddress: adminWallet,
        isPremium: true,
        isAdmin: true,
        email: "admin@airdropalertng.com"
      });
    }

  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}
