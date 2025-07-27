import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, FolderOpen, Download, ChevronLeft, ChevronRight, Plus, ChevronDown, Trash2, FolderPlus, HelpCircle, LogOut } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { ProjectWithTasks } from "@shared/schema";
import TagManager from "./tag-manager";

interface SidebarProps {
  project?: ProjectWithTasks;
  timelineScale: "Day" | "Week" | "Month";
  onTimelineScaleChange: (scale: "Day" | "Week" | "Month") => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onShowProjects: () => void;
  onExportExcel: () => void;
  onDeleteProject?: (projectId: number) => void;
  projects: ProjectWithTasks[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ 
  project, 
  timelineScale, 
  onTimelineScaleChange, 
  onNewTask,
  onNewProject,
  onShowProjects,
  onExportExcel,
  onDeleteProject,
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
    <aside className={`${isCollapsed ? 'w-12' : 'w-80'} bg-slate-50 border-r border-slate-200 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-6'} relative shadow-sm`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 bg-white border border-slate-200 shadow-sm hover:shadow-md z-10"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>
      
      {isCollapsed ? (
        <div className="space-y-2 mt-12">
          <Button variant="ghost" size="icon" onClick={onNewProject} title="New Project">
            <FolderPlus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onShowProjects} title="Browse Projects">
            <FolderOpen className="w-4 h-4" />
          </Button>
          <div className="pt-4 border-t border-slate-200">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.location.href = '/api/logout'}
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={onNewTask} disabled={!project} title="Add Task">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild title="Manual de Usuario">
            <Link href="/help">
              <HelpCircle className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div>
          {project && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-sm uppercase tracking-wide text-slate-500 mb-3">PROJECT DETAILS</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 uppercase text-xs tracking-wide">START DATE</span>
                  <span className="font-medium">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 uppercase text-xs tracking-wide">END DATE</span>
                  <span className="font-medium">{formatDate(getProjectEndDate(project))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 uppercase text-xs tracking-wide">PROGRESS</span>
                  <span className="font-medium">{calculateProgress(project)}%</span>
                </div>
              </div>
            </div>
          )}



          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm uppercase tracking-wide text-slate-500 mb-3">TASK ACTIONS</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={onNewTask}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-notifications', { method: 'POST' });
                    if (response.ok) {
                      alert('Notificaciones de prueba enviadas! Revisa tu email.');
                    } else {
                      alert('Error al enviar notificaciones de prueba');
                    }
                  } catch (error) {
                    alert('Error al enviar notificaciones');
                  }
                }}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Test Email Notifications
              </Button>
            </div>
          </div>

          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm uppercase tracking-wide text-slate-500 mb-3">PROJECT ACTIONS</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Project Actions
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem onClick={onNewProject}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShowProjects}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportExcel} disabled={!project}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Manual de Usuario
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (project && confirm('¿Estás seguro de que quieres eliminar este proyecto? Se eliminarán todas las tareas asociadas.')) {
                      onDeleteProject?.(project.id);
                    }
                  }}
                  disabled={!project}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tag Manager */}
          {project && (
            <TagManager projectId={project.id} />
          )}

          {/* Help Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm uppercase tracking-wide text-slate-500 mb-3">AYUDA</h3>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              asChild
            >
              <Link href="/help">
                <HelpCircle className="w-4 h-4 mr-2" />
                Manual de Usuario
              </Link>
            </Button>
          </div>

          {/* Logout section */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => window.location.href = '/api/logout'}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

        </div>
      )}
    </aside>
  );
}
