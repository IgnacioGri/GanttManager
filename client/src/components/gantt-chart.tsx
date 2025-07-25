import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ZoomOut, ZoomIn, Maximize, MessageCircle, Paperclip, Edit3, Trash2 } from "lucide-react";
import { createGanttTasks } from "@/lib/gantt-utils";
import { formatDate } from "@/lib/date-utils";
import type { ProjectWithTasks, Task } from "@shared/schema";

interface GanttChartProps {
  project?: ProjectWithTasks;
  timelineScale: "Day" | "Week" | "Month";
  showWeekends: boolean;
  onEditTask: (task: Task) => void;
  onAddComment: (task: Task) => void;
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: number) => void;
  isCollapsed: boolean;
}

declare global {
  interface Window {
    Gantt: any;
  }
}

export function GanttChart({ project, timelineScale, showWeekends, onEditTask, onAddComment, onTaskUpdate, onDeleteTask, isCollapsed }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);

  const handleDateChange = (taskId: string, start: Date, end: Date) => {
    const id = parseInt(taskId);
    
    // Ensure we're working with dates at midnight UTC to avoid timezone issues
    const startUTC = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    // Subtract one day from end date since Frappe Gantt treats end as exclusive
    const endUTC = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
    
    const startDate = startUTC.toISOString().split('T')[0];
    const endDate = endUTC.toISOString().split('T')[0];
    
    // Calculate duration correctly
    const duration = Math.ceil((endUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    onTaskUpdate(id, { 
      startDate, 
      endDate,
      duration
    });
    
    // Update dependent tasks when a parent task's dates change
    if (project) {
      const dependentTasks = project.tasks.filter(task => 
        task.dependencies.includes(taskId)
      );
      
      dependentTasks.forEach(depTask => {
        const newStartDate = new Date(endUTC);
        newStartDate.setDate(newStartDate.getDate() + 1); // Start the day after dependency ends
        
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + depTask.duration - 1);
        
        onTaskUpdate(depTask.id, {
          startDate: newStartDate.toISOString().split('T')[0],
          endDate: newEndDate.toISOString().split('T')[0]
        });
      });
    }
  };

  const handleProgressChange = (taskId: string, progress: number) => {
    const id = parseInt(taskId);
    onTaskUpdate(id, { progress });
    
    // Update bar opacity immediately
    setTimeout(() => {
      const task = project?.tasks.find(t => t.id === id);
      if (task) {
        const index = project?.tasks.findIndex(t => t.id === id) || 0;
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];
        const baseColor = colors[index % colors.length];
        const opacity = 1.0 - (progress / 100) * 0.7;
        
        const taskBar = ganttRef.current?.querySelector(`[data-id="${taskId}"] .bar`);
        if (taskBar) {
          const r = parseInt(baseColor.slice(1, 3), 16);
          const g = parseInt(baseColor.slice(3, 5), 16);
          const b = parseInt(baseColor.slice(5, 7), 16);
          (taskBar as HTMLElement).style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
      }
    }, 50);
  };

  useEffect(() => {
    if (!ganttRef.current || !project?.tasks.length) return;

    // Clear previous instance
    if (ganttInstance.current) {
      ganttInstance.current = null;
    }

    const tasks = createGanttTasks(project.tasks);

    try {
      ganttInstance.current = new window.Gantt(ganttRef.current, tasks, {
        view_mode: timelineScale,
        date_format: 'YYYY-MM-DD',
        language: 'en',
        show_weekends: showWeekends,
        readonly: false,
        on_click: (task: any) => {
          const originalTask = project.tasks.find(t => t.id.toString() === task.id);
          if (originalTask) {
            onEditTask(originalTask);
          }
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          // Update task dates when dragged in Gantt
          handleDateChange(task.id, start, end);
        },
        on_progress_change: (task: any, progress: number) => {
          // Update task progress when changed in Gantt
          handleProgressChange(task.id, progress);
        }
      });
      
      // Apply custom colors with progress-based transparency after initialization
      setTimeout(() => {
        project.tasks.forEach((task, index) => {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];
          const baseColor = colors[index % colors.length];
          
          // Calculate opacity based on progress: 0% = solid (1.0), 100% = very transparent (0.3)
          const opacity = 1.0 - (task.progress / 100) * 0.7;
          
          const taskBar = ganttRef.current?.querySelector(`[data-id="${task.id}"] .bar`);
          if (taskBar) {
            // Convert hex to rgba with calculated opacity
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            (taskBar as HTMLElement).style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }
        });
      }, 100);
      
    } catch (error) {
      console.error('Failed to initialize Gantt chart:', error);
    }

    return () => {
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, [project, timelineScale, showWeekends]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Project Selected</h2>
          <p className="text-slate-600">Please select a project to view its Gantt chart.</p>
        </div>
      </div>
    );
  }

  if (!project.tasks.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Tasks</h2>
          <p className="text-slate-600">Add some tasks to see the Gantt chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Gantt Chart</h2>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative">
        {/* Task list on the left */}
        <div className={`absolute top-0 left-0 ${isCollapsed ? 'w-80' : 'w-[480px]'} bg-white border-r border-slate-200 h-full overflow-y-auto z-10 transition-all duration-300`}>
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sticky top-0 h-[52px] flex items-center">
            <span className="text-sm font-medium text-slate-700">Task Name</span>
            <div className="ml-auto text-xs text-slate-500">Start - End</div>
          </div>
          {project.tasks.map((task, index) => (
            <div key={task.id} className="border-b border-slate-100 hover:bg-slate-50 group">
              <div className="px-3 py-2 h-[52px] flex items-center text-sm">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0 mr-4">
                    <div 
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary"
                      onClick={() => onEditTask(task)}
                      title="Click to edit task"
                    >
                      {task.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 whitespace-nowrap">
                    <span>{formatDate(task.startDate)}</span>
                    <span>-</span>
                    <span>{formatDate(task.endDate)}</span>
                    <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.comments && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Has comments" />
                      )}
                      {task.attachments.length > 0 && (
                        <div className="w-2 h-2 bg-amber-500 rounded-full" title="Has attachments" />
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-5 h-5 text-slate-400 hover:text-primary"
                        onClick={() => onAddComment(task)}
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-5 h-5 text-slate-400 hover:text-primary"
                        onClick={() => onEditTask(task)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-5 h-5 text-slate-400 hover:text-red-500"
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Gantt chart container */}
        <div className={`${isCollapsed ? 'ml-80' : 'ml-[480px]'} h-full transition-all duration-300`}>
          <div ref={ganttRef} className="gantt-container h-full overflow-auto"></div>
        </div>
      </div>
    </div>
  );
}
