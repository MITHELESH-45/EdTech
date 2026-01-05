import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, FolderPlus, FolderOpen, FileJson, Download, Trash2, Edit2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GiProcessor } from "react-icons/gi";
import { FaGlobe, FaInfinity } from "react-icons/fa";
import { MdOutlineSensors, MdDisplaySettings } from "react-icons/md";
import { GoGear } from "react-icons/go";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { schemaData } from "@/lib/no-code-blocks";

export interface ProjectData {
  id: string;
  name: string;
  placedBlocks: any[];
  connections: any[];
  generatedCode: string;
  lastModified: number;
}

interface ComponentPaletteProps {
  onSelectBlock: (blockId: string) => void;
  selectedBlockId: string | null;
  currentProjectId: string | null;
  onNewProject: () => void;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDownloadProject: (projectId: string) => void;
  projects: ProjectData[];
}

// Map category IDs to icons
const categoryIcons: Record<string, React.ReactNode> = {
  general: <FaGlobe />,
  loop: <FaInfinity />,
  condition: "?",
  gpio: <GiProcessor />,
  sensor: <MdOutlineSensors />,
  motors: <GoGear />,
  display: <MdDisplaySettings />,
};

export function NocodeSidebar({ 
  onSelectBlock, 
  selectedBlockId,
  currentProjectId,
  onNewProject,
  onLoadProject,
  onDeleteProject,
  onRenameProject,
  onDownloadProject,
  projects = [],
}: ComponentPaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [renamingProjectId, setRenamingProjectId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  // Filter blocks based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return schemaData.categories;
    
    const query = searchQuery.toLowerCase();
    return schemaData.categories
      .map(category => ({
        ...category,
        components: category.components.filter(block => 
          block.label.toLowerCase().includes(query) ||
          block.id.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.components.length > 0);
  }, [searchQuery]);

  // Expand all categories when searching, collapse when search is cleared
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedItems(filteredCategories.map(cat => cat.id));
    } else {
      setExpandedItems([]);
    }
  }, [searchQuery, filteredCategories]);

  const handleOpenProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // Only accept JSON files
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const projectData = JSON.parse(text) as ProjectData;
          
          // Validate project data structure
          if (projectData.placedBlocks && Array.isArray(projectData.placedBlocks)) {
            // Generate a new ID for the loaded project to avoid conflicts
            const newProject: ProjectData = {
              ...projectData,
              id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: projectData.name || file.name.replace('.json', ''),
              lastModified: Date.now(),
            };
            
            // Load the project (parent will handle saving to localStorage)
            onLoadProject(newProject.id);
            // The parent should handle loading the project data
            // For now, we'll trigger a custom event or callback
            window.dispatchEvent(new CustomEvent('nocode-load-project', { detail: newProject }));
          }
        } catch (error) {
          console.error('Failed to load project file:', error);
        }
      }
    }

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRenameStart = (project: ProjectData) => {
    setRenamingProjectId(project.id);
    setRenameValue(project.name);
  };

  const handleRenameSubmit = (projectId: string) => {
    if (renameValue.trim()) {
      onRenameProject(projectId, renameValue.trim());
    }
    setRenamingProjectId(null);
    setRenameValue("");
  };

  const handleRenameCancel = () => {
    setRenamingProjectId(null);
    setRenameValue("");
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <Tabs defaultValue="blocks" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full rounded-none border-b shrink-0">
          <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
          <TabsTrigger value="blocks" className="flex-1">Blocks</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="flex-1 m-0 p-0 min-h-0">
          
            <div className="p-4 space-y-3">
              <button 
                onClick={onNewProject}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="text-sm font-medium">New Project</span>
              </button>

              <button 
                onClick={handleOpenProject}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Open project</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                  <span>📁</span>
                  <span>Projects</span>
                </div>
                {!projects || projects.length === 0 ? (
                  <div className="pl-6 text-xs text-muted-foreground italic py-2">
                    No projects yet. Create a new project to get started.
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        "pl-6 pr-2 py-1 flex items-center gap-2 text-sm transition-colors group rounded-md",
                        currentProjectId === project.id
                          ? "text-foreground font-medium bg-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                      )}
                      onClick={() => currentProjectId !== project.id && onLoadProject(project.id)}
                    >
                      <FileJson className="h-4 w-4 flex-shrink-0" />
                      {renamingProjectId === project.id ? (
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRenameSubmit(project.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(project.id);
                            if (e.key === 'Escape') handleRenameCancel();
                          }}
                          className="flex-1 h-6 text-xs px-2 py-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <span className="flex-1 truncate">{project.name}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onLoadProject(project.id);
                              }}>
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleRenameStart(project);
                              }}>
                                <Edit2 className="h-3 w-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onDownloadProject(project.id);
                              }}>
                                <Download className="h-3 w-3 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                                    onDeleteProject(project.id);
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                  <span>📁</span>
                  <span>Examples</span>
                </div>
                <div className="pl-6 text-xs text-muted-foreground italic py-2">
                  No examples available
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                  <span>📁</span>
                  <span>Board files</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">0</span>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </span>
                </div>
              </div>
            </div>
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="flex-1 m-0 flex flex-col min-h-0">
          <div className="p-4 border-b border-border shrink-0">
            <h2 className="font-semibold text-sm">Blocks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click blocks to add them to your canvas
            </p>
          </div>
          
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search blocks..."
                className="pl-9 bg-muted/50 border-transparent focus:border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No blocks found
                </div>
              ) : (
                <Accordion 
                  type="multiple" 
                  className="w-full"
                  value={expandedItems}
                  onValueChange={setExpandedItems}
                >
                  {filteredCategories.map((group) => (
                    <AccordionItem key={group.id} value={group.id} className="border-none">
                      <AccordionTrigger className="py-2 px-1 hover:no-underline">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          <span>{categoryIcons[group.id] || "•"}</span>
                          <span>{group.label}</span>
                          <span className="text-muted-foreground/70">({group.components.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {group.components.map((block) => (
                            <button
                              key={block.id}
                              onClick={() => onSelectBlock(block.id)}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all",
                                "hover:shadow-md hover:scale-105 active:scale-95",
                                selectedBlockId === block.id
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-border bg-background hover:border-primary/50"
                              )}
                              style={{ 
                                borderLeftColor: selectedBlockId === block.id ? block.color : undefined, 
                                borderLeftWidth: selectedBlockId === block.id ? '3px' : undefined 
                              }}
                            >
                              <span className="text-xs font-medium text-center leading-tight">
                                {block.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
