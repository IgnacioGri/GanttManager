import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tag } from "@shared/schema";

interface TaskTagsProps {
  tagIds: number[];
  tags: Tag[];
  maxVisible?: number;
}

export default function TaskTags({ tagIds, tags, maxVisible = 3 }: TaskTagsProps) {
  if (!tagIds || tagIds.length === 0) return null;

  const taskTags = tagIds
    .map(id => tags.find(tag => tag.id === id))
    .filter(Boolean) as Tag[];

  if (taskTags.length === 0) return null;

  const visibleTags = taskTags.slice(0, maxVisible);
  const remainingCount = taskTags.length - maxVisible;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {visibleTags.map((tag) => (
          <Tooltip key={tag.id}>
            <TooltipTrigger asChild>
              <div
                className="w-3 h-3 rounded-full border border-white/20 cursor-help"
                style={{ backgroundColor: tag.color }}
                title={tag.name}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{tag.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-3 h-3 rounded-full bg-gray-400 border border-white/20 cursor-help flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">+</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p className="font-medium mb-1">+{remainingCount} more tags:</p>
                {taskTags.slice(maxVisible).map((tag) => (
                  <p key={tag.id} style={{ color: tag.color }}>
                    • {tag.name}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}