import { useState } from "react";
import { ShoppingCart, Plus, Trash2, Fan, TrashIcon, Check, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { insertShoppingItemSchema } from "@shared/schema";

export default function ShoppingListPage() {
  const [inputValue, setInputValue] = useState("");
  const {
    pendingItems,
    completedItems,
    totalCount,
    completedCount,
    addItem,
    toggleItem,
    deleteItem,
    clearCompleted,
    clearAll,
  } = useShoppingList();

  const handleAddItem = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    try {
      const validatedItem = insertShoppingItemSchema.parse({ name: trimmedValue });
      addItem(validatedItem);
      setInputValue("");
    } catch (error) {
      console.error("Invalid item:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  const showEmptyState = totalCount === 0;

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-700 mb-2">
          <ShoppingCart className="inline-block w-6 h-6 text-primary mr-2" />
          Lista de Compras
        </h1>
        <p className="text-slate-500 text-sm">Organize suas compras de forma simples</p>
      </div>

      {/* Add Item Form */}
      <div className="mb-6">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Digite o nome do produto..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-700 placeholder-slate-400"
              />
              <Button
                onClick={handleAddItem}
                className="px-6 py-3 bg-primary hover:bg-indigo-600 text-white font-medium transition-colors duration-200 min-w-[80px]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping List */}
      <div className="space-y-3">
        {/* Empty State */}
        {showEmptyState && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <ListTodo className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-slate-500 text-lg font-medium mb-2">Sua lista está vazia</p>
            <p className="text-slate-400 text-sm">Adicione seu primeiro item acima</p>
          </div>
        )}

        {/* Items Counter */}
        {!showEmptyState && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 font-medium">
              {totalCount} itens na lista
            </span>
            <span className="text-emerald-600 font-medium">
              {completedCount} comprados
            </span>
          </div>
        )}

        {/* Shopping Items List */}
        {!showEmptyState && (
          <div className="space-y-2">
            {/* Pending Items */}
            {pendingItems.map((item) => (
              <Card key={item.id} className="shadow-sm border-slate-200 transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleItem(item.id)}
                      className="w-6 h-6 p-0 border-2 border-slate-300 rounded-full hover:border-primary transition-colors duration-200"
                    >
                      <Check className="w-3 h-3 text-primary opacity-0" />
                    </Button>
                    <span className="flex-1 text-slate-700 font-medium">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="w-8 h-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Completed Items */}
            {completedItems.map((item) => (
              <Card key={item.id} className="bg-slate-50 border-slate-200 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleItem(item.id)}
                      className="w-6 h-6 p-0 bg-emerald-500 border-2 border-emerald-500 rounded-full hover:bg-emerald-600 transition-colors duration-200"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </Button>
                    <span className="flex-1 text-slate-500 line-through font-medium">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="w-8 h-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {!showEmptyState && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex gap-3">
            <Button
              onClick={clearCompleted}
              variant="secondary"
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors duration-200"
              disabled={completedCount === 0}
            >
              <Fan className="w-4 h-4 mr-2" />
              Limpar comprados
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex-1 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors duration-200"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Limpar tudo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar toda a lista?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os itens da sua lista de compras serão removidos permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll} className="bg-red-600 hover:bg-red-700">
                    Sim, limpar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
