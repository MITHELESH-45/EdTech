import { Cpu, Globe, Blocks, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

interface ToolItem {
  id: string;
  name: string;
  icon: typeof Cpu;
  path: string;
  isActive: boolean;
  comingSoon: boolean;
}

const tools: ToolItem[] = [
  {
    id: "electronic-simulation",
    name: "Electronic Simulation",
    icon: Cpu,
    path: "/electronic-simulation",
    isActive: true,
    comingSoon: false,
  },
  {
    id: "iot-simulation",
    name: "IoT Simulation",
    icon: Globe,
    path: "/iot-simulation",
    isActive: true,
    comingSoon: false,
  },
  {
    id: "no-code-editor",
    name: "No-Code Editor",
    icon: Blocks,
    path: "/no-code-editor",
    isActive: true,
    comingSoon: false,
  },
];

export function ToolSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Tools
        </h2>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isCurrentPath = location === tool.path;
          
          if (tool.comingSoon) {
            return (
              <div
                key={tool.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md",
                  "text-muted-foreground cursor-not-allowed opacity-60"
                )}
                data-testid={`tool-${tool.id}`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-sm font-medium">{tool.name}</span>
                <Badge variant="secondary" className="text-xs">
                  Soon
                </Badge>
              </div>
            );
          }

          return (
            <Link key={tool.id} href={tool.path} data-testid={`link-tool-${tool.id}`}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer",
                  "hover-elevate active-elevate-2",
                  isCurrentPath
                    ? "bg-primary/10 text-primary"
                    : "text-foreground"
                )}
                data-testid={`tool-${tool.id}`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-sm font-medium">{tool.name}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            More tools coming soon! IoT Simulation and No-Code Editor are in development.
          </p>
        </div>
      </div>
    </aside>
  );
}
