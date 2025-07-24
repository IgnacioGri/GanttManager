import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectWithTasks } from "@shared/schema";

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectWithTasks[];
}

export function ProjectListModal({ isOpen, onClose, projects }: ProjectListModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
  });

  const calculateProgress = (project: ProjectWithTasks) => {
    if (!project.tasks || !project.tasks.length) return 0;
    const totalProgress = project.tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / project.tasks.length);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectSelect = (projectId: number) => {
    setLocation(`/project/${projectId}`);
    onClose();
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Open Project</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {searchTerm ? "No projects found matching your search." : "No projects available."}
              </div>
            ) : (
              filteredProjects.map((project) => {
                const progress = calculateProgress(project);
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{project.name}</div>
                      <div className="text-sm text-slate-600">
                        {project.tasks?.length || 0} tasks • {progress}% complete
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Last modified: {formatRelativeTime(new Date(project.updatedAt))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-16">
                        <Progress value={progress} className="h-2" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        className="text-slate-400 hover:text-red-500"
                        disabled={deleteProjectMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
