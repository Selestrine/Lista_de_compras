import { createClient } from '@supabase/supabase-js';
import { ShoppingItem, InsertShoppingItem } from "@shared/schema";

// Initialize Supabase client
let supabase: any = null;
let useDatabase = false;

try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log("🔍 Connecting to Supabase API...");
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    useDatabase = true;
    console.log("✅ Supabase API client configured successfully");
  }
} catch (error) {
  console.error("❌ Failed to setup Supabase client:", error);
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
    try {
      if (!useDatabase || !supabase) {
        return await this.memoryFallback.getAllShoppingItems();
      }
      
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        completed: item.completed,
        createdAt: new Date(item.created_at)
      }));
    } catch (error) {
      console.error("Supabase API error, falling back to memory:", error);
      return await this.memoryFallback.getAllShoppingItems();
    }
  }

  async createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem> {
    try {
      if (!useDatabase || !supabase) {
        return await this.memoryFallback.createShoppingItem(item);
      }
      
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({
          name: item.name,
          completed: item.completed || false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        completed: data.completed,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Supabase API error, falling back to memory:", error);
      return await this.memoryFallback.createShoppingItem(item);
    }
  }

  async updateShoppingItem(id: number, updates: Partial<ShoppingItem>): Promise<ShoppingItem | null> {
    try {
      if (!useDatabase || !supabase) {
        return await this.memoryFallback.updateShoppingItem(id, updates);
      }
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      
      const { data, error } = await supabase
        .from('shopping_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        completed: data.completed,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Supabase API error, falling back to memory:", error);
      return await this.memoryFallback.updateShoppingItem(id, updates);
    }
  }

  async deleteShoppingItem(id: number): Promise<boolean> {
    try {
      if (!useDatabase || !supabase) {
        return await this.memoryFallback.deleteShoppingItem(id);
      }
      
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Supabase API error, falling back to memory:", error);
      return await this.memoryFallback.deleteShoppingItem(id);
    }
  }

  async clearCompletedItems(): Promise<number> {
    try {
      if (!useDatabase || !supabase) {
        return await this.memoryFallback.clearCompletedItems();
      }
      
      const { data, error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('completed', true)
        .select();
      
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Supabase API error, falling back to memory:", error);
      return await this.memoryFallback.clearCompletedItems();
    }
  }

  async clearAllItems(): Promise<number> {
    try {
      if (!useDatabase || !supabase) {
        return await this.memoryFallback.clearAllItems();
      }
      
      const { data, error } = await supabase
        .from('shopping_items')
        .delete()
        .neq('id', 0)
        .select();
      
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Supabase API error, falling back to memory:", error);
      return await this.memoryFallback.clearAllItems();
    }
  }
}

export const storage = new DatabaseStorage();