import { useState, useEffect, useCallback } from "react";
import { ShoppingItem, InsertShoppingItem } from "@shared/schema";
import { shoppingListStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const { toast } = useToast();

  // Load items from storage on mount
  useEffect(() => {
    const storedItems = shoppingListStorage.getAllItems();
    setItems(storedItems);
  }, []);

  const addItem = useCallback((insertItem: InsertShoppingItem) => {
    const newItem = shoppingListStorage.addItem(insertItem);
    setItems(prev => [...prev, newItem]);
    toast({
      description: "Item adicionado à lista!",
      duration: 2000,
    });
  }, [toast]);

  const toggleItem = useCallback((id: number) => {
    const item = items.find(item => item.id === id);
    if (!item) return;

    const updatedItem = shoppingListStorage.updateItem(id, {
      completed: !item.completed
    });
    
    if (updatedItem) {
      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
      toast({
        description: updatedItem.completed 
          ? "Item marcado como comprado!" 
          : "Item desmarcado!",
        duration: 2000,
      });
    }
  }, [items, toast]);

  const deleteItem = useCallback((id: number) => {
    const success = shoppingListStorage.deleteItem(id);
    if (success) {
      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        description: "Item removido da lista!",
        duration: 2000,
      });
    }
  }, [toast]);

  const clearCompleted = useCallback(() => {
    const completedCount = shoppingListStorage.clearCompleted();
    if (completedCount > 0) {
      setItems(prev => prev.filter(item => !item.completed));
      toast({
        description: `${completedCount} item(s) removido(s)!`,
        duration: 2000,
      });
    }
  }, [toast]);

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    
    const count = shoppingListStorage.clearAll();
    setItems([]);
    toast({
      description: "Lista limpa!",
      duration: 2000,
    });
  }, [items.length, toast]);

  const pendingItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return {
    items,
    pendingItems,
    completedItems,
    totalCount: items.length,
    completedCount: completedItems.length,
    addItem,
    toggleItem,
    deleteItem,
    clearCompleted,
    clearAll,
  };
}
