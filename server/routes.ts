import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, updateTaskSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
      res.json(task);
    } catch (error) {
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
      
      // Find tasks that depend on the task being deleted
      const dependentTasks = allTasks.filter(task => 
        task.dependencyType === 'dependent' && task.dependentTaskId === id
      );
      
      // Update dependent tasks
      for (const dependentTask of dependentTasks) {
        // Find the previous task (the one that the deleted task depended on)
        const deletedTaskDependency = taskToDelete.dependentTaskId;
        
        if (deletedTaskDependency) {
          // Make the dependent task depend on the deleted task's dependency
          await storage.updateTask({
            id: dependentTask.id,
            dependentTaskId: deletedTaskDependency,
            dependencyType: 'dependent'
          });
        } else {
          // If deleted task had no dependency, switch dependent tasks to manual
          await storage.updateTask({
            id: dependentTask.id,
            dependencyType: 'manual',
            dependentTaskId: null
          });
        }
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

  const httpServer = createServer(app);
  return httpServer;
}
