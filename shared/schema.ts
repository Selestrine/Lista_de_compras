import { z } from "zod";

export const insertShoppingItemSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório").max(100, "Nome muito longo"),
});

export const shoppingItemSchema = insertShoppingItemSchema.extend({
  id: z.number(),
  completed: z.boolean(),
  createdAt: z.string(),
});

export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
