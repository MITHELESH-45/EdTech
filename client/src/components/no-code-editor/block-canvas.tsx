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
  onConnectBlocks: (fromBlockId: string, toBlockId: string, outputType?: string) => void;
  onDeleteConnection?: (connectionId: string) => void;
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
  onDeleteConnection,
  onMoveBlock,
}: BlockCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingFromOutput, setConnectingFromOutput] = useState<string | null>(null); // "true" or "false" for if_else blocks
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace")) {
        if (selectedConnectionId && onDeleteConnection) {
          e.preventDefault();
          onDeleteConnection(selectedConnectionId);
          setSelectedConnectionId(null);
        } else if (selectedBlockId) {
          e.preventDefault();
          onDeleteBlock(selectedBlockId);
        }
      }
      if (e.key === "Escape") {
        setConnectingFrom(null);
        setConnectingFromOutput(null);
        setSelectedConnectionId(null);
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
    if (!canvasRef.current) return { x: 50, y: 50 };
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Convert to canvas coordinates (accounting for transform)
    const canvasX = (screenX - pan.x) / scale;
    const canvasY = (screenY - pan.y) / scale;
    
    // Ensure coordinates are positive and visible
    return { 
      x: Math.max(50, canvasX), 
      y: Math.max(50, canvasY) 
    };
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

    // Check if click is on canvas background (not on a block or button)
    const target = e.target as HTMLElement;
    
    // Don't place if clicking on a block, button, or connector
    if (target.closest('[data-block-id]') || 
        target.tagName === 'BUTTON' || 
        target.closest('button') ||
        target.closest('svg') ||
        (target.closest('.rounded-xl') && !target.classList.contains('canvas-background'))) {
      return;
    }

    // If we have a selected block type, place it on the canvas
    if (selectedBlockType) {
      e.preventDefault();
      e.stopPropagation();
      const pos = getMousePosition(e);
      // Ensure blocks are placed at visible coordinates
      onPlaceBlock(selectedBlockType, Math.max(50, pos.x), Math.max(50, pos.y));
      setConnectingFrom(null);
    } else {
      // Deselect if clicking empty space
      onSelectBlock(null);
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

  // Handle zoom with mouse wheel (Ctrl/Cmd + wheel)
  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom when Ctrl/Cmd is held
    const isZoom = e.ctrlKey || e.metaKey;
    
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
    // If not zooming, allow normal canvas scrolling (pan)
    else if (!isZoom && canvasRef.current) {
      // Allow normal scrolling on the canvas container
      // The canvas container has overflow-auto, so scrolling will work naturally
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

  const handleConnectorClick = (e: React.MouseEvent, blockId: string, isOutput: boolean, outputType?: string) => {
    e.stopPropagation();
    
    if (isOutput) {
      setConnectingFrom(blockId);
      setConnectingFromOutput(outputType || null);
    } else if (connectingFrom && connectingFrom !== blockId) {
      // Pass output type to connection handler if it exists
      if (connectingFromOutput) {
        onConnectBlocks(connectingFrom, blockId, connectingFromOutput);
      } else {
        onConnectBlocks(connectingFrom, blockId);
      }
      setConnectingFrom(null);
      setConnectingFromOutput(null);
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

  // Get connector Y position based on block type and output type
  const getConnectorY = (block: PlacedBlock, outputType?: string) => {
    if (block.blockId === 'if_else' && outputType) {
      // For if_else blocks, true is at top, false is lower
      const height = getBlockHeight(block);
      if (outputType === 'true') {
        return block.y + CONNECTOR_OFFSET_Y;
      } else if (outputType === 'false') {
        return block.y + height - CONNECTOR_OFFSET_Y;
      }
    }
    // Default connector position
    return block.y + CONNECTOR_OFFSET_Y;
  };

  // Generate path that avoids going through the source block
  const generatePathAvoidingSource = (
    fromX: number, fromY: number,
    toX: number, toY: number,
    sourceBlock: PlacedBlock
  ): string => {
    const sourceHeight = getBlockHeight(sourceBlock);
    const sourceTop = sourceBlock.y;
    const sourceBottom = sourceBlock.y + sourceHeight;
    const sourceRight = sourceBlock.x + BLOCK_WIDTH;
    
    // Check if the vertical segment would pass through the source block
    const midX = (fromX + toX) / 2;
    const wouldPassThrough = midX >= sourceBlock.x && midX <= sourceRight &&
                              ((fromY >= sourceTop && fromY <= sourceBottom) ||
                               (toY >= sourceTop && toY <= sourceBottom) ||
                               (fromY < sourceTop && toY > sourceBottom) ||
                               (fromY > sourceBottom && toY < sourceTop));
    
    if (wouldPassThrough) {
      // Add horizontal offset to get away from the block first
      const offsetX = sourceRight + 20; // 20px offset from block edge
      return `M ${fromX} ${fromY} L ${offsetX} ${fromY} L ${offsetX} ${toY} L ${toX} ${toY}`;
    } else {
      // Normal path
      return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 bg-background relative overflow-auto canvas-background"
      style={{ 
        minHeight: '100%', 
        minWidth: '100%',
        backgroundColor: 'hsl(var(--background))',
      }}
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
        className="relative canvas-background"
        style={{
          width: '2000px',
          height: '2000px',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          position: 'relative',
        }}
        onClick={(e) => {
          // Allow clicks on the transform container to place blocks
          // Only if not clicking on a block
          const target = e.target as HTMLElement;
          if (selectedBlockType && !target.closest('[data-block-id]') && !target.closest('button')) {
            e.stopPropagation();
            const pos = getMousePosition(e);
            onPlaceBlock(selectedBlockType, Math.max(50, pos.x), Math.max(50, pos.y));
          }
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-30 canvas-background pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 2px, transparent 2px),
              linear-gradient(to bottom, hsl(var(--border)) 2px, transparent 2px)
            `,
            backgroundSize: `${20 / scale}px ${20 / scale}px`,
            width: '2000px',
            height: '2000px',
          }}
        />

        {/* Render connections */}
        <svg 
          className="absolute inset-0 z-0" 
          style={{ width: '2000px', height: '2000px' }}
        >
          {placedBlocks.map(block => {
            if (!block.nextBlockId) return null;
            const toBlock = placedBlocks.find(b => b.id === block.nextBlockId);
            if (!toBlock) return null;

            const fromX = block.x + BLOCK_WIDTH;
            const fromY = block.y + CONNECTOR_OFFSET_Y;
            const toX = toBlock.x;
            const toY = toBlock.y + CONNECTOR_OFFSET_Y;
            
            // Generate path that avoids going through the source block
            const pathData = generatePathAvoidingSource(fromX, fromY, toX, toY, block);

            // Check if this connection is in the connections array
            const connectionId = connections.find(c => 
              c.fromBlockId === block.id && c.toBlockId === block.nextBlockId
            )?.id;
            const isSelected = connectionId && selectedConnectionId === connectionId;

            return (
              <g key={`${block.id}-${block.nextBlockId}`}>
                {/* Invisible wider path for easier clicking */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(20, 20 / scale)}
                  strokeLinecap="round"
                  style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connectionId) {
                      setSelectedConnectionId(connectionId);
                    }
                    setConnectingFrom(null);
                    setConnectingFromOutput(null);
                    onSelectBlock(null);
                  }}
                />
                {/* Visible path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? "#ef4444" : "#9ca3af"}
                  strokeWidth={(isSelected ? 3 : 2) / scale}
                  strokeLinecap="round"
                  strokeDasharray={isSelected ? "none" : `${4 / scale} ${4 / scale}`}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}
          
          {/* Also render explicit connections if they exist */}
          {connections.map(conn => {
            const fromBlock = placedBlocks.find(b => b.id === conn.fromBlockId);
            const toBlock = placedBlocks.find(b => b.id === conn.toBlockId);
            if (!fromBlock || !toBlock) return null;
            // Skip if already rendered via nextBlockId (unless it has a specific output type)
            if (fromBlock.nextBlockId === conn.toBlockId && !conn.fromField) return null;

            const fromX = fromBlock.x + BLOCK_WIDTH;
            const fromY = getConnectorY(fromBlock, conn.fromField);
            const toX = toBlock.x;
            const toY = toBlock.y + CONNECTOR_OFFSET_Y;
            
            // Generate path that avoids going through the source and destination blocks
            const pathData = generatePathAvoidingSource(fromX, fromY, toX, toY, fromBlock);
            
            const isSelected = selectedConnectionId === conn.id;
            // Use grey for unselected, red for selected
            const strokeColor = isSelected ? "#ef4444" : "#9ca3af";

            return (
              <g key={conn.id}>
                {/* Invisible wider path for easier clicking */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(20, 20 / scale)}
                  strokeLinecap="round"
                  style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConnectionId(conn.id);
                    setConnectingFrom(null);
                    setConnectingFromOutput(null);
                    onSelectBlock(null);
                  }}
                />
                {/* Visible path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={(isSelected ? 3 : 2) / scale}
                  strokeLinecap="round"
                  strokeDasharray={isSelected ? "none" : `${4 / scale} ${4 / scale}`}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}

          {/* Preview connection line */}
          {connectingFrom && (
            (() => {
              const fromBlock = placedBlocks.find(b => b.id === connectingFrom);
              if (!fromBlock) return null;
              const fromX = fromBlock.x + BLOCK_WIDTH;
              const fromY = getConnectorY(fromBlock, connectingFromOutput || undefined);
              // Use grey for preview
              const strokeColor = "#9ca3af";
              return (
                <path
                  d={`M ${fromX} ${fromY} L ${mousePos.x} ${mousePos.y}`}
                  fill="none"
                  stroke={strokeColor}
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
          if (!schema) {
            console.warn(`Block schema not found for: ${block.blockId}`);
            return null;
          }

          const isSelected = selectedBlockId === block.id;
          const height = getBlockHeight(block);

          return (
            <div
              key={block.id}
              data-block-id={block.id}
              className={cn(
                "absolute z-20 cursor-move transition-shadow",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              style={{
                left: `${block.x}px`,
                top: `${block.y}px`,
                width: `${BLOCK_WIDTH}px`,
                minHeight: `${height}px`,
                position: 'absolute',
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (!isPanning && !isSpacePressed) {
                  handleBlockMouseDown(e, block.id);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
            <div
              className="rounded-xl border-2 shadow-lg bg-card text-foreground"
              style={{ 
                minHeight: `${height}px`,
                borderColor: schema.color,
                opacity: 1,
                position: 'relative',
                zIndex: 10,
                backgroundColor: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
              }}
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

              {/* Output connectors - two for if_else blocks, one for others */}
              {block.blockId === 'if_else' ? (
                <div className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-start pt-5 gap-8">
                  {/* True output (top) */}
                  <button
                    onClick={(e) => handleConnectorClick(e, block.id, true, 'true')}
                    className={cn(
                      "w-3 h-3 rounded-full border-2 bg-background transition-all",
                      connectingFrom === block.id && connectingFromOutput === 'true' ? "border-green-500 scale-125" : "border-green-500/70 hover:border-green-500"
                    )}
                    style={{ marginRight: -CONNECTOR_SIZE / 2 }}
                    title="True path (condition is true)"
                  />
                  {/* False output (bottom) */}
                  <button
                    onClick={(e) => handleConnectorClick(e, block.id, true, 'false')}
                    className={cn(
                      "w-3 h-3 rounded-full border-2 bg-background transition-all",
                      connectingFrom === block.id && connectingFromOutput === 'false' ? "border-red-500 scale-125" : "border-red-500/70 hover:border-red-500"
                    )}
                    style={{ marginRight: -CONNECTOR_SIZE / 2 }}
                    title="False path (condition is false)"
                  />
                </div>
              ) : (
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
              )}

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