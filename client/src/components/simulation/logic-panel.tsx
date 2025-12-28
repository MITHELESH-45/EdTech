import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { componentMetadata } from "@/lib/circuit-types";
import type { PlacedComponent } from "@shared/schema";
import type { McuPinStateMap, PinLogicState } from "@/lib/simulation-engine";

interface LogicPanelProps {
  placedComponents: PlacedComponent[];
  mcuPinStates: McuPinStateMap;
  onChangePinState: (placedId: string, pinId: string, state: PinLogicState) => void;
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
}: LogicPanelProps) {
  const boards = placedComponents.filter((p) =>
    p.componentId === "arduino-uno" || p.componentId === "esp32"
  );

  if (boards.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col bg-card border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Logic / Code</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set mock pin states (HIGH/LOW/INPUT). HIGH and LOW act as voltage sources
          in the simulation.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
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
                className="border border-border rounded-md bg-muted/40 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{label}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {placed.id}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {pins.length} logic pin{pins.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {pins.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    No configurable logic pins on this board.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {pins.map((pin) => {
                      const currentState: PinLogicState =
                        statesForBoard[pin.id] ?? "INPUT";
                      return (
                        <div
                          key={pin.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-[11px] font-mono">
                            {pin.name}
                          </span>
                          <div className="inline-flex rounded-md border border-border overflow-hidden">
                            {(["INPUT", "HIGH", "LOW"] as PinLogicState[]).map(
                              (state) => (
                                <Button
                                  key={state}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-6 px-2 text-[10px] rounded-none border-l border-border first:border-l-0",
                                    currentState === state &&
                                      (state === "HIGH"
                                        ? "bg-red-500/10 text-red-600"
                                        : state === "LOW"
                                        ? "bg-gray-500/10 text-gray-700"
                                        : "bg-primary/10 text-primary")
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
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}








