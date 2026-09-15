import React, { useState, useRef } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ZoomIn, ZoomOut, RotateCcw, Share2 } from 'lucide-react';
import type { VaultCategory } from '@/types';

const CATEGORY_COLORS: Record<VaultCategory, string> = {
  lore: 'var(--accent-primary)',
  location: 'var(--status-warning)',
  npc: 'var(--status-danger)',
  item: 'var(--status-info)',
  rule: 'var(--text-muted)',
  quest: 'var(--accent-secondary)',
};

export const VaultGraph: React.FC = () => {
  const getGraphData = useVaultStore((state) => state.getGraphData);
  const selectDocument = useVaultStore((state) => state.selectDocument);
  const activeDocumentId = useVaultStore((state) => state.activeDocumentId);

  const { nodes: initialNodes, edges } = getGraphData();

  const [nodes, setNodes] = useState(initialNodes);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync nodes if documents change count
  React.useEffect(() => {
    setNodes(getGraphData().nodes);
  }, [getGraphData]);

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingNodeId(id);
    selectDocument(id);
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingNodeId) {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId
            ? {
                ...node,
                x: (e.clientX - pan.x - 300) / zoom,
                y: (e.clientY - pan.y - 100) / zoom,
              }
            : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Build node lookup map for quick edge rendering
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-[calc(100vh-3.5rem)] overflow-hidden bg-bg-primary select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Floating Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Card className="p-1 flex gap-1 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Resetar Grafo"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Card>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Card className="p-2 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card text-xs flex items-center gap-2 text-text-muted">
          <Share2 className="w-4 h-4 text-accent" />
          <span>Grafo Nativo SVG (Sem bibliotecas pesadas)</span>
        </Card>
      </div>

      {/* SVG Interactive Canvas */}
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render Edges */}
        <g stroke="currentColor" className="text-border-default" strokeWidth={2}>
          {edges.map((edge, idx) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;

            return (
              <line
                key={`edge-${idx}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                strokeOpacity={0.6}
                strokeDasharray="4 2"
              />
            );
          })}
        </g>

        {/* Render Nodes */}
        {nodes.map((node) => {
          const isSelected = node.id === activeDocumentId;
          const color = CATEGORY_COLORS[node.category];

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleMouseDownNode(e, node.id)}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              {/* Outer halo */}
              <circle
                r={isSelected ? 26 : 20}
                fill={color}
                fillOpacity={0.25}
                stroke={color}
                strokeWidth={isSelected ? 3 : 1.5}
              />

              {/* Core dot */}
              <circle r={7} fill={color} />

              {/* Label */}
              <text
                y={32}
                textAnchor="middle"
                className="text-[11px] font-medium fill-current text-text-primary pointer-events-none"
              >
                {node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
