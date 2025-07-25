import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateForInput } from "@/lib/date-utils";
import { useLocation } from "wouter";
import type { Project } from "@shared/schema";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project created successfully" });
      setLocation(`/project/${newProject.id}`);
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/projects/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (project) {
      setName(project.name);
      setStartDate(new Date(project.startDate));
      setEndDate(new Date(project.endDate));
    } else {
      // Reset form for new project
      setName("");
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [project, isOpen]);

  const handleSave = () => {
    if (!name || !startDate) {
      toast({ title: "Please fill in project name and start date", variant: "destructive" });
      return;
    }

    // For existing projects, end date is required
    if (project && !endDate) {
      toast({ title: "End date is required for existing projects", variant: "destructive" });
      return;
    }

    if (endDate && startDate > endDate) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }

    const projectData = {
      name,
      startDate: formatDateForInput(startDate),
      // For new projects, use start date as initial end date if not specified
      endDate: formatDateForInput(endDate || startDate),
    };

    if (project) {
      updateProjectMutation.mutate({ ...projectData, id: project.id });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {startDate ? startDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {endDate ? endDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "Select date (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                    <div className="border-t pt-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEndDate(new Date())}
                        className="w-full"
                      >
                        Hoy
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
          >
            {project ? "Update Project" : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}