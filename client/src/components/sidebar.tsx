import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Link as LinkIcon, Paperclip, FolderOpen, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { ProjectWithTasks } from "@shared/schema";

interface SidebarProps {
  project?: ProjectWithTasks;
  timelineScale: "Day" | "Week" | "Month";
  onTimelineScaleChange: (scale: "Day" | "Week" | "Month") => void;
  showWeekends: boolean;
  onShowWeekendsChange: (show: boolean) => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onShowProjects: () => void;
  onExportExcel: () => void;
  projects: ProjectWithTasks[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ 
  project, 
  timelineScale, 
  onTimelineScaleChange, 
  showWeekends, 
  onShowWeekendsChange, 
  onNewTask,
  onNewProject,
  onShowProjects,
  onExportExcel,
  projects,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const calculateProgress = (project?: ProjectWithTasks) => {
    if (!project?.tasks || !project.tasks.length) return 0;
    const totalProgress = project.tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / project.tasks.length);
  };

  const getProjectEndDate = (project: ProjectWithTasks): string => {
    if (!project.tasks.length) return project.endDate;
    
    // Find the latest end date among all tasks
    const latestTaskEndDate = project.tasks.reduce((latest, task) => {
      const taskEndDate = new Date(task.endDate);
      const latestDate = new Date(latest);
      return taskEndDate > latestDate ? task.endDate : latest;
    }, project.tasks[0].endDate);
    
    return latestTaskEndDate;
  };

  return (
    <aside className={`${isCollapsed ? 'w-12' : 'w-80'} bg-white border-r border-slate-200 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-6'} relative`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 bg-white border border-slate-200 shadow-sm hover:shadow-md z-10"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>
      
      {isCollapsed ? (
        <div className="space-y-2 mt-8">
          <Button variant="ghost" size="icon" onClick={onNewProject} title="New Project">
            <PlusCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onShowProjects} title="Browse Projects">
            <FolderOpen className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNewTask} disabled={!project} title="Add Task">
            <PlusCircle className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div>
          {project && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Project: {project.name}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Start Date:</span>
                  <span className="font-medium">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">End Date:</span>
                  <span className="font-medium">{formatDate(getProjectEndDate(project))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Progress:</span>
                  <span className="font-medium">{calculateProgress(project)}%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Se eliminarán todas las tareas asociadas.')) {
                      // Add delete project functionality here
                      console.log('Delete project:', project.id);
                    }
                  }}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Eliminar Proyecto
                </Button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-md font-medium text-slate-900 mb-3">Timeline Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-700">Scale:</label>
                <Select value={timelineScale} onValueChange={onTimelineScaleChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Days</SelectItem>
                    <SelectItem value="Week">Weeks</SelectItem>
                    <SelectItem value="Month">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-700">Show Weekends:</label>
                <Switch checked={showWeekends} onCheckedChange={onShowWeekendsChange} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium text-slate-900 mb-3">Project Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="default" 
                className="w-full justify-start"
                onClick={onNewProject}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-700 hover:bg-slate-50"
                onClick={onShowProjects}
              >
                <FolderOpen className="w-4 h-4 mr-2 text-slate-500" />
                Browse Projects
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-700 hover:bg-slate-50"
                onClick={onExportExcel}
                disabled={!project}
              >
                <Download className="w-4 h-4 mr-2 text-slate-500" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium text-slate-900 mb-3">Task Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-700 hover:bg-slate-50"
                onClick={onNewTask}
                disabled={!project}
              >
                <PlusCircle className="w-4 h-4 mr-2 text-primary" />
                Add Task
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-50" disabled={!project}>
                <LinkIcon className="w-4 h-4 mr-2 text-slate-500" />
                Add Dependency
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-50" disabled={!project}>
                <Paperclip className="w-4 h-4 mr-2 text-slate-500" />
                Attach File
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-slate-900 mb-3">Recent Projects</h3>
            <div className="space-y-2">
              {projects.slice(0, 3).map((proj) => (
                <Link key={proj.id} href={`/project/${proj.id}`}>
                  <div className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="text-sm font-medium text-slate-900">{proj.name}</div>
                    <div className="text-xs text-slate-500">
                      {proj.tasks?.length || 0} tasks • {calculateProgress(proj)}% complete
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
