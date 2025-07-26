import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ZoomOut, ZoomIn, Maximize, MessageCircle, Paperclip, Edit3, Trash2, Minimize, MoreHorizontal } from "lucide-react";
import { createGanttTasks } from "@/lib/gantt-utils";
import { formatDate } from "@/lib/date-utils";
import type { ProjectWithTasks, Task } from "@shared/schema";

type TaskFilter = "all" | "pending" | "in-progress" | "completed";

interface GanttChartProps {
  project?: ProjectWithTasks;
  timelineScale: "Day" | "Week" | "Month";
  showWeekends: boolean;
  onEditTask: (task: Task) => void;
  onAddComment: (task: Task) => void;
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: number) => void;
  isCollapsed: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onTimelineScaleChange: (scale: "Day" | "Week" | "Month") => void;
  onWeekendToggle: (show: boolean) => void;
}

declare global {
  interface Window {
    Gantt: any;
  }
}

export function GanttChart({ project, timelineScale, showWeekends, onEditTask, onAddComment, onTaskUpdate, onDeleteTask, isCollapsed, isFullScreen = false, onToggleFullScreen, onTimelineScaleChange, onWeekendToggle }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");

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

  useEffect(() => {
    if (!ganttRef.current || !project?.tasks.length) return;

    // Clear previous instance
    if (ganttInstance.current) {
      ganttInstance.current = null;
    }

    const tasks = createGanttTasks(project.tasks);

    try {
      // Debug logging
      console.log('Show weekends:', showWeekends);
      console.log('Timeline scale:', timelineScale);
      
      // Custom options for Gantt library
      const ganttOptions: any = {
        view_mode: timelineScale,
        date_format: 'YYYY-MM-DD',
        language: 'en',
        readonly: false,
        show_today_line: true,
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
      };

      // Add weekend/holiday configuration if supported
      if (!showWeekends) {
        ganttOptions.ignore = ['weekend', ...getArgentineHolidays()];
        console.log('Ignoring weekends and holidays:', ganttOptions.ignore);
      } else {
        ganttOptions.ignore = getArgentineHolidays();
        ganttOptions.holidays = {
          'rgba(255, 0, 0, 0.3)': getArgentineHolidays()
        };
        console.log('Showing weekends, ignoring only holidays:', ganttOptions.ignore);
      }

      console.log('Creating Gantt with options:', ganttOptions);
      ganttInstance.current = new window.Gantt(ganttRef.current, tasks, ganttOptions);
      
      // Manual weekend hiding if ignore option doesn't work
      if (!showWeekends) {
        setTimeout(() => {
          const ganttContainer = ganttRef.current;
          if (ganttContainer) {
            // Try to find and hide weekend columns manually
            const headers = ganttContainer.querySelectorAll('.gantt-grid-header .gantt-grid-cell');
            headers.forEach((header: any, index: number) => {
              const text = header.textContent;
              if (text) {
                // Try to parse date and check if it's weekend
                const currentYear = new Date().getFullYear();
                let testDate = new Date(`${text} ${currentYear}`);
                
                if (isNaN(testDate.getTime())) {
                  // Try different date parsing
                  const parts = text.split(' ');
                  if (parts.length >= 2) {
                    testDate = new Date(`${parts[0]} ${parts[1]} ${currentYear}`);
                  }
                }
                
                if (!isNaN(testDate.getTime())) {
                  const dayOfWeek = testDate.getDay();
                  if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
                    console.log('Hiding weekend column:', text, testDate);
                    header.style.display = 'none';
                    
                    // Also hide corresponding body columns
                    const columnIndex = index + 1;
                    const bodyColumns = ganttContainer.querySelectorAll(`.gantt-grid-column:nth-child(${columnIndex})`);
                    bodyColumns.forEach((col: any) => {
                      col.style.display = 'none';
                    });
                  }
                }
              }
            });
          }
        }, 200);
      }
      
      // Apply custom styling after initialization
      setTimeout(() => {
        
        project.tasks.forEach((task, index) => {
          // Phase-based colors
          const getTaskColor = (taskName: string) => {
            const name = taskName.toLowerCase();
            if (name.includes('planning') || name.includes('project')) return '#8b5cf6'; // Purple
            if (name.includes('design') || name.includes('ui') || name.includes('ux')) return '#06b6d4'; // Cyan
            if (name.includes('development') || name.includes('frontend') || name.includes('backend')) return '#3b82f6'; // Blue
            if (name.includes('testing') || name.includes('qa')) return '#f59e0b'; // Amber
            if (name.includes('deployment') || name.includes('launch')) return '#10b981'; // Green
            return '#6366f1'; // Default indigo
          };
          
          const baseColor = getTaskColor(task.name);
          
          // Calculate opacity based on progress: 0% = solid (1.0), 100% = very transparent (0.3)
          const opacity = 1.0 - (task.progress / 100) * 0.7;
          
          const taskBar = ganttRef.current?.querySelector(`[data-id="${task.id}"] .bar`);
          if (taskBar) {
            // Convert hex to rgba with calculated opacity
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            (taskBar as HTMLElement).style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            
            // Add hover effect that highlights corresponding row
            (taskBar as HTMLElement).addEventListener('mouseenter', () => {
              const taskRow = document.querySelector(`[data-task-id="${task.id}"]`);
              if (taskRow) {
                taskRow.classList.add('bg-blue-50');
              }
            });
            
            (taskBar as HTMLElement).addEventListener('mouseleave', () => {
              const taskRow = document.querySelector(`[data-task-id="${task.id}"]`);
              if (taskRow) {
                taskRow.classList.remove('bg-blue-50');
              }
            });
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
    <div className={`${isFullScreen ? 'fixed inset-0 bg-slate-50 z-50 p-6' : 'h-full'} flex flex-col`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gantt Chart</h2>
            <p className="text-sm text-slate-500 uppercase tracking-wide">PROJECT TIMELINE</p>
          </div>
          {/* Filter buttons and timeline controls */}
          <div className="flex items-center gap-6 ml-6">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setTaskFilter("all")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "all" 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tasks
              </button>
              <button 
                onClick={() => setTaskFilter("pending")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "pending" 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button 
                onClick={() => setTaskFilter("in-progress")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "in-progress" 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Progress
              </button>
              <button 
                onClick={() => setTaskFilter("completed")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  taskFilter === "completed" 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Timeline Scale Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Scale:</span>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {(['Day', 'Week', 'Month'] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onTimelineScaleChange(scale)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timelineScale === scale
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekend Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onWeekendToggle(!showWeekends)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  showWeekends
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {showWeekends ? 'Hide Weekends' : 'Show Weekends'}
              </button>
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

      <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden relative">
        {/* Task list on the left - hidden in full screen */}
        {!isFullScreen && (
          <div className={`absolute top-0 left-0 ${isCollapsed ? 'w-80' : 'w-[480px]'} bg-white border-r border-slate-200 h-full overflow-y-auto z-10 transition-all duration-300`}>
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sticky top-0 h-[52px] flex items-center">
            <div className="w-full flex items-center text-xs font-medium text-slate-600 uppercase tracking-wide">
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
            <div key={task.id} className="hover:bg-blue-50 group transition-colors" data-task-id={task.id}>
              <div className="px-3 h-[52px] flex items-center text-sm border-b border-slate-100">
                <div className="w-full flex items-center">
                  <div className="flex-1 min-w-0 pr-4">
                    <div 
                      className="font-medium text-slate-900 cursor-pointer hover:text-primary truncate"
                      onClick={() => onEditTask(task)}
                      title="Click to edit task"
                    >
                      {task.name}
                    </div>
                  </div>
                  <div className="w-16 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 ml-1 font-medium">{task.progress}%</span>
                    </div>
                  </div>
                  <div className="w-20 text-xs text-slate-500 text-center">
                    {formatDate(task.startDate)}
                  </div>
                  <div className="w-20 text-xs text-slate-500 text-center">
                    {formatDate(task.endDate)}
                  </div>
                  <div className="w-10 flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Has comments" />
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
        <div className={`${isFullScreen ? 'ml-0' : isCollapsed ? 'ml-80' : 'ml-[480px]'} h-full transition-all duration-300`}>
          <div ref={ganttRef} className="gantt-container h-full overflow-auto"></div>
        </div>
      </div>
    </div>
  );
}
