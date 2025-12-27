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

interface ElectronicComponent {
  id: string;
  name: string;
  color: string;
}

interface ComponentPaletteProps {
  onSelectComponent: (component: ElectronicComponent) => void;
  selectedComponent: ElectronicComponent | null;
  components?: ElectronicComponent[];
}

const componentCategories = [
  { 
    id: "general", 
    label: "General",
    icon: <FaGlobe />,
    components: [
      { id: "print", name: "Print", color: "bg-blue-500" },
      { id: "graph", name: "Graph", color: "bg-cyan-500" },
      { id: "variable", name: "Variable", color: "bg-yellow-500" },
      { id: "sleep", name: "Sleep", color: "bg-pink-500" }
    ]
  },
  { 
    id: "loop", 
    label: "Loop",
    icon: <FaInfinity />,
    components: [
      { id: "break", name: "Break", color: "bg-yellow-500" },
      { id: "repeat", name: "Repeat", color: "bg-blue-500" },
      { id: "for-loop", name: "For Loop", color: "bg-purple-500" },
      { id: "while-loop", name: "While Loop", color: "bg-green-500" },
      { id: "forever-loop", name: "Forever Loop", color: "bg-cyan-500" }
    ]
  },
  { 
    id: "condition", 
    label: "Condition",
    icon: "?",
    components: [
      { id: "if-else", name: "If-Else", color: "bg-blue-500" }
    ]
  },
  { 
    id: "gpio", 
    label: "GPIO",
    icon: <GiProcessor />,
    components: [
      { id: "gpio-pin", name: "GPIO Pin", color: "bg-green-500" },
      { id: "pin-write", name: "Pin Write", color: "bg-orange-500" },
      { id: "pin-read", name: "Pin Read", color: "bg-blue-500" },
      { id: "pwm", name: "PWM", color: "bg-purple-500" },
      { id: "adc", name: "ADC", color: "bg-green-500" },
      { id: "neopixel-led", name: "NeoPixel LED", color: "bg-cyan-500" },
      { id: "buzzor-tone", name: "Buzzer Tone", color: "bg-cyan-500" }
    ]
  },
  { 
    id: "sensor", 
    label: "Sensor",
    icon: <MdOutlineSensors />,
    components: [
      { id: "ultra-sonic", name: "Ultrasonic", color: "bg-blue-500" },
      { id: "dht11-sensor", name: "DHT11 Sensor", color: "bg-blue-500" },
      { id: "ir-sensor", name: "IR Sensor", color: "bg-blue-500" }
    ]
  },
  { 
    id: "motors", 
    label: "Motors",
    icon: <GoGear />,
    components: [
      { id: "l298-motor", name: "L298 Motor Driver", color: "bg-blue-500" },
      { id: "servo-motor", name: "Servo Motor", color: "bg-blue-500" },
    ]
  },
  { 
    id: "display", 
    label: "Display",
    icon: <MdDisplaySettings />,
    components: [
      { id: "1.3in-oled", name: "1.3in Oled display", color: "bg-blue-500" },
      { id: "play-animation", name: "Play Animation", color: "bg-blue-500" },
      { id: "show-image", name: "Show Image", color: "bg-blue-500" }
    ]
  },
] as const;

export function NocodeSidebar({ onSelectComponent, selectedComponent, components = [] }: ComponentPaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Filter components based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return componentCategories;
    
    const query = searchQuery.toLowerCase();
    return componentCategories
      .map(category => ({
        ...category,
        components: category.components.filter(comp => 
          comp.name.toLowerCase().includes(query) ||
          comp.id.toLowerCase().includes(query)
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
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600">
              <span>📁</span>
              <span>Projects</span>
            </div>
            <div className="pl-6 flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" />
              <span>sample.json</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600">
              <span>📁</span>
              <span>Examples</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600">
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
            <h2 className="font-semibold text-sm">Components</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click blocks to add them to your circuit
            </p>
          </div>
          
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search blocks..."
                className="pl-9 bg-gray-200 border-transparent focus:border-border"
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
                  No components found
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
                          <span>{group.icon}</span>
                          <span>{group.label}</span>
                          <span className="text-gray-500">({group.components.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {group.components.map((component) => (
                            <button
                              key={component.id}
                              onClick={() => onSelectComponent(component as any)}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all",
                                "hover:shadow-md hover:scale-105 active:scale-95",
                                selectedComponent?.id === component.id
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-border bg-background hover:border-primary/50"
                              )}
                              data-testid={`component-${component.id}`}
                            >
                              <span className="text-xs font-medium text-center leading-tight">
                                {component.name}
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
