import { z } from "zod";
import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Database table definition
export const shoppingItems = pgTable("shopping_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertShoppingItemSchema = createInsertSchema(shoppingItems).omit({
  id: true,
  completed: true,
  createdAt: true,
});

export const shoppingItemSchema = createSelectSchema(shoppingItems);

// Types
export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
