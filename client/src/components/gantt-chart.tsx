import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ZoomOut, ZoomIn, Maximize, MessageCircle, Paperclip, Edit3, Trash2, Minimize, MoreHorizontal } from "lucide-react";
import { createGanttTasks } from "@/lib/gantt-utils";
import { formatDate } from "@/lib/date-utils";
import type { ProjectWithTasks, Task, Tag } from "@shared/schema";
import TaskTags from "@/components/task-tags";

type TaskFilter = "all" | "pending" | "in-progress" | "completed";

interface GanttChartProps {
  project?: ProjectWithTasks;
  timelineScale: "Day" | "Week" | "Month";
  onEditTask: (task: Task) => void;
  onAddComment: (task: Task) => void;
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: number) => void;
  isCollapsed: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onTimelineScaleChange: (scale: "Day" | "Week" | "Month") => void;
}

declare global {
  interface Window {
    Gantt: any;
  }
}

export function GanttChart({ project, timelineScale, onEditTask, onAddComment, onTaskUpdate, onDeleteTask, isCollapsed, isFullScreen = false, onToggleFullScreen, onTimelineScaleChange }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");

  // Get project tags
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/projects", project?.id, "tags"],
    enabled: !!project?.id,
  });

  // Argentine holidays for 2025
  const getArgentineHolidays = () => {
    return [
      '2025-01-01', // New Year's Day
      '2025-02-24', // Carnival Monday
      '2025-02-25', // Carnival Tuesday
      '2025-03-24', // Day of Remembrance for Truth and Justice
      '2025-04-02', // Falklands War Veterans Day
      '2025-04-18', // Good Friday
      '2025-05-01', // Labour Day
      '2025-05-25', // May Revolution
      '2025-06-20', // Flag Day
      '2025-07-09', // Independence Day
      '2025-08-17', // Death of San Martín
      '2025-10-12', // Columbus Day
      '2025-11-20', // National Sovereignty Day
      '2025-12-08', // Immaculate Conception
      '2025-12-25', // Christmas Day
    ];
  };

  const handleDateChange = (taskId: string, start: Date, end: Date) => {
    const id = parseInt(taskId);
    
    // Ensure we're working with dates at midnight UTC to avoid timezone issues
    const startUTC = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endUTC = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
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

  // Function to apply dark mode to Gantt chart - simplified for CSS-based approach
  const applyDarkModeToGantt = () => {
    if (!ganttRef.current) return;
    
    // The CSS handles most of the styling, but we ensure the container has the right background
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) {
      // Just ensure the main container has the dark background
      const ganttElement = ganttRef.current.querySelector('.gantt') as HTMLElement;
      if (ganttElement) {
        ganttElement.style.setProperty('background-color', 'hsl(var(--background))', 'important');
      }
    }
  };

  // Function to create/recreate the Gantt chart
  const createGanttChart = useCallback(() => {
    if (!ganttRef.current || !project?.tasks.length) return;

    console.log('=== GANTT CHART CREATION ===');
    console.log('Timeline scale:', timelineScale);
    
    // COMPLETELY DESTROY the previous instance and clear the container
    if (ganttInstance.current) {
      console.log('Destroying previous Gantt instance');
      ganttInstance.current = null;
    }
    
    // Clear the entire container HTML to force complete re-render
    if (ganttRef.current) {
      ganttRef.current.innerHTML = '';
    }

    const tasks = createGanttTasks(project.tasks);

    try {
      // Custom options for Gantt library
      const ganttOptions: any = {
        view_mode: timelineScale,
        date_format: 'YYYY-MM-DD',
        language: 'en',
        readonly: false,
        show_today_line: true,
        ignore: getArgentineHolidays(),
        holidays: {
          'rgba(255, 0, 0, 0.3)': getArgentineHolidays()
        },
        on_click: (task: any) => {
          const originalTask = project.tasks.find(t => t.id.toString() === task.id);
          if (originalTask) {
            onEditTask(originalTask);
          }
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          handleDateChange(task.id, start, end);
        },
        on_progress_change: (task: any, progress: number) => {
          handleProgressChange(task.id, progress);
        }
      };

      console.log('Creating Gantt instance with options:', ganttOptions);
      ganttInstance.current = new window.Gantt(ganttRef.current, tasks, ganttOptions);
      console.log('✅ Gantt instance created successfully');
      
      // Apply task colors and basic dark mode setup
      setTimeout(() => {
        applyTaskColors();
        applyDarkModeToGantt();
      }, 100);
    } catch (error) {
      console.error('❌ Error creating Gantt chart:', error);
    }
  }, [project?.tasks, timelineScale, onEditTask, handleDateChange, handleProgressChange]);

  // Effect that ALWAYS recreates the chart when dependencies change
  useEffect(() => {
    createGanttChart();
  }, [createGanttChart]);

  // Apply task colors after chart creation
  useEffect(() => {
    if (ganttInstance.current) {
      setTimeout(() => {
        applyTaskColors();
      }, 100);
    }
  }, [project?.tasks]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, []);



  const applyTaskColors = () => {
    if (!ganttRef.current || !project?.tasks) return;
    
    project.tasks.forEach((task, index) => {
      setTimeout(() => {
        // Phase-based colors with dark mode variants
        const getTaskColor = (taskName: string, isDarkMode: boolean = false) => {
          const name = taskName.toLowerCase();
          if (isDarkMode) {
            // Darker variants for dark mode
            if (name.includes('planning') || name.includes('project')) return '#7c3aed'; // Darker purple
            if (name.includes('design') || name.includes('ui') || name.includes('ux')) return '#0891b2'; // Darker cyan
            if (name.includes('development') || name.includes('frontend') || name.includes('backend')) return '#2563eb'; // Darker blue
            if (name.includes('testing') || name.includes('qa')) return '#d97706'; // Darker amber
            if (name.includes('deployment') || name.includes('launch')) return '#059669'; // Darker green
            return '#4f46e5'; // Darker indigo
          } else {
            // Light mode colors
            if (name.includes('planning') || name.includes('project')) return '#8b5cf6'; // Purple
            if (name.includes('design') || name.includes('ui') || name.includes('ux')) return '#06b6d4'; // Cyan
            if (name.includes('development') || name.includes('frontend') || name.includes('backend')) return '#3b82f6'; // Blue
            if (name.includes('testing') || name.includes('qa')) return '#f59e0b'; // Amber
            if (name.includes('deployment') || name.includes('launch')) return '#10b981'; // Green
            return '#6366f1'; // Default indigo
          }
        };
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        const baseColor = getTaskColor(task.name, isDarkMode);
        
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
      }, 50);
    });
  };

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
    <div className={`${isFullScreen ? 'fixed inset-0 bg-background z-50 p-6' : 'h-full'} flex flex-col`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gantt Chart</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">PROJECT TIMELINE</p>
          </div>
          {/* Filter buttons and timeline controls */}
          <div className="flex items-center gap-6 ml-6">
            <div className="flex bg-muted rounded-lg p-1">
              <button 
                onClick={() => setTaskFilter("all")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "all" 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Tasks
              </button>
              <button 
                onClick={() => setTaskFilter("pending")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "pending" 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending
              </button>
              <button 
                onClick={() => setTaskFilter("in-progress")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "in-progress" 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                In Progress
              </button>
              <button 
                onClick={() => setTaskFilter("completed")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "completed" 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Timeline Scale Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Scale:</span>
              <div className="flex bg-muted rounded-lg p-1">
                {(['Day', 'Week', 'Month'] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onTimelineScaleChange(scale)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timelineScale === scale
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>


          </div>
        </div>
        {onToggleFullScreen && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFullScreen}
            className="w-10 h-10 shadow-sm hover:shadow-md transition-all"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 bg-card rounded-lg border border-border shadow-lg overflow-hidden relative">
        {/* Task list on the left - hidden in full screen */}
        {!isFullScreen && (
          <div className={`absolute top-0 left-0 ${isCollapsed ? 'w-80' : 'w-[480px]'} bg-card border-r border-border h-full overflow-y-auto z-10 transition-all duration-300`}>
          <div className="border-b border-border bg-muted px-4 py-3 sticky top-0 h-[52px] flex items-center">
            <div className="w-full flex items-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="flex-1">TASK NAME</div>
              <div className="w-16 text-center">PROGRESS</div>
              <div className="w-20 text-center">START</div>
              <div className="w-20 text-center">END</div>
              <div className="w-10"></div>
            </div>
          </div>
          {project.tasks.filter((task) => {
            if (taskFilter === "all") return true;
            if (taskFilter === "pending") return task.progress === 0;
            if (taskFilter === "in-progress") return task.progress > 0 && task.progress < 100;
            if (taskFilter === "completed") return task.progress === 100;
            return true;
          }).map((task, index) => (
            <div key={task.id} className="hover:bg-accent group transition-colors" data-task-id={task.id}>
              <div className="px-3 h-[52px] flex items-center text-sm border-b border-border">
                <div className="w-full flex items-center">
                  <div className="flex-1 min-w-0 pr-4">
                    <div 
                      className="font-medium text-foreground cursor-pointer hover:text-primary truncate"
                      onClick={() => onEditTask(task)}
                      title="Click to edit task"
                    >
                      {task.name}
                    </div>
                    {task.tagIds && task.tagIds.length > 0 && (
                      <div className="mt-1">
                        <TaskTags tagIds={task.tagIds} tags={tags} maxVisible={3} />
                      </div>
                    )}
                  </div>
                  <div className="w-16 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1 font-medium">{task.progress}%</span>
                    </div>
                  </div>
                  <div className="w-20 text-xs text-muted-foreground text-center">
                    {formatDate(task.startDate)}
                  </div>
                  <div className="w-20 text-xs text-muted-foreground text-center">
                    {formatDate(task.endDate)}
                  </div>
                  <div className="w-10 flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTask(task)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddComment(task)}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Add Comment
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteTask(task.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {(task.comments || task.attachments.length > 0) && (
                      <div className="flex items-center space-x-1 ml-1">
                        {task.comments && (
                          <div className="w-2 h-2 bg-primary rounded-full" title="Has comments" />
                        )}
                        {task.attachments.length > 0 && (
                          <div className="w-2 h-2 bg-amber-500 rounded-full" title="Has attachments" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
        
        {/* Gantt chart container */}
        <div className={`${isFullScreen ? 'ml-0' : isCollapsed ? 'ml-80' : 'ml-[480px]'} h-full transition-all duration-300 bg-background`}>
          <div ref={ganttRef} className="gantt-container h-full overflow-auto bg-background"></div>
        </div>
      </div>
    </div>
  );
}
