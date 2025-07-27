import { 
  projects, 
  tasks, 
  tags, 
  users,
  type Project, 
  type Task, 
  type Tag, 
  type User,
  type UpsertUser,
  type InsertProject, 
  type InsertTask, 
  type InsertTag, 
  type UpdateTask, 
  type ProjectWithTasks 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Projects
  getProject(id: number, userId: string): Promise<Project | undefined>;
  getProjectWithTasks(id: number, userId: string): Promise<ProjectWithTasks | undefined>;
  getAllProjects(userId: string): Promise<Project[]>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  updateProject(id: number, userId: string, projectData: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number, userId: string): Promise<boolean>;
  
  // Tasks
  getTask(id: number, userId: string): Promise<Task | undefined>;
  getTasksByProject(projectId: number, userId: string): Promise<Task[]>;
  createTask(task: InsertTask, userId: string): Promise<Task>;
  updateTask(data: UpdateTask, userId: string): Promise<Task | undefined>;
  deleteTask(id: number, userId: string): Promise<boolean>;
  
  // Tags
  getProjectTags(projectId: number, userId: string): Promise<Tag[]>;
  createTag(tag: InsertTag, userId: string): Promise<Tag>;
  updateTag(id: number, userId: string, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Projects
  async getProject(id: number, userId: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project;
  }

  async getProjectWithTasks(id: number, userId: string): Promise<ProjectWithTasks | undefined> {
    const project = await this.getProject(id, userId);
    if (!project) return undefined;
    
    const projectTasks = await this.getTasksByProject(id, userId);
    const projectTags = await this.getProjectTags(id, userId);
    return { ...project, tasks: projectTasks, tags: projectTags };
  }

  async getAllProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(insertProject: InsertProject, userId: string): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({ ...insertProject, userId })
      .returning();
    return project;
  }

  async updateProject(id: number, userId: string, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return project;
  }

  async deleteProject(id: number, userId: string): Promise<boolean> {
    // Delete associated tasks first
    await db.delete(tasks).where(
      and(
        eq(tasks.projectId, id),
        eq(tasks.projectId, 
          db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)))
        )
      )
    );
    
    // Delete associated tags
    await db.delete(tags).where(
      and(
        eq(tags.projectId, id),
        eq(tags.projectId, 
          db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)))
        )
      )
    );
    
    // Delete the project
    const result = await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Tasks
  async getTask(id: number, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(
      and(
        eq(tasks.id, id),
        eq(tasks.projectId, 
          db.select({ id: projects.id }).from(projects).where(eq(projects.userId, userId))
        )
      )
    );
    return task;
  }

  async getTasksByProject(projectId: number, userId: string): Promise<Task[]> {
    // Verify project belongs to user first
    const project = await this.getProject(projectId, userId);
    if (!project) return [];
    
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(insertTask: InsertTask, userId: string): Promise<Task> {
    // Verify project belongs to user
    const project = await this.getProject(insertTask.projectId, userId);
    if (!project) throw new Error('Project not found or access denied');
    
    const [task] = await db
      .insert(tasks)
      .values({
        ...insertTask,
        dependencies: insertTask.dependencies ?? [],
        comments: insertTask.comments ?? "",
        attachments: insertTask.attachments || [],
        skipWeekends: insertTask.skipWeekends ?? true,
        autoAdjustWeekends: insertTask.autoAdjustWeekends ?? true,
        tagIds: insertTask.tagIds ?? [],
      })
      .returning();
    return task;
  }

  async updateTask(data: UpdateTask, userId: string): Promise<Task | undefined> {
    const { id, ...updateData } = data;
    
    // Verify task belongs to user's project
    const existingTask = await this.getTask(id, userId);
    if (!existingTask) return undefined;
    
    const [task] = await db
      .update(tasks)
      .set({ 
        ...updateData,
        attachments: Array.isArray(updateData.attachments) ? updateData.attachments : existingTask.attachments,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    // If this task's dates changed, update any synced tasks
    if ((updateData.startDate && updateData.startDate !== existingTask.startDate) || 
        (updateData.endDate && updateData.endDate !== existingTask.endDate)) {
      await this.updateSyncedTasks(id, userId);
    }
    
    return task;
  }

  async deleteTask(id: number, userId: string): Promise<boolean> {
    // Verify task belongs to user's project
    const task = await this.getTask(id, userId);
    if (!task) return false;
    
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Helper method to update tasks that are synced to this task
  private async updateSyncedTasks(sourceTaskId: number, userId: string): Promise<void> {
    const sourceTask = await this.getTask(sourceTaskId, userId);
    if (!sourceTask) return;

    // Find all tasks that are synced to this source task in user's projects
    const userProjects = await this.getAllProjects(userId);
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) return;
    
    const syncedTasks = await db.select().from(tasks).where(
      and(
        eq(tasks.syncedTaskId, sourceTaskId),
        // Make sure synced tasks belong to user's projects
      )
    );

    for (const syncedTask of syncedTasks) {
      const updates = this.calculateSyncedDates(sourceTask, syncedTask.syncType);
      if (updates) {
        await db.update(tasks)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(tasks.id, syncedTask.id));
      }
    }
  }

  // Calculate new dates based on sync type
  private calculateSyncedDates(sourceTask: Task, syncType: string | null): { startDate?: string; endDate?: string } | null {
    if (!syncType) return null;
    
    switch (syncType) {
      case "start-start":
        return { startDate: sourceTask.startDate };
      case "end-end":
        return { endDate: sourceTask.endDate };
      case "start-end":
        return { startDate: sourceTask.endDate };
      case "end-start":
        return { endDate: sourceTask.startDate };
      default:
        return null;
    }
  }

  // Tags
  async getProjectTags(projectId: number, userId: string): Promise<Tag[]> {
    // Verify project belongs to user
    const project = await this.getProject(projectId, userId);
    if (!project) return [];
    
    return await db.select().from(tags).where(eq(tags.projectId, projectId));
  }

  async createTag(insertTag: InsertTag, userId: string): Promise<Tag> {
    // Verify project belongs to user
    const project = await this.getProject(insertTag.projectId, userId);
    if (!project) throw new Error('Project not found or access denied');
    
    const [tag] = await db
      .insert(tags)
      .values(insertTag)
      .returning();
    return tag;
  }

  async updateTag(id: number, userId: string, tagData: Partial<InsertTag>): Promise<Tag | undefined> {
    // First get the tag to verify it belongs to user's project
    const [existingTag] = await db.select().from(tags).where(eq(tags.id, id));
    if (!existingTag) return undefined;
    
    const project = await this.getProject(existingTag.projectId, userId);
    if (!project) return undefined;
    
    const [tag] = await db
      .update(tags)
      .set(tagData)
      .where(eq(tags.id, id))
      .returning();
    return tag;
  }

  async deleteTag(id: number, userId: string): Promise<boolean> {
    // First get the tag to verify it belongs to user's project
    const [existingTag] = await db.select().from(tags).where(eq(tags.id, id));
    if (!existingTag) return false;
    
    const project = await this.getProject(existingTag.projectId, userId);
    if (!project) return false;
    
    const result = await db.delete(tags).where(eq(tags.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();