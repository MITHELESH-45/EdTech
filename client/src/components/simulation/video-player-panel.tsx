import { useState, useEffect } from "react";
import { X, Minimize2, Maximize2, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CircuitTutorial } from "@/lib/circuit-video-tutorials";
import { componentMetadata } from "@/lib/circuit-types";

interface VideoPlayerPanelProps {
  tutorial: CircuitTutorial | null;
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
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

export function VideoPlayerPanel({
  tutorial,
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  onMaximize,
}: VideoPlayerPanelProps) {
  const [videoKey, setVideoKey] = useState(0);

  // Reset video when tutorial changes
  useEffect(() => {
    if (tutorial) {
      setVideoKey((prev) => prev + 1);
    }
  }, [tutorial?.id]);

  if (!isOpen || !tutorial) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="w-12 border-l border-border bg-card flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMaximize}
          className="h-8 w-8"
          title="Expand video panel"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 mt-2"
          title="Close video panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[400px] min-w-[300px] max-w-[50vw] border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{tutorial.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              className={cn("text-xs", difficultyColors[tutorial.difficulty])}
            >
              {difficultyLabels[tutorial.difficulty]}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {tutorial.duration}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="h-8 w-8"
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Player */}
      <div className="shrink-0 bg-black">
        <div className="relative aspect-video">
          <iframe
            key={videoKey}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${tutorial.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
            title={tutorial.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <h4 className="font-medium text-sm mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tutorial.description}
            </p>
          </div>

          <Separator />

          {/* Related Components */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Components Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {tutorial.componentIds.map((componentId) => {
                const metadata = componentMetadata[componentId];
                if (!metadata) return null;
                
                return (
                  <Badge
                    key={componentId}
                    variant="outline"
                    className="text-xs"
                  >
                    {metadata.id === 'arduino-uno' ? 'Arduino UNO' :
                     metadata.id === 'ir-sensor' ? 'IR Sensor' :
                     metadata.id === 'dht11' ? 'DHT11' :
                     metadata.id === 'ultrasonic' ? 'Ultrasonic' :
                     metadata.id === '5v' ? '5V Power' :
                     metadata.id === 'gnd' ? 'GND' :
                     metadata.id.charAt(0).toUpperCase() + metadata.id.slice(1)}
                  </Badge>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          {tutorial.tags.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tutorial.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

