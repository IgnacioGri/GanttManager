import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

export function CommentsModal({ isOpen, onClose, task }: CommentsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState("");

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/tasks/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Comments saved successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save comments", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (task) {
      setComments(task.comments || "");
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    
    updateTaskMutation.mutate({
      id: task.id,
      comments,
    });
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Task Comments</DialogTitle>
          <p className="text-sm text-slate-600">{task.name}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add your comments here..."
            className="min-h-32 resize-none"
          />
          
          {task.updatedAt && (
            <div className="text-xs text-slate-500">
              Last updated: {new Date(task.updatedAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateTaskMutation.isPending}
          >
            Save Comments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
