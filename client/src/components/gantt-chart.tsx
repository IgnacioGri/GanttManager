import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ZoomOut, ZoomIn, Maximize, MessageCircle, Paperclip, Edit3 } from "lucide-react";
import { createGanttTasks } from "@/lib/gantt-utils";
import type { ProjectWithTasks, Task } from "@shared/schema";

interface GanttChartProps {
  project?: ProjectWithTasks;
  timelineScale: "Day" | "Week" | "Month";
  showWeekends: boolean;
  onEditTask: (task: Task) => void;
  onAddComment: (task: Task) => void;
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void;
}

declare global {
  interface Window {
    Gantt: any;
  }
}

export function GanttChart({ project, timelineScale, showWeekends, onEditTask, onAddComment, onTaskUpdate }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);

  const handleDateChange = (taskId: string, start: Date, end: Date) => {
    const id = parseInt(taskId);
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];
    
    onTaskUpdate(id, { 
      startDate, 
      endDate,
      duration: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    });
  };

  const handleProgressChange = (taskId: string, progress: number) => {
    const id = parseInt(taskId);
    onTaskUpdate(id, { progress });
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
        <div className="absolute top-0 left-0 w-80 bg-white border-r border-slate-200 h-full overflow-y-auto z-10">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sticky top-0">
            <span className="text-sm font-medium text-slate-700">Task Name</span>
          </div>
          {project.tasks.map((task, index) => (
            <div key={task.id} className="border-b border-slate-100 hover:bg-slate-50 group">
              <div className="px-3 py-2 h-12 flex items-center text-sm">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-slate-900 truncate cursor-pointer hover:text-primary"
                      onClick={() => onEditTask(task)}
                      title="Click to edit task"
                    >
                      {task.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 ml-2">
                    <span>{task.startDate}</span>
                    <span>-</span>
                    <span>{task.endDate}</span>
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Gantt chart container */}
        <div className="ml-80 h-full">
          <div ref={ganttRef} className="gantt-container h-full overflow-auto"></div>
        </div>
      </div>
    </div>
  );
}
