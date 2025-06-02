import { ShoppingItem, InsertShoppingItem } from "@shared/schema";

const STORAGE_KEY = 'shoppingList';

export class ShoppingListStorage {
  private getItems(): ShoppingItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading shopping list from storage:', error);
      return [];
    }
  }

  private saveItems(items: ShoppingItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving shopping list to storage:', error);
    }
  }

  getAllItems(): ShoppingItem[] {
    return this.getItems();
  }

  addItem(insertItem: InsertShoppingItem): ShoppingItem {
    const items = this.getItems();
    const newItem: ShoppingItem = {
      ...insertItem,
      id: Date.now(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    const updatedItems = [...items, newItem];
    this.saveItems(updatedItems);
    return newItem;
  }

  updateItem(id: number, updates: Partial<ShoppingItem>): ShoppingItem | null {
    const items = this.getItems();
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) return null;
    
    const updatedItem = { ...items[itemIndex], ...updates };
    items[itemIndex] = updatedItem;
    this.saveItems(items);
    return updatedItem;
  }

  deleteItem(id: number): boolean {
    const items = this.getItems();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) return false;
    
    this.saveItems(filteredItems);
    return true;
  }

  clearCompleted(): number {
    const items = this.getItems();
    const completedCount = items.filter(item => item.completed).length;
    const pendingItems = items.filter(item => !item.completed);
    
    this.saveItems(pendingItems);
    return completedCount;
  }

  clearAll(): number {
    const items = this.getItems();
    const count = items.length;
    this.saveItems([]);
    return count;
  }
}

export const shoppingListStorage = new ShoppingListStorage();
