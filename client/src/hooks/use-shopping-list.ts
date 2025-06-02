import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingItem, InsertShoppingItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useShoppingList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all shopping items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['/api/shopping-items'],
    queryFn: async () => {
      const response = await fetch('/api/shopping-items');
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      return response.json() as Promise<ShoppingItem[]>;
    }
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: InsertShoppingItem) => {
      const response = await fetch('/api/shopping-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-items'] });
      toast({
        description: "Item adicionado à lista!",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Error adding item:', error);
      toast({
        description: "Erro ao adicionar item",
        duration: 2000,
      });
    }
  });

  // Toggle item mutation
  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await fetch(`/api/shopping-items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      return response.json();
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-items'] });
      toast({
        description: completed 
          ? "Item marcado como comprado!" 
          : "Item desmarcado!",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      toast({
        description: "Erro ao atualizar item",
        duration: 2000,
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/shopping-items/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-items'] });
      toast({
        description: "Item removido da lista!",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast({
        description: "Erro ao remover item",
        duration: 2000,
      });
    }
  });

  // Clear completed items mutation
  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/shopping-items/completed', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear completed items');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-items'] });
      toast({
        description: `${data?.deletedCount || 0} item(s) removido(s)!`,
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Error clearing completed items:', error);
      toast({
        description: "Erro ao limpar itens",
        duration: 2000,
      });
    }
  });

  // Clear all items mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/shopping-items', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear all items');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-items'] });
      toast({
        description: "Lista limpa!",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Error clearing all items:', error);
      toast({
        description: "Erro ao limpar lista",
        duration: 2000,
      });
    }
  });

  const pendingItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return {
    items,
    pendingItems,
    completedItems,
    totalCount: items.length,
    completedCount: completedItems.length,
    isLoading,
    addItem: (item: InsertShoppingItem) => addItemMutation.mutate(item),
    toggleItem: (id: number) => {
      const item = items.find(item => item.id === id);
      if (item) {
        toggleItemMutation.mutate({ id, completed: !item.completed });
      }
    },
    deleteItem: (id: number) => deleteItemMutation.mutate(id),
    clearCompleted: () => clearCompletedMutation.mutate(),
    clearAll: () => clearAllMutation.mutate(),
    isAddingItem: addItemMutation.isPending,
    isUpdating: toggleItemMutation.isPending || deleteItemMutation.isPending,
    isClearing: clearCompletedMutation.isPending || clearAllMutation.isPending,
  };
}
