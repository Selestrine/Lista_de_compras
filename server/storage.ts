import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { shoppingItems, ShoppingItem, InsertShoppingItem } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Initialize database connection
let db: any;
try {
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzle(sql);
  console.log("✅ Connected to Supabase database");
} catch (error) {
  console.error("❌ Failed to connect to database:", error);
  throw new Error("Database connection failed");
}

export interface IStorage {
  getAllShoppingItems(): Promise<ShoppingItem[]>;
  createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem>;
  updateShoppingItem(id: number, updates: Partial<ShoppingItem>): Promise<ShoppingItem | null>;
  deleteShoppingItem(id: number): Promise<boolean>;
  clearCompletedItems(): Promise<number>;
  clearAllItems(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getAllShoppingItems(): Promise<ShoppingItem[]> {
    const items = await db
      .select()
      .from(shoppingItems)
      .orderBy(desc(shoppingItems.createdAt));
    return items;
  }

  async createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem> {
    const [newItem] = await db
      .insert(shoppingItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateShoppingItem(id: number, updates: Partial<ShoppingItem>): Promise<ShoppingItem | null> {
    const [updatedItem] = await db
      .update(shoppingItems)
      .set(updates)
      .where(eq(shoppingItems.id, id))
      .returning();
    return updatedItem || null;
  }

  async deleteShoppingItem(id: number): Promise<boolean> {
    const result = await db
      .delete(shoppingItems)
      .where(eq(shoppingItems.id, id))
      .returning();
    return result.length > 0;
  }

  async clearCompletedItems(): Promise<number> {
    const deletedItems = await db
      .delete(shoppingItems)
      .where(eq(shoppingItems.completed, true))
      .returning();
    return deletedItems.length;
  }

  async clearAllItems(): Promise<number> {
    const deletedItems = await db
      .delete(shoppingItems)
      .returning();
    return deletedItems.length;
  }
}

export const storage = new DatabaseStorage();
