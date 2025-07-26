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
import { CalendarIcon, Upload, X, Download, ChevronDown, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateForInput, parseInputDate, adjustDateForWeekends, addBusinessDays, calculateBusinessDays } from "@/lib/date-utils";
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

  const [offsetDays, setOffsetDays] = useState(0);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [autoAdjustWeekends, setAutoAdjustWeekends] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  
  // Local states for manual date input
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [dependencySearch, setDependencySearch] = useState("");
  const [isDependencyDropdownOpen, setIsDependencyDropdownOpen] = useState(false);
  
  // Date synchronization states
  const [syncedTaskId, setSyncedTaskId] = useState<number | null>(null);
  const [syncType, setSyncType] = useState<string>("");

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
      setSyncedTaskId(task.syncedTaskId || null);
      setSyncType(task.syncType || "");
      
      // Update date inputs
      setStartDateInput(task.startDate ? formatDate(formatDateForInput(new Date(task.startDate))) : "");
      setEndDateInput(task.endDate ? formatDate(formatDateForInput(new Date(task.endDate))) : "");
      
      // Check if this task has sync configuration first, then dependencies
      if (task.syncedTaskId && task.syncType) {
        // If task has sync, use manual mode (sync overrides dependencies)
        setDependencyType("manual");
        setOffsetDays(0);
      } else if (task.dependencies.length > 0) {
        setDependencyType("dependent");
        setOffsetDays(0);
      } else {
        setDependencyType("manual");
        setOffsetDays(0);
      }
    } else {
      // Reset form for new task
      setName("");
      setStartDate(undefined);
      setEndDate(undefined);
      setDuration(1);
      setProgress([0]);
      setDependencies([]);
      setDependencyType("manual");

      setOffsetDays(0);
      setSkipWeekends(true);
      setAutoAdjustWeekends(true);
      setAttachments([]);
      setSyncedTaskId(null);
      setSyncType("");
      
      // Reset date inputs
      setStartDateInput("");
      setEndDateInput("");
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

  // Calculate dates based on dependency (only if no sync is configured)
  useEffect(() => {
    if (dependencyType === "dependent" && dependencies.length > 0 && project && !syncedTaskId) {
      // Find the latest end date among all dependent tasks
      const dependentTasks = project.tasks.filter(t => dependencies.includes(t.id.toString()));
      if (dependentTasks.length > 0) {
        const latestEndDate = dependentTasks.reduce((latest, task) => {
          const taskEndDate = parseInputDate(task.endDate);
          return taskEndDate > latest ? taskEndDate : latest;
        }, new Date(0));
        
        let calculatedStartDate = new Date(latestEndDate);
        
        // Add offset days after the latest task
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
        setStartDateInput(formatDate(formatDateForInput(calculatedStartDate)));
        
        // Calculate end date based on duration
        let calculatedEndDate = new Date(calculatedStartDate);
        if (skipWeekends) {
          calculatedEndDate = addBusinessDays(calculatedStartDate, duration - 1);
        } else {
          calculatedEndDate.setDate(calculatedStartDate.getDate() + duration - 1);
        }
        setEndDate(calculatedEndDate);
        setEndDateInput(formatDate(formatDateForInput(calculatedEndDate)));
      }
    }
  }, [dependencyType, dependencies, offsetDays, duration, skipWeekends, autoAdjustWeekends, project, syncedTaskId]);

  // Manual calculation functions to avoid useEffect loops
  const calculateDurationFromDates = (start: Date, end: Date): number => {
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const calculateEndDateFromDuration = (start: Date, days: number): Date => {
    const newEndDate = new Date(start);
    newEndDate.setDate(start.getDate() + days - 1);
    return newEndDate;
  };

  const calculateStartDateFromEndAndDuration = (end: Date, days: number): Date => {
    const result = new Date(end);
    result.setDate(result.getDate() - days + 1);
    return result;
  };

  const validateDate = (dateString: string): boolean => {
    // Check format first
    if (!dateString.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
      return false;
    }
    
    const [day, month, year] = dateString.split('/').map(Number);
    const fullYear = year + 2000;
    
    // Check if values are in valid ranges
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (fullYear < 2000 || fullYear > 2099) return false;
    
    // Create date and check if it's valid (handles leap years, days per month, etc.)
    const date = new Date(fullYear, month - 1, day);
    return date.getFullYear() === fullYear && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Task name is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate manual date inputs if in manual mode
    if (dependencyType === "manual") {
      if (!startDateInput || !validateDate(startDateInput)) {
        toast({
          title: "Invalid Date",
          description: "Please enter a valid start date in DD/MM/YY format.",
          variant: "destructive",
        });
        return;
      }

      if (!endDateInput || !validateDate(endDateInput)) {
        toast({
          title: "Invalid Date", 
          description: "Please enter a valid end date in DD/MM/YY format.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!startDate || !endDate || !projectId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (startDate >= endDate) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    let adjustedStartDate = startDate;
    let adjustedEndDate = endDate;
    
    // If sync is configured, calculate dates based on synced task
    if (syncedTaskId && syncType && project) {
      const syncedTask = project.tasks.find(t => t.id === syncedTaskId);
      if (syncedTask) {
        switch (syncType) {
          case "start-start":
            adjustedStartDate = parseInputDate(syncedTask.startDate);
            adjustedEndDate = calculateEndDateFromDuration(adjustedStartDate, duration);
            break;
          case "end-end":
            adjustedEndDate = parseInputDate(syncedTask.endDate);
            adjustedStartDate = calculateStartDateFromEndAndDuration(adjustedEndDate, duration);
            break;
          case "start-end":
            adjustedStartDate = parseInputDate(syncedTask.endDate);
            adjustedEndDate = calculateEndDateFromDuration(adjustedStartDate, duration);
            break;
          case "end-start":
            adjustedEndDate = parseInputDate(syncedTask.startDate);
            adjustedStartDate = calculateStartDateFromEndAndDuration(adjustedEndDate, duration);
            break;
        }
      }
    } else if (autoAdjustWeekends && dependencyType === "manual") {
      adjustedStartDate = adjustDateForWeekends(startDate);
    }

    // Set dependencies based on type - dependencies array already contains multiple task IDs
    let finalDependencies = dependencies;

    const taskData = {
      projectId,
      name,
      startDate: formatDateForInput(adjustedStartDate),
      endDate: formatDateForInput(adjustedEndDate),
      duration,
      progress: progress[0],
      dependencies: finalDependencies,
      comments: "",
      attachments,
      skipWeekends,
      autoAdjustWeekends,
      syncedTaskId,
      syncType: syncedTaskId ? syncType : null,
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
                <Label>Depends on Tasks</Label>
                <DropdownMenu open={isDependencyDropdownOpen} onOpenChange={setIsDependencyDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>
                        {dependencies.length === 0 
                          ? "Select tasks..." 
                          : `${dependencies.length} task${dependencies.length > 1 ? 's' : ''} selected`
                        }
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[400px] p-0">
                    <div className="p-3 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search tasks..."
                          value={dependencySearch}
                          onChange={(e) => setDependencySearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {project?.tasks
                        .filter(t => t.id !== task?.id)
                        .filter(t => t.name.toLowerCase().includes(dependencySearch.toLowerCase()))
                        .map((t) => (
                          <DropdownMenuItem
                            key={t.id}
                            onSelect={(e) => e.preventDefault()}
                            className="flex items-center space-x-2 p-3"
                          >
                            <Checkbox
                              id={`task-${t.id}`}
                              checked={dependencies.includes(t.id.toString())}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDependencies(prev => [...prev, t.id.toString()]);
                                } else {
                                  setDependencies(prev => prev.filter(id => id !== t.id.toString()));
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{t.name}</div>
                              <div className="text-xs text-slate-500">
                                ends {formatDate(formatDateForInput(new Date(t.endDate)))}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      {project?.tasks
                        .filter(t => t.id !== task?.id)
                        .filter(t => t.name.toLowerCase().includes(dependencySearch.toLowerCase())).length === 0 && (
                        <div className="p-3 text-center text-slate-500 text-sm">
                          No tasks found
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-slate-500 mt-2">
                  Select one or more tasks that must be completed before this task can start
                </p>
              </div>
              
              <div>
                <Label htmlFor="offsetDays">Additional days after all tasks complete</Label>
                <Input
                  id="offsetDays"
                  type="number"
                  value={offsetDays}
                  onChange={(e) => setOffsetDays(parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Task will start {offsetDays} day(s) after ALL selected tasks end
                </p>
              </div>
            </div>
          )}

          {/* Date Synchronization Section */}
          <div>
            <Label>Date Synchronization (Optional)</Label>
            <p className="text-xs text-slate-500 mb-3">
              Sync this task's dates with another task. <strong>This overrides dependency calculations</strong> - use this when tasks should happen at the same time, not one after another.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reference Task</Label>
                <Select value={syncedTaskId?.toString() || "no-sync"} onValueChange={(value) => setSyncedTaskId(value === "no-sync" ? null : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-sync">No sync</SelectItem>
                    {project?.tasks
                      .filter(t => t.id !== task?.id)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Sync Type</Label>
                <Select value={syncType} onValueChange={setSyncType} disabled={!syncedTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sync type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start-start">Start together</SelectItem>
                    <SelectItem value="end-end">End together</SelectItem>
                    <SelectItem value="start-end">Start when reference ends</SelectItem>
                    <SelectItem value="end-start">End when reference starts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {syncedTaskId && syncType && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  {syncType === "start-start" && "This task will start on the same day as the reference task."}
                  {syncType === "end-end" && "This task will end on the same day as the reference task."}
                  {syncType === "start-end" && "This task will start when the reference task ends."}
                  {syncType === "end-start" && "This task will end when the reference task starts."}
                </p>
              </div>
            )}
          </div>

          {dependencyType === "manual" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="DD/MM/YY"
                    value={startDateInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStartDateInput(value);
                      
                      // Validate and update startDate when format is complete
                      if (value.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
                        if (validateDate(value)) {
                          const [day, month, year] = value.split('/');
                          const fullYear = parseInt(year) + 2000;
                          const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
                          setStartDate(date);
                          // Auto-calculate end date if we have duration
                          if (duration > 0) {
                            const newEndDate = calculateEndDateFromDuration(date, duration);
                            setEndDate(newEndDate);
                            setEndDateInput(formatDate(formatDateForInput(newEndDate)));
                          }
                        }
                      }
                    }}
                    className={`flex-1 ${startDateInput && startDateInput.match(/^\d{2}\/\d{2}\/\d{2}$/) && !validateDate(startDateInput) ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <CalendarIcon className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="p-3">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          defaultMonth={startDate || new Date()}
                          onSelect={(date) => {
                          setStartDate(date);
                          if (date) {
                            setStartDateInput(formatDate(formatDateForInput(date)));
                            // Auto-calculate end date if we have duration
                            if (duration > 0) {
                              const newEndDate = calculateEndDateFromDuration(date, duration);
                              setEndDate(newEndDate);
                              setEndDateInput(formatDate(formatDateForInput(newEndDate)));
                            }
                          }
                        }}
                          initialFocus
                        />
                        <div className="border-t pt-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStartDate(new Date())}
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
              
              <div>
                <Label>End Date</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="DD/MM/YY"
                    value={endDateInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEndDateInput(value);
                      
                      // Validate and update endDate when format is complete
                      if (value.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
                        if (validateDate(value)) {
                          const [day, month, year] = value.split('/');
                          const fullYear = parseInt(year) + 2000;
                          const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
                          setEndDate(date);
                          // Auto-calculate duration if we have start date
                          if (startDate) {
                            setDuration(calculateDurationFromDates(startDate, date));
                          }
                        }
                      }
                    }}
                    className={`flex-1 ${endDateInput && endDateInput.match(/^\d{2}\/\d{2}\/\d{2}$/) && !validateDate(endDateInput) ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <CalendarIcon className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="p-3">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          defaultMonth={endDate || new Date()}
                          onSelect={(date) => {
                          setEndDate(date);
                          if (date) {
                            setEndDateInput(formatDate(formatDateForInput(date)));
                            // Auto-calculate duration if we have start date
                            if (startDate) {
                              setDuration(calculateDurationFromDates(startDate, date));
                            }
                          }
                        }}
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
          )}

          {dependencyType === "dependent" && dependencies.length > 0 && startDate && endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Calculated dates:</strong> {formatDate(formatDateForInput(startDate))} to {formatDate(formatDateForInput(endDate))}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Depends on {dependencies.length} task{dependencies.length > 1 ? 's' : ''}: {
                  project?.tasks
                    .filter(t => dependencies.includes(t.id.toString()))
                    .map(t => t.name)
                    .join(', ')
                }
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
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value) || 1;
                  setDuration(newDuration);
                  // Auto-calculate end date when duration changes
                  if (startDate) {
                    const newEndDate = calculateEndDateFromDuration(startDate, newDuration);
                    setEndDate(newEndDate);
                    setEndDateInput(formatDate(formatDateForInput(newEndDate)));
                  }
                }}
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
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Create a download link for the file
                          const link = document.createElement('a');
                          link.href = `data:${file.type};base64,${file.data}`;
                          link.download = file.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="text-slate-400 hover:text-blue-500"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(index)}
                        className="text-slate-400 hover:text-red-500"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
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
                onCheckedChange={(checked) => setSkipWeekends(checked === true)}
              />
              <Label htmlFor="skipWeekends" className="text-sm">
                Skip weekends in duration calculation
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoAdjust"
                checked={autoAdjustWeekends}
                onCheckedChange={(checked) => setAutoAdjustWeekends(checked === true)}
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
