import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { componentMetadata } from "@/lib/circuit-types";
import type { PlacedComponent } from "@shared/schema";
import type { McuPinStateMap, PinLogicState } from "@/lib/simulation-engine";
import { X, Cpu } from "lucide-react";

interface LogicPanelProps {
  placedComponents: PlacedComponent[];
  mcuPinStates: McuPinStateMap;
  onChangePinState: (placedId: string, pinId: string, state: PinLogicState) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PIN_STATE_LABELS: Record<PinLogicState, string> = {
  HIGH: "HIGH",
  LOW: "LOW",
  INPUT: "INPUT",
};

export function LogicPanel({
  placedComponents,
  mcuPinStates,
  onChangePinState,
  open,
  onOpenChange,
}: LogicPanelProps) {
  const boards = placedComponents.filter((p) =>
    p.componentId === "arduino-uno" || p.componentId === "esp32"
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <SheetTitle>Logic / Code</SheetTitle>
            </div>
          </div>
          <SheetDescription>
            Set mock pin states (HIGH/LOW/INPUT). HIGH and LOW act as voltage sources
            in the simulation.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          {boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Cpu className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No MCU board found in the circuit.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add an Arduino UNO or ESP32 to configure pin states.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {boards.map((placed) => {
                const meta = componentMetadata[placed.componentId];
                const label =
                  placed.componentId === "arduino-uno" ? "Arduino UNO" : "ESP32";
                if (!meta) return null;

                const pins = meta.terminals.filter(
                  (t) =>
                    (t.type === "signal" || t.type === "gpio") && !["5v", "3v3", "gnd", "gnd2", "vin"].includes(t.id)
                );

                const statesForBoard = mcuPinStates[placed.id] ?? {};

                return (
                  <div
                    key={placed.id}
                    className="border border-border rounded-lg bg-muted/30 overflow-hidden"
                  >
                    {/* Board Header */}
                    <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          placed.componentId === "arduino-uno" ? "bg-teal-500" : "bg-slate-700"
                        )} />
                        <span className="text-sm font-semibold">{label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {pins.length} pins
                      </Badge>
                    </div>

                    {/* Pin List */}
                    <div className="p-3">
                      {pins.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No configurable logic pins on this board.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {pins.map((pin) => {
                            const currentState: PinLogicState =
                              statesForBoard[pin.id] ?? "INPUT";
                            return (
                              <div
                                key={pin.id}
                                className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                              >
                                <span className="text-sm font-mono min-w-[60px]">
                                  {pin.name}
                                </span>
                                <div className="inline-flex rounded-md border border-border overflow-hidden bg-background">
                                  {(["INPUT", "HIGH", "LOW"] as PinLogicState[]).map(
                                    (state) => (
                                      <Button
                                        key={state}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "h-7 px-3 text-xs rounded-none border-l border-border first:border-l-0 transition-all",
                                          currentState === state
                                            ? state === "HIGH"
                                              ? "bg-red-500/20 text-red-600 font-semibold"
                                              : state === "LOW"
                                              ? "bg-slate-500/20 text-slate-700 dark:text-slate-300 font-semibold"
                                              : "bg-primary/20 text-primary font-semibold"
                                            : "hover:bg-muted"
                                        )}
                                        onClick={() =>
                                          onChangePinState(placed.id, pin.id, state)
                                        }
                                      >
                                        {PIN_STATE_LABELS[state]}
                                      </Button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer with info */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>INPUT:</strong> Pin reads external voltage (default)</p>
            <p><strong>HIGH:</strong> Pin outputs 5V (Arduino) or 3.3V (ESP32)</p>
            <p><strong>LOW:</strong> Pin outputs 0V (Ground)</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}








