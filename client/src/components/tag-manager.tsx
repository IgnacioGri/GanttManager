import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit3, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tag as TagType, InsertTag } from "@shared/schema";

interface TagManagerProps {
  projectId: number;
}

export default function TagManager({ projectId }: TagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#3B82F6");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags = [] } = useQuery<TagType[]>({
    queryKey: [`/api/projects/${projectId}/tags`],
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTag) => {
      const response = await fetch(`/api/projects/${projectId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create tag");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tags`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Tag created successfully" });
      setTagName("");
      setTagColor("#3B82F6");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTag> }) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update tag");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tags`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Tag updated successfully" });
      setEditingTag(null);
      setTagName("");
      setTagColor("#3B82F6");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete tag");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tags`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Tag deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    if (editingTag) {
      updateMutation.mutate({
        id: editingTag.id,
        data: { name: tagName, color: tagColor }
      });
    } else {
      createMutation.mutate({
        projectId,
        name: tagName,
        color: tagColor
      });
    }
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setTagName("");
    setTagColor("#3B82F6");
  };

  const predefinedColors = [
    "#3B82F6", // Blue
    "#8B5CF6", // Purple  
    "#06B6D4", // Cyan
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#EC4899", // Pink
    "#6366F1", // Indigo
    "#84CC16", // Lime
    "#F97316", // Orange
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing Tags */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between group">
              <Badge 
                style={{ backgroundColor: tag.color, color: "white" }}
                className="text-xs border-0"
              >
                {tag.name}
              </Badge>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleEdit(tag)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={() => deleteMutation.mutate(tag.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {(editingTag || isOpen) && (
          <form onSubmit={handleSubmit} className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Tag name"
                className="h-8 text-xs"
                required
              />
            </div>
            
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-1 flex-wrap mt-1">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded border-2 ${
                      tagColor === color ? "border-gray-400" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTagColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTag ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={editingTag ? handleCancelEdit : () => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Add Button */}
        {!editingTag && !isOpen && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        )}
      </CardContent>
    </Card>
  );
}