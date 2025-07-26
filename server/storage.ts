import { projects, tasks, type Project, type Task, type InsertProject, type InsertTask, type UpdateTask, type ProjectWithTasks } from "@shared/schema";

export interface IStorage {
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjectWithTasks(id: number): Promise<ProjectWithTasks | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(data: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private currentProjectId: number;
  private currentTaskId: number;

  constructor() {
    this.projects = new Map();
    this.tasks = new Map();
    this.currentProjectId = 1;
    this.currentTaskId = 1;
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample project
    const sampleProject: Project = {
      id: 1,
      name: "Website Development Project",
      startDate: "2024-01-15",
      endDate: "2024-03-15",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(1, sampleProject);
    this.currentProjectId = 2;

    // Create sample tasks
    const sampleTasks: Task[] = [
      {
        id: 1,
        projectId: 1,
        name: "Project Planning & Requirements",
        startDate: "2024-01-15",
        endDate: "2024-01-22",
        duration: 5,
        progress: 100,
        dependencies: [],
        comments: "Initial project setup and requirement gathering completed successfully.",
        attachments: [],
        skipWeekends: true,
        autoAdjustWeekends: true,
        syncedTaskId: null,
        syncType: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        projectId: 1,
        name: "UI/UX Design",
        startDate: "2024-01-23",
        endDate: "2024-02-05",
        duration: 10,
        progress: 75,
        dependencies: ["1"],
        comments: "Design mockups are 75% complete. Need client feedback on color scheme.",
        attachments: [],
        skipWeekends: true,
        autoAdjustWeekends: true,
        syncedTaskId: null,
        syncType: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        projectId: 1,
        name: "Frontend Development",
        startDate: "2024-02-06",
        endDate: "2024-02-26",
        duration: 15,
        progress: 45,
        dependencies: ["2"],
        comments: "Started implementing responsive layouts. Making good progress.",
        attachments: [],
        skipWeekends: true,
        autoAdjustWeekends: true,
        syncedTaskId: null,
        syncType: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        projectId: 1,
        name: "Backend Development",
        startDate: "2024-02-12",
        endDate: "2024-03-05",
        duration: 15,
        progress: 30,
        dependencies: ["1"],
        comments: "API endpoints development in progress. Database schema finalized.",
        attachments: [],
        skipWeekends: true,
        autoAdjustWeekends: true,
        syncedTaskId: null,
        syncType: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        projectId: 1,
        name: "Testing & QA",
        startDate: "2024-02-27",
        endDate: "2024-03-10",
        duration: 8,
        progress: 0,
        dependencies: ["3", "4"],
        comments: "",
        attachments: [],
        skipWeekends: true,
        autoAdjustWeekends: true,
        syncedTaskId: null,
        syncType: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        projectId: 1,
        name: "Deployment & Launch",
        startDate: "2024-03-11",
        endDate: "2024-03-15",
        duration: 3,
        progress: 0,
        dependencies: ["5"],
        comments: "",
        attachments: [],
        skipWeekends: true,
        autoAdjustWeekends: true,
        syncedTaskId: null,
        syncType: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleTasks.forEach(task => this.tasks.set(task.id, task));
    this.currentTaskId = 7;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectWithTasks(id: number): Promise<ProjectWithTasks | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const projectTasks = Array.from(this.tasks.values()).filter(task => task.projectId === id);
    return { ...project, tasks: projectTasks };
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { 
      ...project, 
      ...projectData,
      updatedAt: new Date()
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Delete associated tasks
    const projectTasks = Array.from(this.tasks.entries()).filter(([_, task]) => task.projectId === id);
    projectTasks.forEach(([taskId]) => this.tasks.delete(taskId));
    
    return this.projects.delete(id);
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.projectId === projectId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask,
      progress: insertTask.progress ?? 0,
      dependencies: insertTask.dependencies ?? [],
      comments: insertTask.comments ?? "",
      attachments: Array.isArray(insertTask.attachments) ? insertTask.attachments : [],
      skipWeekends: insertTask.skipWeekends ?? true,
      autoAdjustWeekends: insertTask.autoAdjustWeekends ?? true,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(data: UpdateTask): Promise<Task | undefined> {
    const { id, ...updateData } = data;
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = { 
      ...task, 
      ...updateData,
      attachments: Array.isArray(updateData.attachments) ? updateData.attachments : task.attachments,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    
    // If this task's dates changed, update any synced tasks
    if ((updateData.startDate && updateData.startDate !== task.startDate) || 
        (updateData.endDate && updateData.endDate !== task.endDate)) {
      await this.updateSyncedTasks(id);
    }
    
    return updatedTask;
  }

  // Helper method to update tasks that are synced to this task
  private async updateSyncedTasks(sourceTaskId: number): Promise<void> {
    const sourceTask = this.tasks.get(sourceTaskId);
    if (!sourceTask) return;

    // Find all tasks that are synced to this source task
    const syncedTasks = Array.from(this.tasks.values()).filter(task => 
      task.syncedTaskId === sourceTaskId && task.syncType
    );

    for (const syncedTask of syncedTasks) {
      const updates = this.calculateSyncedDates(sourceTask, syncedTask.syncType);
      if (updates) {
        const updatedSyncedTask: Task = {
          ...syncedTask,
          ...updates,
          updatedAt: new Date()
        };
        this.tasks.set(syncedTask.id, updatedSyncedTask);
      }
    }
  }

  // Calculate new dates based on sync type
  private calculateSyncedDates(sourceTask: Task, syncType: string): { startDate?: string; endDate?: string } | null {
    switch (syncType) {
      case "start-start":
        // Both tasks start on the same day
        return { startDate: sourceTask.startDate };
      
      case "end-end":
        // Both tasks end on the same day
        return { endDate: sourceTask.endDate };
      
      case "start-end":
        // Synced task starts when source task ends
        return { startDate: sourceTask.endDate };
      
      case "end-start":
        // Synced task ends when source task starts
        return { endDate: sourceTask.startDate };
      
      default:
        return null;
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    const taskToDelete = this.tasks.get(id);
    if (!taskToDelete) return false;
    
    // Find all tasks that depend on this task
    const dependentTasks = Array.from(this.tasks.values()).filter(task => 
      task.dependencies.includes(id.toString())
    );
    
    // For each dependent task, update its dependencies according to user's requirement
    dependentTasks.forEach(task => {
      // Remove the deleted task from dependencies
      task.dependencies = task.dependencies.filter(depId => depId !== id.toString());
      
      // Find tasks from the same project, sorted by start date
      const projectTasks = Array.from(this.tasks.values())
        .filter(t => t.projectId === task.projectId && t.id !== id)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      // Find the task that comes before the deleted task in chronological order
      const deletedTaskStartDate = new Date(taskToDelete.startDate);
      const previousTask = projectTasks
        .filter(t => new Date(t.startDate) < deletedTaskStartDate)
        .pop(); // Get the last one (closest to the deleted task)
      
      if (previousTask) {
        // Make it depend on the previous task
        task.dependencies = [previousTask.id.toString()];
      } else {
        // No previous task found, convert to manual mode (no dependencies)
        task.dependencies = [];
      }
      
      task.updatedAt = new Date();
      this.tasks.set(task.id, task);
    });
    
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
