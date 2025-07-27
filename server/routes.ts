import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, insertTagSchema, updateTaskSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAuth, isAuthenticated } from "./replitAuth";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Date calculation utilities for server-side sync updates
function parseInputDate(dateStr: string): Date {
  return new Date(dateStr + 'T03:00:00.000Z');
}

function calculateEndDateFromDuration(startDate: string, duration: number): string {
  const start = parseInputDate(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + duration - 1);
  return end.toISOString().split('T')[0];
}

function calculateStartDateFromEndAndDuration(endDate: string, duration: number): string {
  const end = parseInputDate(endDate);
  const start = new Date(end);
  start.setDate(end.getDate() - duration + 1);
  return start.toISOString().split('T')[0];
}

function calculateDurationFromDates(startDate: string, endDate: string): number {
  const start = parseInputDate(startDate);
  const end = parseInputDate(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Projects
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getAllProjects(userId);
      const projectsWithTasks = await Promise.all(
        projects.map(async (project) => {
          const tasks = await storage.getTasksByProject(project.id, userId);
          return { ...project, tasks };
        })
      );
      res.json(projectsWithTasks);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const project = await storage.getProjectWithTasks(id, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if project name already exists for this user
      const existingProjects = await storage.getAllProjects(userId);
      const duplicateName = existingProjects.find(p => 
        p.name.toLowerCase() === validatedData.name.toLowerCase()
      );
      
      if (duplicateName) {
        return res.status(409).json({ 
          message: "Ya existe un proyecto con ese nombre. Por favor, elige un nombre diferente." 
        });
      }
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, userId, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      console.log('PATCH project', id, 'with data:', req.body);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, userId, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      console.log('Updated project:', project);
      res.json(project);
    } catch (error) {
      console.error('PATCH project error:', error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Tasks
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      const tasks = await storage.getTasksByProject(projectId, userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData, userId);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const validatedData = updateTaskSchema.parse({ ...req.body, id });
      const task = await storage.updateTask(validatedData, userId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      // First, get the task to verify it belongs to user
      const taskToDelete = await storage.getTask(id, userId);
      if (!taskToDelete) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Get all tasks in the project to fix dependencies
      const allTasks = await storage.getTasksByProject(taskToDelete.projectId, userId);
      
      // Remove task ID from dependencies of other tasks
      const dependentTasks = allTasks.filter(task => 
        task.dependencies.includes(id.toString())
      );
      
      // Update dependent tasks by removing the deleted task from their dependencies
      for (const dependentTask of dependentTasks) {
        const updatedDependencies = dependentTask.dependencies.filter(dep => dep !== id.toString());
        await storage.updateTask({
          id: dependentTask.id,
          dependencies: updatedDependencies
        }, userId);
      }
      
      // Delete the task
      const deleted = await storage.deleteTask(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // File upload
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        data: req.file.buffer.toString('base64')
      };

      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "File upload failed" });
    }
  });

  // Tags
  app.get("/api/projects/:projectId/tags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      const tags = await storage.getProjectTags(projectId, userId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/projects/:projectId/tags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      const validatedData = insertTagSchema.parse({ ...req.body, projectId });
      const tag = await storage.createTag(validatedData, userId);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.put("/api/tags/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const validatedData = insertTagSchema.partial().parse(req.body);
      const tag = await storage.updateTag(id, userId, validatedData);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.delete("/api/tags/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const success = await storage.deleteTag(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
