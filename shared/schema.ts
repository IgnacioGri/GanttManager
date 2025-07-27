import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from 'drizzle-orm';

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // Associate projects with users
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(), // Hex color code
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  duration: integer("duration").notNull(),
  progress: integer("progress").default(0).notNull(),
  dependencies: text("dependencies").array().default([]).notNull(),
  comments: text("comments").default("").notNull(),
  attachments: json("attachments").$type<{name: string, size: number, type: string, data: string}[]>().default([]).notNull(),
  skipWeekends: boolean("skip_weekends").default(true).notNull(),
  autoAdjustWeekends: boolean("auto_adjust_weekends").default(true).notNull(),
  // Date synchronization fields
  syncedTaskId: integer("synced_task_id"), // ID of the task to sync with
  syncType: text("sync_type"), // "start-start" | "end-end" | "start-end" | "end-start"
  // Tags
  tagIds: integer("tag_ids").array().default([]).notNull(), // Array of tag IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  userId: true,
  name: true,
  startDate: true,
  endDate: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertTagSchema = createInsertSchema(tags).pick({
  projectId: true,
  name: true,
  color: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  projectId: true,
  name: true,
  startDate: true,
  endDate: true,
  duration: true,
  progress: true,
  dependencies: true,
  comments: true,
  attachments: true,
  skipWeekends: true,
  autoAdjustWeekends: true,
  syncedTaskId: true,
  syncType: true,
  tagIds: true,
});

export const updateTaskSchema = insertTaskSchema.partial().extend({
  id: z.number(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export interface ProjectWithTasks extends Project {
  tasks: Task[];
  tags: Tag[];
}
