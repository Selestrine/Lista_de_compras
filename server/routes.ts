import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShoppingItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Shopping Items API routes
  
  // Get all shopping items
  app.get("/api/shopping-items", async (req, res) => {
    try {
      const items = await storage.getAllShoppingItems();
      res.json(items);
    } catch (error) {
      console.error(`Error fetching shopping items:`, error);
      res.status(500).json({ error: "Failed to fetch shopping items" });
    }
  });

  // Create a new shopping item
  app.post("/api/shopping-items", async (req, res) => {
    try {
      const validatedData = insertShoppingItemSchema.parse(req.body);
      const newItem = await storage.createShoppingItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error(`Error creating shopping item:`, error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: "Invalid item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create shopping item" });
      }
    }
  });

  // Update a shopping item
  app.patch("/api/shopping-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const updatedItem = await storage.updateShoppingItem(id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ error: "Shopping item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error(`Error updating shopping item:`, error);
      res.status(500).json({ error: "Failed to update shopping item" });
    }
  });

  // Delete a shopping item
  app.delete("/api/shopping-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const success = await storage.deleteShoppingItem(id);
      if (!success) {
        return res.status(404).json({ error: "Shopping item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting shopping item:`, error);
      res.status(500).json({ error: "Failed to delete shopping item" });
    }
  });

  // Clear completed items
  app.delete("/api/shopping-items/completed", async (req, res) => {
    try {
      const deletedCount = await storage.clearCompletedItems();
      res.json({ deletedCount });
    } catch (error) {
      console.error(`Error clearing completed items:`, error);
      res.status(500).json({ error: "Failed to clear completed items" });
    }
  });

  // Clear all items
  app.delete("/api/shopping-items", async (req, res) => {
    try {
      const deletedCount = await storage.clearAllItems();
      res.json({ deletedCount });
    } catch (error) {
      console.error(`Error clearing all items:`, error);
      res.status(500).json({ error: "Failed to clear all items" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
