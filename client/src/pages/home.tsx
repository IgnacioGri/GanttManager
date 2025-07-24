import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Download, Settings } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { GanttChart } from "@/components/gantt-chart";
import { TaskModal } from "@/components/task-modal";
import { CommentsModal } from "@/components/comments-modal";
import { ProjectListModal } from "@/components/project-list-modal";
import { exportToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";
import type { ProjectWithTasks, Task } from "@shared/schema";

export default function Home() {
  const { id } = useParams();
  const projectId = id ? parseInt(id) : null;
  const { toast } = useToast();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timelineScale, setTimelineScale] = useState<"Day" | "Week" | "Month">("Week");
  const [showWeekends, setShowWeekends] = useState(true);

  const { data: project, isLoading } = useQuery<ProjectWithTasks>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: projects } = useQuery<ProjectWithTasks[]>({
    queryKey: ["/api/projects"],
  });

  const handleNewProject = () => {
    // For now, we'll just show a placeholder
    toast({
      title: "New Project",
      description: "Project creation functionality will be available soon.",
    });
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
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-slate-900">GanttFlow</h1>
            <div className="flex items-center space-x-2">
              <Button onClick={handleNewProject} className="bg-primary text-white hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsProjectListOpen(true)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Open Project
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={handleExportToExcel}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <Sidebar 
          project={project}
          timelineScale={timelineScale}
          onTimelineScaleChange={setTimelineScale}
          showWeekends={showWeekends}
          onShowWeekendsChange={setShowWeekends}
          onNewTask={handleNewTask}
          projects={projects || []}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          <GanttChart 
            project={project}
            timelineScale={timelineScale}
            showWeekends={showWeekends}
            onEditTask={handleEditTask}
            onAddComment={handleAddComment}
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
    </div>
  );
}
