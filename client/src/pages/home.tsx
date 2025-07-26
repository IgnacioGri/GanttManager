import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Download, Settings } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { GanttChart } from "@/components/gantt-chart";
import { TaskModal } from "@/components/task-modal";
import { CommentsModal } from "@/components/comments-modal";
import { ProjectListModal } from "@/components/project-list-modal";
import { ProjectModal } from "@/components/project-modal";
import { exportToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { ProjectWithTasks, Task } from "@shared/schema";

export default function Home() {
  const { id } = useParams();
  const projectId = id ? parseInt(id) : null;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timelineScale, setTimelineScale] = useState<"Day" | "Week" | "Month">("Day");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGanttFullScreen, setIsGanttFullScreen] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState("");

  const { data: project, isLoading } = useQuery<ProjectWithTasks>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: projects } = useQuery<ProjectWithTasks[]>({
    queryKey: ["/api/projects"],
  });

  // Auto-redirect to first project if no project is selected
  useEffect(() => {
    if (!projectId && projects && projects.length > 0) {
      setLocation(`/project/${projects[0].id}`);
    }
  }, [projectId, projects, setLocation]);

  const handleNewProject = () => {
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (projectIdToDelete: number) => {
    try {
      const response = await fetch(`/api/projects/${projectIdToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete project');
      
      await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Redirect to first available project or home
      const allProjects = await queryClient.fetchQuery({
        queryKey: ["/api/projects"],
      }) as ProjectWithTasks[];
      
      const remainingProjects = allProjects.filter(p => p.id !== projectIdToDelete);
      
      if (remainingProjects.length > 0) {
        setLocation(`/project/${remainingProjects[0].id}`);
      } else {
        setLocation('/');
      }
      
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const handleExportToExcel = async () => {
    if (!project) {
      toast({
        title: "No Project",
        description: "Please select a project to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportToExcel(project);
      toast({
        title: "Export Successful",
        description: "Excel file has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export project to Excel.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleAddComment = (task: Task) => {
    setSelectedTask(task);
    setIsCommentsModalOpen(true);
  };

  const handleNewTask = () => {
    if (!projectId) {
      toast({
        title: "No Project",
        description: "Please select a project to add tasks.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update task');
      
      // Refetch project data to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete task');
      
      // Refetch project data to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      toast({
        title: "Task Deleted",
        description: "Task has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Gantt Manager</h1>
          {project && (
            <div className="text-right">
              {isEditingProjectName ? (
                <div className="p-2">
                  <input
                    type="text"
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    onBlur={async () => {
                      if (projectNameInput.trim() && projectNameInput !== project.name) {
                        try {
                          const response = await fetch(`/api/projects/${project.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              name: projectNameInput.trim(),
                              startDate: project.startDate,
                              endDate: project.endDate,
                            }),
                          });
                          
                          if (!response.ok) throw new Error('Failed to update project name');
                          
                          await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
                          await queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
                          
                          toast({
                            title: "Project Updated",
                            description: "Project name has been updated successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Update Failed",
                            description: "Failed to update project name",
                            variant: "destructive"
                          });
                          setProjectNameInput(project.name); // Revert to original name
                        }
                      }
                      setIsEditingProjectName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      } else if (e.key === 'Escape') {
                        setProjectNameInput(project.name);
                        setIsEditingProjectName(false);
                      }
                    }}
                    className="text-2xl font-bold text-slate-900 bg-white border border-blue-500 rounded px-2 py-1 text-right"
                    autoFocus
                  />
                  <p className="text-sm text-slate-500 uppercase tracking-wide">PROJECT</p>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setProjectNameInput(project.name);
                    setIsEditingProjectName(true);
                  }}
                  className="group text-right hover:bg-slate-50 p-2 rounded-lg transition-colors"
                  title="Click to edit project name"
                >
                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h2>
                  <p className="text-sm text-slate-500 uppercase tracking-wide">PROJECT</p>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar 
          project={project}
          timelineScale={timelineScale}
          onTimelineScaleChange={setTimelineScale}
          onNewTask={handleNewTask}
          onNewProject={handleNewProject}
          onShowProjects={() => setIsProjectListOpen(true)}
          onExportExcel={handleExportToExcel}
          onDeleteProject={handleDeleteProject}
          projects={projects || []}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className="flex-1 p-6 overflow-auto bg-slate-50">
          <GanttChart 
            project={project}
            timelineScale={timelineScale}
            onEditTask={handleEditTask}
            onAddComment={handleAddComment}
            onTaskUpdate={handleTaskUpdate}
            onDeleteTask={handleDeleteTask}
            isCollapsed={isSidebarCollapsed}
            isFullScreen={isGanttFullScreen}
            onToggleFullScreen={() => setIsGanttFullScreen(!isGanttFullScreen)}
            onTimelineScaleChange={setTimelineScale}
          />
        </main>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        projectId={projectId}
        project={project}
      />

      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        task={selectedTask}
      />

      <ProjectListModal
        isOpen={isProjectListOpen}
        onClose={() => setIsProjectListOpen(false)}
        projects={projects || []}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div>
  );
}
