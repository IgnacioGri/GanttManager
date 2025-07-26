import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  startDate: true,
  endDate: true,
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
});

export const updateTaskSchema = insertTaskSchema.partial().extend({
  id: z.number(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export interface ProjectWithTasks extends Project {
  tasks: Task[];
}
