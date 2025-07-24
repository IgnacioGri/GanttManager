import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { adjustDateForWeekends, formatDateForInput, parseInputDate, addBusinessDays } from "@/lib/date-utils";
import type { Task, ProjectWithTasks } from "@shared/schema";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  projectId?: number | null;
  project?: ProjectWithTasks;
}

export function TaskModal({ isOpen, onClose, task, projectId, project }: TaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [duration, setDuration] = useState(1);
  const [progress, setProgress] = useState([0]);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [dependencyType, setDependencyType] = useState<"manual" | "dependent">("manual");
  const [dependentTaskId, setDependentTaskId] = useState<string>("");
  const [offsetDays, setOffsetDays] = useState(0);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [autoAdjustWeekends, setAutoAdjustWeekends] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Task created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/tasks/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Task updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (task) {
      setName(task.name);
      setStartDate(parseInputDate(task.startDate));
      setEndDate(parseInputDate(task.endDate));
      setDuration(task.duration);
      setProgress([task.progress]);
      setDependencies(task.dependencies);
      setSkipWeekends(task.skipWeekends);
      setAutoAdjustWeekends(task.autoAdjustWeekends);
      setAttachments(task.attachments);
      setDependencyType("manual");
      setDependentTaskId("");
      setOffsetDays(0);
    } else {
      // Reset form for new task
      setName("");
      setStartDate(undefined);
      setEndDate(undefined);
      setDuration(1);
      setProgress([0]);
      setDependencies([]);
      setDependencyType("manual");
      setDependentTaskId("");
      setOffsetDays(0);
      setSkipWeekends(true);
      setAutoAdjustWeekends(true);
      setAttachments([]);
    }
  }, [task, isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const uploadedFile = await response.json();
        setAttachments(prev => [...prev, uploadedFile]);
        toast({ title: "File uploaded successfully" });
      } else {
        toast({ title: "File upload failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "File upload failed", variant: "destructive" });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate dates based on dependency
  useEffect(() => {
    if (dependencyType === "dependent" && dependentTaskId && project) {
      const dependentTask = project.tasks.find(t => t.id.toString() === dependentTaskId);
      if (dependentTask) {
        const depEndDate = parseInputDate(dependentTask.endDate);
        let calculatedStartDate = new Date(depEndDate);
        
        // Add offset days
        if (offsetDays > 0) {
          if (skipWeekends) {
            calculatedStartDate = addBusinessDays(calculatedStartDate, offsetDays);
          } else {
            calculatedStartDate.setDate(calculatedStartDate.getDate() + offsetDays);
          }
        }
        
        // Auto-adjust for weekends if enabled
        if (autoAdjustWeekends) {
          calculatedStartDate = adjustDateForWeekends(calculatedStartDate);
        }
        
        setStartDate(calculatedStartDate);
        
        // Calculate end date based on duration
        let calculatedEndDate = new Date(calculatedStartDate);
        if (skipWeekends) {
          calculatedEndDate = addBusinessDays(calculatedStartDate, duration - 1);
        } else {
          calculatedEndDate.setDate(calculatedStartDate.getDate() + duration - 1);
        }
        setEndDate(calculatedEndDate);
      }
    }
  }, [dependencyType, dependentTaskId, offsetDays, duration, skipWeekends, autoAdjustWeekends, project]);

  const handleSave = () => {
    if (!name || !startDate || !endDate || !projectId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    let adjustedStartDate = startDate;
    if (autoAdjustWeekends && dependencyType === "manual") {
      adjustedStartDate = adjustDateForWeekends(startDate);
    }

    // Set dependencies based on type
    let finalDependencies = dependencies;
    if (dependencyType === "dependent" && dependentTaskId) {
      finalDependencies = [dependentTaskId];
    }

    const taskData = {
      projectId,
      name,
      startDate: formatDateForInput(adjustedStartDate),
      endDate: formatDateForInput(endDate),
      duration,
      progress: progress[0],
      dependencies: finalDependencies,
      comments: "",
      attachments,
      skipWeekends,
      autoAdjustWeekends,
    };

    if (task) {
      updateTaskMutation.mutate({ ...taskData, id: task.id });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
            />
          </div>

          <div>
            <Label>Date Configuration</Label>
            <RadioGroup value={dependencyType} onValueChange={(value) => setDependencyType(value as "manual" | "dependent")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Manual date selection</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dependent" id="dependent" />
                <Label htmlFor="dependent">Start after another task</Label>
              </div>
            </RadioGroup>
          </div>

          {dependencyType === "dependent" && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <Label>Depends on Task</Label>
                <Select value={dependentTaskId} onValueChange={setDependentTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {project?.tasks.filter(t => t.id !== task?.id).map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name} (ends {t.endDate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="offsetDays">Additional days after task completion</Label>
                <Input
                  id="offsetDays"
                  type="number"
                  value={offsetDays}
                  onChange={(e) => setOffsetDays(parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Task will start {offsetDays} day(s) after the selected task ends
                </p>
              </div>
            </div>
          )}

          {dependencyType === "manual" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {startDate ? startDate.toLocaleDateString() : "Select date"}
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
                      {endDate ? endDate.toLocaleDateString() : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {dependencyType === "dependent" && startDate && endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Calculated dates:</strong> {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
              </p>
              {autoAdjustWeekends && (
                <p className="text-xs text-blue-600 mt-1">
                  Dates automatically adjusted to avoid weekends
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (Days)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
            
            <div>
              <Label>Progress ({progress[0]}%)</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Slider
                  value={progress}
                  onValueChange={setProgress}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-slate-700 w-12">{progress[0]}%</span>
              </div>
            </div>
          </div>



          <div>
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.doc"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  Drop files here or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOCX files up to 10MB</p>
              </label>
            </div>
            
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <Label>Advanced Date Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipWeekends"
                checked={skipWeekends}
                onCheckedChange={setSkipWeekends}
              />
              <Label htmlFor="skipWeekends" className="text-sm">
                Skip weekends in duration calculation
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoAdjust"
                checked={autoAdjustWeekends}
                onCheckedChange={setAutoAdjustWeekends}
              />
              <Label htmlFor="autoAdjust" className="text-sm">
                Auto-adjust start date if falls on weekend
              </Label>
            </div>
            <p className="text-xs text-slate-500">
              Tasks starting on Saturday/Sunday will automatically move to Monday
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
          >
            {task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
