import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, insertTagSchema, updateTaskSchema } from "@shared/schema";

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
  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      const projectsWithTasks = await Promise.all(
        projects.map(async (project) => {
          const tasks = await storage.getTasksByProject(project.id);
          return { ...project, tasks };
        })
      );
      res.json(projectsWithTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProjectWithTasks(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('PATCH project', id, 'with data:', req.body);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
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

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Tasks
  app.get("/api/projects/:projectId/tasks", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tasks = await storage.getTasksByProject(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateTaskSchema.parse({ ...req.body, id });
      const task = await storage.updateTask(validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Update synced tasks when a reference task is modified
      const allTasks = await storage.getTasksByProject(task.projectId);
      console.log("=== SYNC UPDATE DEBUG ===");
      console.log("Updated task ID:", id);
      console.log("All tasks in project:", allTasks.map(t => ({ id: t.id, name: t.name, syncedTaskId: t.syncedTaskId, syncType: t.syncType })));
      
      const syncedTasks = allTasks.filter(t => 
        t.syncedTaskId && t.syncedTaskId === id && t.id !== id
      );
      console.log("Found synced tasks:", syncedTasks.length);

      for (const syncedTask of syncedTasks) {
        let updatedData: any = {};
        
        switch (syncedTask.syncType) {
          case "start-start":
            updatedData = {
              id: syncedTask.id,
              startDate: task.startDate,
              endDate: calculateEndDateFromDuration(task.startDate, syncedTask.duration),
              skipWeekends: task.skipWeekends,
              autoAdjustWeekends: task.autoAdjustWeekends
            };
            break;
          case "end-end":
            updatedData = {
              id: syncedTask.id,
              endDate: task.endDate,
              startDate: calculateStartDateFromEndAndDuration(task.endDate, syncedTask.duration),
              skipWeekends: task.skipWeekends,
              autoAdjustWeekends: task.autoAdjustWeekends
            };
            break;
          case "start-end-together":
            const newDuration = calculateDurationFromDates(task.startDate, task.endDate);
            updatedData = {
              id: syncedTask.id,
              startDate: task.startDate,
              endDate: task.endDate,
              duration: newDuration,
              skipWeekends: task.skipWeekends,
              autoAdjustWeekends: task.autoAdjustWeekends
            };
            break;
        }
        
        if (Object.keys(updatedData).length > 1) { // More than just id
          console.log("Updating synced task:", syncedTask.name, "with data:", updatedData);
          await storage.updateTask(updatedData);
          console.log("✅ Synced task updated successfully");
        }
      }

      res.json(task);
    } catch (error) {
      console.error('Task update error:', error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First, get the task to know which project it belongs to
      const taskToDelete = await storage.getTask(id);
      if (!taskToDelete) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Get all tasks in the project to fix dependencies
      const allTasks = await storage.getTasksByProject(taskToDelete.projectId);
      
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
        });
      }
      
      // Delete the task
      const deleted = await storage.deleteTask(id);
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
  app.get("/api/projects/:projectId/tags", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tags = await storage.getProjectTags(projectId);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/projects/:projectId/tags", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const validatedData = insertTagSchema.parse({ ...req.body, projectId });
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.put("/api/tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTagSchema.partial().parse(req.body);
      const tag = await storage.updateTag(id, validatedData);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.delete("/api/tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTag(id);
      if (!success) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
