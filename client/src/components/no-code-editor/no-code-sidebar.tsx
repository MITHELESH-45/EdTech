import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, FolderPlus, FolderOpen, FileJson, Download } from "lucide-react";
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

interface ComponentPaletteProps {
  onSelectBlock: (blockId: string) => void;
  selectedBlockId: string | null;
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

export function NocodeSidebar({ onSelectBlock, selectedBlockId }: ComponentPaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

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

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <Tabs defaultValue="projects" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
          <TabsTrigger value="blocks" className="flex-1">Blocks</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="flex-1 m-0 p-4 space-y-4 overflow-auto">
          <button className="w-full flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors">
            <FolderPlus className="h-4 w-4" />
            <span className="text-sm font-medium">New Project</span>
          </button>

          <button className="w-full flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors">
            <FolderOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Open project</span>
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
              <span>📁</span>
              <span>Projects</span>
            </div>
            <div className="pl-6 flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" />
              <span>sample.json</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
              <span>📁</span>
              <span>Examples</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
              <span>📁</span>
              <span>Board files</span>
              <span className="ml-auto flex items-center gap-2">
                <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">0</span>
                <Download className="h-4 w-4 text-muted-foreground" />
              </span>
            </div>
          </div>
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="flex-1 m-0 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Blocks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click blocks to add them to your canvas
            </p>
          </div>
          
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search blocks..."
                className="pl-9 bg-muted/50 border-transparent focus:border-border"
                data-testid="input-search"
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
                              data-testid={`block-${block.id}`}
                              style={{ borderLeftColor: selectedBlockId === block.id ? block.color : undefined, borderLeftWidth: selectedBlockId === block.id ? '3px' : undefined }}
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
