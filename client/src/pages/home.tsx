import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Download, Settings } from "lucide-react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { GanttChart } from "@/components/gantt-chart";
import { TaskModal } from "@/components/task-modal";
import { CommentsModal } from "@/components/comments-modal";
import { ProjectListModal } from "@/components/project-list-modal";
import { ProjectModal } from "@/components/project-modal";
import { ExcelImportModal } from "@/components/excel-import-modal";
import { exportToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
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

  const handleImportExcel = () => {
    setIsExcelImportOpen(true);
  };

  const handleProjectCreated = (projectId: number) => {
    setLocation(`/project/${projectId}`);
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
    <div className="min-h-screen bg-background font-inter">
      {/* Header */}
      <Header />

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
          onImportExcel={handleImportExcel}
        />
        
        <main className="flex-1 p-6 overflow-auto bg-background">
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

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
