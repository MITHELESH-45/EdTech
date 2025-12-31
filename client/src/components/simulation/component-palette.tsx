import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ElectronicComponent } from "@shared/schema";

interface ComponentPaletteProps {
  onSelectComponent: (component: ElectronicComponent) => void;
  selectedComponent: ElectronicComponent | null;
  components?: ElectronicComponent[];
}

const componentCategories = [
  { id: "base", label: "Base Components" },
  { id: "power", label: "Power" },
  { id: "boards", label: "Boards" },
  { id: "structure", label: "Structure" }
] as const;

function ComponentIcon({ componentId, className }: { componentId: string; className?: string }) {
  const iconMap: Record<string, JSX.Element> = {
    led: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="20" cy="16" r="8" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="16" r="8" />
        <line x1="16" y1="24" x2="16" y2="34" />
        <line x1="24" y1="24" x2="24" y2="34" />
        <path d="M14 8 L10 4" />
        <path d="M26 8 L30 4" />
        <path d="M20 6 L20 2" />
      </svg>
    ),
    resistor: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="4" y1="20" x2="10" y2="20" />
        <path d="M10 20 L12 14 L16 26 L20 14 L24 26 L28 14 L30 20" />
        <line x1="30" y1="20" x2="36" y2="20" />
      </svg>
    ),
    button: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="12" width="20" height="16" rx="2" />
        <circle cx="20" cy="20" r="5" fill="currentColor" opacity="0.3" />
        <line x1="4" y1="20" x2="10" y2="20" />
        <line x1="30" y1="20" x2="36" y2="20" />
      </svg>
    ),
    buzzer: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="20" cy="18" r="10" />
        <circle cx="20" cy="18" r="4" fill="currentColor" opacity="0.3" />
        <line x1="16" y1="28" x2="16" y2="34" />
        <line x1="24" y1="28" x2="24" y2="34" />
        <text x="20" y="20" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">+</text>
      </svg>
    ),
    potentiometer: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="12" width="24" height="16" rx="2" />
        <circle cx="20" cy="20" r="6" />
        <line x1="20" y1="14" x2="20" y2="20" />
        <line x1="12" y1="28" x2="12" y2="34" />
        <line x1="20" y1="28" x2="20" y2="34" />
        <line x1="28" y1="28" x2="28" y2="34" />
      </svg>
    ),
    ultrasonic: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="10" width="28" height="18" rx="2" />
        <circle cx="14" cy="19" r="5" />
        <circle cx="26" cy="19" r="5" />
        <line x1="10" y1="28" x2="10" y2="34" />
        <line x1="17" y1="28" x2="17" y2="34" />
        <line x1="23" y1="28" x2="23" y2="34" />
        <line x1="30" y1="28" x2="30" y2="34" />
      </svg>
    ),
    "ir-sensor": (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="8" width="20" height="24" rx="2" />
        <circle cx="20" cy="16" r="4" fill="currentColor" opacity="0.3" />
        <rect x="16" y="24" width="8" height="4" fill="currentColor" opacity="0.2" />
        <line x1="14" y1="32" x2="14" y2="36" />
        <line x1="20" y1="32" x2="20" y2="36" />
        <line x1="26" y1="32" x2="26" y2="36" />
      </svg>
    ),
    dht11: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="6" width="20" height="26" rx="2" />
        <rect x="14" y="10" width="12" height="12" rx="1" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="16" r="3" />
        <line x1="14" y1="32" x2="14" y2="36" />
        <line x1="20" y1="32" x2="20" y2="36" />
        <line x1="26" y1="32" x2="26" y2="36" />
      </svg>
    ),
    servo: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="12" width="28" height="16" rx="2" />
        <circle cx="30" cy="20" r="4" />
        <line x1="30" y1="16" x2="36" y2="10" strokeWidth="2" />
        <line x1="10" y1="28" x2="10" y2="34" />
        <line x1="20" y1="28" x2="20" y2="34" />
        <line x1="30" y1="28" x2="30" y2="34" />
      </svg>
    ),
    "power-5v": (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="20" cy="20" r="12" />
        <text x="20" y="24" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none" fontWeight="bold">5V</text>
      </svg>
    ),
    ground: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="20" y1="8" x2="20" y2="16" />
        <line x1="10" y1="16" x2="30" y2="16" />
        <line x1="14" y1="22" x2="26" y2="22" />
        <line x1="18" y1="28" x2="22" y2="28" />
      </svg>
    ),
    object: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="10" width="20" height="20" rx="3" fill="currentColor" opacity="0.2" />
        <rect x="10" y="10" width="20" height="20" rx="3" />
        <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    arduino: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="10" width="28" height="20" rx="2" />
        <rect x="10" y="14" width="4" height="3" fill="currentColor" opacity="0.3" />
        <circle cx="30" cy="26" r="2" />
        <line x1="8" y1="6" x2="8" y2="10" />
        <line x1="12" y1="6" x2="12" y2="10" />
        <line x1="16" y1="6" x2="16" y2="10" />
      </svg>
    ),
    esp32: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="24" height="24" rx="2" />
        <rect x="14" y="14" width="12" height="8" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="28" r="2" fill="currentColor" opacity="0.5" />
        <line x1="10" y1="4" x2="10" y2="8" />
        <line x1="15" y1="4" x2="15" y2="8" />
        <line x1="25" y1="4" x2="25" y2="8" />
        <line x1="30" y1="4" x2="30" y2="8" />
      </svg>
    ),
    breadboard: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="8" width="32" height="24" rx="1" />
        <line x1="4" y1="20" x2="36" y2="20" strokeDasharray="2 2" />
        {[8, 14, 20, 26, 32].map((x) => (
          <g key={x}>
            <circle cx={x} cy="13" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx={x} cy="27" r="1.5" fill="currentColor" opacity="0.3" />
          </g>
        ))}
      </svg>
    ),
    wire: (
      <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20 Q20 8 36 20" />
        <circle cx="4" cy="20" r="2" fill="currentColor" />
        <circle cx="36" cy="20" r="2" fill="currentColor" />
      </svg>
    ),
  };

  return iconMap[componentId] || (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="8" width="24" height="24" rx="4" />
    </svg>
  );
}

export function ComponentPalette({ onSelectComponent, selectedComponent, components = [] }: ComponentPaletteProps) {
  const groupedComponents = componentCategories.map((category) => ({
    ...category,
    components: components.filter((c) => c.category === category.id),
  }));

  return (
    <div className="flex flex-col bg-card border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Components</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Click to place on canvas
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {groupedComponents.map((group) => (
            group.components.length > 0 && (
              <div key={group.id}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {group.label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.components.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => onSelectComponent(component)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all",
                        "hover-elevate active-elevate-2",
                        selectedComponent?.id === component.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      )}
                      data-testid={`component-${component.id}`}
                    >
                      <ComponentIcon
                        componentId={component.icon}
                        className={cn(
                          "w-8 h-8",
                          selectedComponent?.id === component.id
                            ? "text-primary"
                            : "text-foreground"
                        )}
                      />
                      <span className="text-xs font-medium text-center leading-tight">
                        {component.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
