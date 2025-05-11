import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table and schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// World table and schema
export const worlds = pgTable("worlds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorldSchema = createInsertSchema(worlds).pick({
  userId: true,
  name: true,
  description: true,
});

// Character table and schema
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  appearance: text("appearance"),
  personality: text("personality").notNull(),
  backstory: text("backstory"),
  memory: jsonb("memory").default({}).notNull(), // Store character memory as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCharacterSchema = createInsertSchema(characters).pick({
  worldId: true,
  name: true,
  role: true,
  appearance: true,
  personality: true,
  backstory: true,
  memory: true,
});

// Scene table and schema
export const scenes = pgTable("scenes", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  styleType: text("style_type"), // Novel, Script, etc.
  tone: text("tone"), // Dramatic, Humorous, etc.
  includedCharacters: jsonb("included_characters").default([]).notNull(), // Array of character IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSceneSchema = createInsertSchema(scenes).pick({
  worldId: true,
  title: true,
  content: true,
  styleType: true,
  tone: true,
  includedCharacters: true,
});

// Chat messages table and schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull(),
  userId: integer("user_id").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  characterId: true,
  userId: true,
  isUserMessage: true,
  content: true,
});

// Activity log table and schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull(),
  activityType: text("activity_type").notNull(), // CHARACTER_CREATED, SCENE_CREATED, WORLD_UPDATED, CHARACTER_CHAT
  entityId: integer("entity_id"), // ID of the related entity (character, scene, etc.)
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  worldId: true,
  activityType: true,
  entityId: true,
  description: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type World = typeof worlds.$inferSelect;
export type InsertWorld = z.infer<typeof insertWorldSchema>;

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = z.infer<typeof insertSceneSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
