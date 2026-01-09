import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { circuitTutorials, type CircuitTutorial } from "@/lib/circuit-video-tutorials";
import { Play, Clock, TrendingUp, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTutorial: (tutorial: CircuitTutorial) => void;
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

const difficultyLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function VideoLibraryModal({
  open,
  onOpenChange,
  onSelectTutorial,
}: VideoLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<CircuitTutorial['difficulty'] | 'all'>('all');

  const filteredTutorials = circuitTutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === 'all' || tutorial.difficulty === selectedDifficulty;

    return matchesSearch && matchesDifficulty;
  });

  const handleTutorialClick = (tutorial: CircuitTutorial) => {
    onSelectTutorial(tutorial);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Circuit Tutorial Library
          </DialogTitle>
          <DialogDescription>
            Select a tutorial to watch while building your circuit
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                selectedDifficulty === 'all'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              )}
            >
              All
            </button>
            {(['beginner', 'intermediate', 'advanced'] as const).map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-colors",
                  selectedDifficulty === difficulty
                    ? difficultyColors[difficulty] + " border-current"
                    : "bg-background border-border hover:bg-muted"
                )}
              >
                {difficultyLabels[difficulty]}
              </button>
            ))}
          </div>
        </div>

        {/* Tutorial Grid */}
        <ScrollArea className="flex-1 mt-4">
          {filteredTutorials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tutorials found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {filteredTutorials.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => handleTutorialClick(tutorial)}
                  className="group text-left p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-md overflow-hidden mb-3 bg-muted">
                    <img
                      src={`https://img.youtube.com/vi/${tutorial.youtubeId}/maxresdefault.jpg`}
                      alt={tutorial.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        // Fallback to default thumbnail if image fails to load
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${tutorial.youtubeId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-80 group-hover:opacity-100" />
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tutorial.duration}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                        {tutorial.title}
                      </h3>
                      <Badge
                        className={cn(
                          "text-xs shrink-0",
                          difficultyColors[tutorial.difficulty]
                        )}
                      >
                        {difficultyLabels[tutorial.difficulty]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tutorial.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {tutorial.componentIds.length} components
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

