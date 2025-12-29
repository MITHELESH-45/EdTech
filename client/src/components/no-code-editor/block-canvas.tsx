import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { InlineFieldRenderer } from "./blocks/InlineFieldRenderer";
import type { PlacedBlock, BlockConnection } from "@/lib/block-types";
import { schemaData } from "@/lib/no-code-blocks";

interface BlockCanvasProps {
  placedBlocks: PlacedBlock[];
  connections: BlockConnection[];
  selectedBlockId: string | null;
  selectedBlockType: string | null; // Block ID from sidebar (e.g., "print", "for_loop")
  onPlaceBlock: (blockId: string, x: number, y: number) => void;
  onSelectBlock: (blockId: string | null) => void;
  onDeleteBlock: (blockId: string) => void;
  onUpdateBlockValues: (blockId: string, values: Record<string, any>) => void;
  onConnectBlocks: (fromBlockId: string, toBlockId: string) => void;
  onMoveBlock?: (blockId: string, x: number, y: number) => void;
}

const BLOCK_WIDTH = 250;
const BLOCK_MIN_HEIGHT = 80;
const CONNECTOR_SIZE = 12;
const CONNECTOR_OFFSET_Y = 20;

export function BlockCanvas({
  placedBlocks,
  connections,
  selectedBlockId,
  selectedBlockType,
  onPlaceBlock,
  onSelectBlock,
  onDeleteBlock,
  onUpdateBlockValues,
  onConnectBlocks,
  onMoveBlock,
}: BlockCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockId) {
        e.preventDefault();
        onDeleteBlock(selectedBlockId);
      }
      if (e.key === "Escape") {
        setConnectingFrom(null);
        onSelectBlock(null);
      }
      if (e.key === " " && !isPanning) {
        e.preventDefault();
        setIsSpacePressed(true);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grab";
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setIsSpacePressed(false);
        if (canvasRef.current && !isPanning) {
          canvasRef.current.style.cursor = "default";
        }
      }
    };

    // Prevent middle mouse button auto-scroll
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 && canvasRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 1 && canvasRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [selectedBlockId, onDeleteBlock, onSelectBlock, isPanning]);

  // Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Convert to canvas coordinates
    const canvasX = (screenX - pan.x) / scale;
    const canvasY = (screenY - pan.y) / scale;
    
    return { x: canvasX, y: canvasY };
  }, [scale, pan]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * scale + pan.x,
      y: canvasY * scale + pan.y,
    };
  }, [scale, pan]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't handle click if we just finished panning
    if (isPanning) {
      setIsPanning(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isSpacePressed ? "grab" : "default";
      }
      return;
    }

    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      if (selectedBlockType) {
        const pos = getMousePosition(e);
        onPlaceBlock(selectedBlockType, pos.x, pos.y);
      } else {
        onSelectBlock(null);
      }
      setConnectingFrom(null);
    }
  };

  // Handle panning
  const handlePanStart = (e: React.MouseEvent) => {
    // Start panning with middle mouse button or space + left click
    const isMiddleButton = e.button === 1;
    const isSpaceLeftButton = isSpacePressed && e.button === 0;
    
    if (isMiddleButton || isSpaceLeftButton) {
      e.preventDefault();
      setIsPanning(true);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grabbing";
      }
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePanEnd = () => {
    if (isPanning) {
      setIsPanning(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isSpacePressed ? "grab" : "default";
      }
    }
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    // Allow zoom with Ctrl/Cmd + wheel, or just wheel (when not holding shift)
    const isZoom = (e.ctrlKey || e.metaKey) || !e.shiftKey;
    
    if (isZoom && canvasRef.current) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Zoom factor
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.25, Math.min(3, scale * zoomFactor));
      
      // Zoom towards mouse position
      const zoomPointX = (mouseX - pan.x) / scale;
      const zoomPointY = (mouseY - pan.y) / scale;
      
      const newPanX = mouseX - zoomPointX * newScale;
      const newPanY = mouseY - zoomPointY * newScale;
      
      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string) => {
    // Don't start dragging if panning or space is pressed
    if (isPanning || isSpacePressed || e.button === 1) {
      return;
    }
    
    // Don't start dragging if clicking on an input field
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.closest('input, select')) {
      return;
    }
    
    e.stopPropagation();
    const block = placedBlocks.find(b => b.id === blockId);
    if (!block) return;

    const pos = getMousePosition(e);
    setDragging(blockId);
    setDragOffset({
      x: pos.x - block.x,
      y: pos.y - block.y,
    });
    onSelectBlock(blockId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    setMousePos(pos);

    // Handle panning
    handlePanMove(e);

    // Handle block dragging
    if (dragging && onMoveBlock && !isPanning) {
      const block = placedBlocks.find(b => b.id === dragging);
      if (block) {
        const newX = Math.max(0, pos.x - dragOffset.x);
        const newY = Math.max(0, pos.y - dragOffset.y);
        onMoveBlock(dragging, newX, newY);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    handlePanEnd();
    
    if (e.button !== 1) { // Don't stop dragging on middle mouse up
      setDragging(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleConnectorClick = (e: React.MouseEvent, blockId: string, isOutput: boolean) => {
    e.stopPropagation();
    
    if (isOutput) {
      setConnectingFrom(blockId);
    } else if (connectingFrom && connectingFrom !== blockId) {
      onConnectBlocks(connectingFrom, blockId);
      setConnectingFrom(null);
    }
  };


  const getBlockSchema = (blockId: string) => {
    for (const category of schemaData.categories) {
      const block = category.components.find(c => c.id === blockId);
      if (block) return block;
    }
    return null;
  };

  const getBlockHeight = (block: PlacedBlock) => {
    const schema = getBlockSchema(block.blockId);
    if (!schema) return BLOCK_MIN_HEIGHT;
    
    const fieldCount = Object.keys(schema.fields).length;
    if (fieldCount === 0) return 50; // Just header height
    
    // Header (40px) + padding (16px top + 16px bottom) + fields (~28px each with spacing)
    return Math.max(BLOCK_MIN_HEIGHT, 40 + 32 + fieldCount * 28);
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 bg-muted/30 relative overflow-hidden canvas-background"
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseDown={handlePanStart}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onMouseLeave={handlePanEnd}
      tabIndex={0}
    >
      {/* Canvas container with transform */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-30 canvas-background"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${20 / scale}px ${20 / scale}px`,
          }}
        />

        {/* Render connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ width: '100%', height: '100%' }}>
          {placedBlocks.map(block => {
            if (!block.nextBlockId) return null;
            const toBlock = placedBlocks.find(b => b.id === block.nextBlockId);
            if (!toBlock) return null;

            const fromX = block.x + BLOCK_WIDTH;
            const fromY = block.y + CONNECTOR_OFFSET_Y;
            const toX = toBlock.x;
            const toY = toBlock.y + CONNECTOR_OFFSET_Y;
            const midX = (fromX + toX) / 2;

            return (
              <path
                key={`${block.id}-${block.nextBlockId}`}
                d={`M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2 / scale}
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Also render explicit connections if they exist */}
          {connections.map(conn => {
            const fromBlock = placedBlocks.find(b => b.id === conn.fromBlockId);
            const toBlock = placedBlocks.find(b => b.id === conn.toBlockId);
            if (!fromBlock || !toBlock) return null;
            // Skip if already rendered via nextBlockId
            if (fromBlock.nextBlockId === conn.toBlockId) return null;

            const fromX = fromBlock.x + BLOCK_WIDTH;
            const fromY = fromBlock.y + CONNECTOR_OFFSET_Y;
            const toX = toBlock.x;
            const toY = toBlock.y + CONNECTOR_OFFSET_Y;
            const midX = (fromX + toX) / 2;

            return (
              <path
                key={conn.id}
                d={`M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2 / scale}
                strokeLinecap="round"
              />
            );
          })}

          {/* Preview connection line */}
          {connectingFrom && (
            (() => {
              const fromBlock = placedBlocks.find(b => b.id === connectingFrom);
              if (!fromBlock) return null;
              const fromX = fromBlock.x + BLOCK_WIDTH;
              const fromY = fromBlock.y + CONNECTOR_OFFSET_Y;
              return (
                <path
                  d={`M ${fromX} ${fromY} L ${mousePos.x} ${mousePos.y}`}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={2 / scale}
                  strokeDasharray={`${4 / scale} ${4 / scale}`}
                />
              );
            })()
          )}
        </svg>

        {/* Render blocks */}
        {placedBlocks.map(block => {
          const schema = getBlockSchema(block.blockId);
          if (!schema) return null;

          const isSelected = selectedBlockId === block.id;
          const height = getBlockHeight(block);

          return (
            <div
              key={block.id}
              className={cn(
                "absolute z-10 cursor-move transition-shadow",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              style={{
                left: block.x,
                top: block.y,
                width: BLOCK_WIDTH,
              }}
              onMouseDown={(e) => {
                if (!isPanning && !isSpacePressed) {
                  handleBlockMouseDown(e, block.id);
                }
              }}
            >
            <div
              className="rounded-xl border shadow-lg bg-card"
              style={{ minHeight: height }}
            >
              {/* Connection points */}
              <div className="absolute left-0 top-0 bottom-0 flex items-start pt-5">
                <button
                  onClick={(e) => handleConnectorClick(e, block.id, false)}
                  className={cn(
                    "w-3 h-3 rounded-full border-2 bg-background transition-all",
                    connectingFrom ? "border-green-500 hover:scale-125" : "border-muted-foreground/50 hover:border-blue-500"
                  )}
                  style={{ marginLeft: -CONNECTOR_SIZE / 2 }}
                  title="Connect from here"
                />
              </div>

              <div className="absolute right-0 top-0 bottom-0 flex items-start pt-5">
                <button
                  onClick={(e) => handleConnectorClick(e, block.id, true)}
                  className={cn(
                    "w-3 h-3 rounded-full border-2 bg-background transition-all",
                    connectingFrom === block.id ? "border-green-500 scale-125" : "border-muted-foreground/50 hover:border-blue-500"
                  )}
                  style={{ marginRight: -CONNECTOR_SIZE / 2 }}
                  title="Connect to here"
                />
              </div>

              {/* Block header */}
              <div
                className="px-3 py-2 font-semibold text-white rounded-t-xl"
                style={{ backgroundColor: schema.color }}
              >
                {schema.label}
              </div>

              {/* Block fields - always visible and editable */}
              {Object.keys(schema.fields).length > 0 && (
                <div className="px-3 py-2 bg-card rounded-b-xl">
                  <InlineFieldRenderer
                    fields={schema.fields}
                    values={block.fieldValues}
                    onChange={(key, value) => {
                      onUpdateBlockValues(block.id, {
                        ...block.fieldValues,
                        [key]: value,
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

        {/* Preview block when selecting from sidebar */}
        {selectedBlockType && !dragging && (
          <div
            className="absolute z-0 pointer-events-none opacity-50"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: BLOCK_WIDTH,
            }}
          >
            <div className="rounded-xl border-2 border-dashed border-primary bg-card/50 backdrop-blur-sm p-3">
              <div className="text-sm font-semibold text-foreground">
                {getBlockSchema(selectedBlockType)?.label || selectedBlockType}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {placedBlocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-lg border border-border">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Start Building</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select a block from the sidebar and click on the canvas to place it
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Zoom controls (optional) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => setScale(Math.min(3, scale + 0.1))}
          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded hover:bg-accent text-foreground text-sm font-semibold"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setScale(Math.max(0.25, scale - 0.1))}
          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded hover:bg-accent text-foreground text-sm font-semibold"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPan({ x: 0, y: 0 });
          }}
          className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded hover:bg-accent text-foreground text-xs"
          title="Reset zoom"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}

