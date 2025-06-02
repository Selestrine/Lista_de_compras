import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { shoppingItems, ShoppingItem, InsertShoppingItem } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Initialize database connection
let db: any = null;
let useDatabase = false;

try {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
    useDatabase = true;
    console.log("✅ Supabase database configured");
  }
} catch (error) {
  console.error("❌ Failed to setup database connection:", error);
  useDatabase = false;
}

export interface IStorage {
  getAllShoppingItems(): Promise<ShoppingItem[]>;
  createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem>;
  updateShoppingItem(id: number, updates: Partial<ShoppingItem>): Promise<ShoppingItem | null>;
  deleteShoppingItem(id: number): Promise<boolean>;
  clearCompletedItems(): Promise<number>;
  clearAllItems(): Promise<number>;
}

// Memory storage as fallback
class MemoryStorage implements IStorage {
  private items: Map<number, ShoppingItem> = new Map();
  private currentId = 1;

  async getAllShoppingItems(): Promise<ShoppingItem[]> {
    return Array.from(this.items.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem> {
    const newItem: ShoppingItem = {
      id: this.currentId++,
      name: item.name,
      completed: false,
      createdAt: new Date(),
    };
    this.items.set(newItem.id, newItem);
    return newItem;
  }

  async updateShoppingItem(id: number, updates: Partial<ShoppingItem>): Promise<ShoppingItem | null> {
    const item = this.items.get(id);
    if (!item) return null;
    
    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteShoppingItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async clearCompletedItems(): Promise<number> {
    const completed = Array.from(this.items.values()).filter(item => item.completed);
    completed.forEach(item => this.items.delete(item.id));
    return completed.length;
  }

  async clearAllItems(): Promise<number> {
    const count = this.items.size;
    this.items.clear();
    return count;
  }
}

export class DatabaseStorage implements IStorage {
  private memoryFallback = new MemoryStorage();

  async getAllShoppingItems(): Promise<ShoppingItem[]> {
    if (!useDatabase || !db) {
      return this.memoryFallback.getAllShoppingItems();
    }

    try {
      const items = await db
        .select()
        .from(shoppingItems)
        .orderBy(desc(shoppingItems.createdAt));
      return items;
    } catch (error) {
      console.error("Database error, using memory storage:", error);
      return this.memoryFallback.getAllShoppingItems();
    }
  }

  async createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem> {
    if (!useDatabase || !db) {
      return this.memoryFallback.createShoppingItem(item);
    }

    try {
      const [newItem] = await db
        .insert(shoppingItems)
        .values(item)
        .returning();
      return newItem;
    } catch (error) {
      console.error("Database error, using memory storage:", error);
      return this.memoryFallback.createShoppingItem(item);
    }
  }

  async updateShoppingItem(id: number, updates: Partial<ShoppingItem>): Promise<ShoppingItem | null> {
    if (!useDatabase || !db) {
      return this.memoryFallback.updateShoppingItem(id, updates);
    }

    try {
      const [updatedItem] = await db
        .update(shoppingItems)
        .set(updates)
        .where(eq(shoppingItems.id, id))
        .returning();
      return updatedItem || null;
    } catch (error) {
      console.error("Database error, using memory storage:", error);
      return this.memoryFallback.updateShoppingItem(id, updates);
    }
  }

  async deleteShoppingItem(id: number): Promise<boolean> {
    if (!useDatabase || !db) {
      return this.memoryFallback.deleteShoppingItem(id);
    }

    try {
      const result = await db
        .delete(shoppingItems)
        .where(eq(shoppingItems.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Database error, using memory storage:", error);
      return this.memoryFallback.deleteShoppingItem(id);
    }
  }

  async clearCompletedItems(): Promise<number> {
    if (!useDatabase || !db) {
      return this.memoryFallback.clearCompletedItems();
    }

    try {
      const deletedItems = await db
        .delete(shoppingItems)
        .where(eq(shoppingItems.completed, true))
        .returning();
      return deletedItems.length;
    } catch (error) {
      console.error("Database error, using memory storage:", error);
      return this.memoryFallback.clearCompletedItems();
    }
  }

  async clearAllItems(): Promise<number> {
    if (!useDatabase || !db) {
      return this.memoryFallback.clearAllItems();
    }

    try {
      const deletedItems = await db
        .delete(shoppingItems)
        .returning();
      return deletedItems.length;
    } catch (error) {
      console.error("Database error, using memory storage:", error);
      return this.memoryFallback.clearAllItems();
    }
  }
}

export const storage = new DatabaseStorage();
