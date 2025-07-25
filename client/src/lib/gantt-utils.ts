import type { Task } from "@shared/schema";

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

export function createGanttTasks(tasks: Task[]): GanttTask[] {
  return tasks.map(task => {
    // Parse dates consistently - Frappe Gantt treats end date as exclusive
    // So if we want the bar to end on the actual end date, we need to add one day
    const startDate = new Date(task.startDate + 'T00:00:00');
    const endDate = new Date(task.endDate + 'T00:00:00');
    
    // Add one day to end date for Frappe Gantt since it treats end date as exclusive
    const ganttEndDate = new Date(endDate);
    ganttEndDate.setDate(ganttEndDate.getDate() + 1);
    
    return {
      id: task.id.toString(),
      name: task.name,
      start: startDate.toISOString().split('T')[0],
      end: ganttEndDate.toISOString().split('T')[0],
      progress: task.progress,
      dependencies: task.dependencies.join(','),
      custom_class: getTaskColorClass(task.progress)
    };
  });
}

function getTaskColorClass(progress: number): string {
  if (progress === 0) return 'gantt-task-not-started';
  if (progress < 50) return 'gantt-task-in-progress';
  if (progress < 100) return 'gantt-task-almost-done';
  return 'gantt-task-completed';
}

export function calculateTaskDuration(startDate: string, endDate: string, skipWeekends: boolean = true): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (!skipWeekends) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  let duration = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      duration++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return duration;
}

export function validateTaskDates(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
}

export function findCircularDependencies(tasks: Task[]): string[] {
  const errors: string[] = [];
  const visited = new Set<number>();
  const visiting = new Set<number>();
  
  function hasCycle(taskId: number): boolean {
    if (visiting.has(taskId)) return true;
    if (visited.has(taskId)) return false;
    
    visiting.add(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      for (const depId of task.dependencies) {
        const depTaskId = parseInt(depId);
        if (hasCycle(depTaskId)) {
          errors.push(`Circular dependency detected involving task: ${task.name}`);
          return true;
        }
      }
    }
    
    visiting.delete(taskId);
    visited.add(taskId);
    return false;
  }
  
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      hasCycle(task.id);
    }
  }
  
  return errors;
}
