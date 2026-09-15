import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  Search,
  ExternalLink,
} from 'lucide-react';
import type { VaultCategory, VaultGraphNode } from '@/types';

const CATEGORY_COLORS: Record<VaultCategory, string> = {
  lore: 'var(--accent-primary)',
  location: 'var(--status-warning)',
  npc: 'var(--status-danger)',
  item: 'var(--status-info)',
  rule: 'var(--text-muted)',
  quest: 'var(--accent-secondary)',
  session: 'var(--status-success)',
};

interface SimulationNode extends VaultGraphNode {
  vx: number;
  vy: number;
  radius: number;
  degree: number;
}

interface VaultGraphProps {
  onOpenDocument?: (id: string) => void;
}

export const VaultGraph: React.FC<VaultGraphProps> = ({ onOpenDocument }) => {
  const getGraphData = useVaultStore((state) => state.getGraphData);
  const selectDocument = useVaultStore((state) => state.selectDocument);
  const activeDocumentId = useVaultStore((state) => state.activeDocumentId);
  const documents = useVaultStore((state) => state.documents);

  const { nodes: rawNodes, edges } = getGraphData();

  // Degree calculation (how many connections each node has)
  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of rawNodes) map.set(n.id, 0);
    for (const e of edges) {
      map.set(e.source, (map.get(e.source) || 0) + 1);
      map.set(e.target, (map.get(e.target) || 0) + 1);
    }
    return map;
  }, [rawNodes, edges]);

  // Transform raw nodes into simulation nodes
  const [nodes, setNodes] = useState<SimulationNode[]>(() =>
    rawNodes.map((n) => {
      const degree = degreeMap.get(n.id) || 0;
      return {
        ...n,
        vx: 0,
        vy: 0,
        degree,
        radius: Math.min(32, Math.max(16, 16 + degree * 3)),
      };
    })
  );

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<VaultCategory | 'all'>('all');
  const [graphSearch, setGraphSearch] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync simulation nodes if documents count or connections change
  useEffect(() => {
    const fresh = getGraphData();
    setNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return fresh.nodes.map((n) => {
        const existing = prevMap.get(n.id);
        const degree = degreeMap.get(n.id) || 0;
        return {
          ...n,
          x: existing ? existing.x : n.x,
          y: existing ? existing.y : n.y,
          vx: existing ? existing.vx : 0,
          vy: existing ? existing.vy : 0,
          degree,
          radius: Math.min(32, Math.max(16, 16 + degree * 3)),
        };
      });
    });
  }, [documents.length, degreeMap, getGraphData]);

  // Lightweight Force Simulation Loop (Physics: Repulsion + Edge springs + Center pull)
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      setNodes((currentNodes) => {
        const nextNodes = currentNodes.map((n) => ({ ...n }));
        const nodeMap = new Map(nextNodes.map((n) => [n.id, n]));

        const centerForce = 0.005;
        const repulsionStrength = 1200;
        const springLength = 110;
        const springStrength = 0.04;
        const damping = 0.88;

        const centerX = 450;
        const centerY = 350;

        // 1. Repulsion between all node pairs
        for (let i = 0; i < nextNodes.length; i++) {
          const a = nextNodes[i];
          for (let j = i + 1; j < nextNodes.length; j++) {
            const b = nextNodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < 400) {
              const force = repulsionStrength / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (a.id !== draggingNodeId) {
                a.vx -= fx;
                a.vy -= fy;
              }
              if (b.id !== draggingNodeId) {
                b.vx += fx;
                b.vy += fy;
              }
            }
          }
        }

        // 2. Spring attraction along edges
        for (const edge of edges) {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) continue;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - springLength;
          const force = displacement * springStrength;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (source.id !== draggingNodeId) {
            source.vx += fx;
            source.vy += fy;
          }
          if (target.id !== draggingNodeId) {
            target.vx -= fx;
            target.vy -= fy;
          }
        }

        // 3. Center gravity and position integration
        for (const node of nextNodes) {
          if (node.id === draggingNodeId) continue;

          // Pull to center
          node.vx += (centerX - node.x) * centerForce;
          node.vy += (centerY - node.y) * centerForce;

          // Damping
          node.vx *= damping;
          node.vy *= damping;

          // Velocity clamp
          node.vx = Math.max(-15, Math.min(15, node.vx));
          node.vy = Math.max(-15, Math.min(15, node.vy));

          node.x += node.vx;
          node.y += node.vy;
        }

        return nextNodes;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [edges, draggingNodeId]);

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
      const containerRect = containerRef.current?.getBoundingClientRect();
      const originX = containerRect ? containerRect.left : 0;
      const originY = containerRect ? containerRect.top : 0;

      const worldX = (e.clientX - originX - pan.x) / zoom;
      const worldY = (e.clientY - originY - pan.y) / zoom;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId
            ? {
                ...node,
                x: worldX,
                y: worldY,
                vx: 0,
                vy: 0,
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

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const hoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) : null;
  const hoveredDoc = hoveredNodeId ? documents.find((d) => d.id === hoveredNodeId) : null;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-[calc(100vh-3.5rem)] overflow-hidden bg-bg-primary select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Floating Graph Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Card className="p-1 flex gap-1 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom((z) => Math.max(0.3, z / 1.2))}
            title="Diminuir Zoom"
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
            title="Resetar Vista"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Card>

        {/* Filter categories directly on graph */}
        <Card className="p-1.5 flex gap-1 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card overflow-x-auto max-w-sm">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              categoryFilter === 'all'
                ? 'bg-accent text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Todos
          </button>
          {(['lore', 'npc', 'location', 'item', 'rule', 'quest', 'session'] as VaultCategory[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition-colors ${
                  categoryFilter === cat
                    ? 'bg-accent text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </Card>
      </div>

      {/* Top Search in Graph */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Localizar nó..."
            value={graphSearch}
            onChange={(e) => setGraphSearch(e.target.value)}
            className="w-44 bg-bg-secondary/90 backdrop-blur border border-border-default rounded pl-8 pr-3 py-1 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
          />
        </div>

        <Card className="p-2 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card text-xs flex items-center gap-2 text-text-muted">
          <Share2 className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">Grafo de Conhecimento SVG</span>
        </Card>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && hoveredDoc && (
        <div
          className="absolute z-20 pointer-events-none transition-all"
          style={{
            left: `${hoveredNode.x * zoom + pan.x + 25}px`,
            top: `${hoveredNode.y * zoom + pan.y - 45}px`,
          }}
        >
          <Card className="p-2.5 bg-bg-elevated/95 backdrop-blur border border-border-default shadow-card text-xs space-y-1 max-w-xs">
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="text-[10px] uppercase">
                {hoveredDoc.category}
              </Badge>
              <h5 className="font-bold text-text-primary truncate">{hoveredDoc.title}</h5>
            </div>
            <p className="text-[10px] text-text-muted line-clamp-2">
              {hoveredDoc.content.replace(/^#+ /, '')}
            </p>
            <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border-subtle">
              <span>{hoveredNode.degree} conexões</span>
              <button
                type="button"
                onClick={() => {
                  selectDocument(hoveredDoc.id);
                  onOpenDocument?.(hoveredDoc.id);
                }}
                className="text-accent hover:underline flex items-center gap-0.5 pointer-events-auto"
              >
                Abrir nota <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* SVG Interactive Canvas */}
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Render Edges */}
        <g stroke="currentColor" className="text-border-default" strokeWidth={1.5}>
          {edges.map((edge, idx) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;

            const isRelated =
              source.id === activeDocumentId ||
              target.id === activeDocumentId ||
              source.id === hoveredNodeId ||
              target.id === hoveredNodeId;

            const isFiltered =
              (categoryFilter === 'all' ||
                source.category === categoryFilter ||
                target.category === categoryFilter);

            if (!isFiltered) return null;

            return (
              <line
                key={`edge-${idx}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isRelated ? 'var(--accent-primary)' : 'currentColor'}
                strokeOpacity={isRelated ? 0.9 : 0.35}
                strokeWidth={isRelated ? 2.5 : 1.2}
                strokeDasharray={isRelated ? undefined : '3 2'}
              />
            );
          })}
        </g>

        {/* Render Nodes */}
        {nodes.map((node) => {
          const isSelected = node.id === activeDocumentId;
          const isHovered = node.id === hoveredNodeId;
          const color = CATEGORY_COLORS[node.category];

          const matchesCat = categoryFilter === 'all' || node.category === categoryFilter;
          const matchesQuery =
            !graphSearch.trim() ||
            node.title.toLowerCase().includes(graphSearch.toLowerCase());

          const opacity = matchesCat && matchesQuery ? 1 : 0.15;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleMouseDownNode(e, node.id)}
              onDoubleClick={() => onOpenDocument?.(node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              opacity={opacity}
              className="cursor-pointer transition-opacity"
            >
              {/* Outer halo */}
              <circle
                r={node.radius + (isSelected ? 8 : isHovered ? 6 : 4)}
                fill={color}
                fillOpacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.15}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.2}
              />

              {/* Core dot */}
              <circle
                r={Math.max(6, node.radius * 0.45)}
                fill={color}
                className="transition-transform"
              />

              {/* Node label */}
              <text
                y={node.radius + 14}
                textAnchor="middle"
                className="text-[11px] font-medium fill-current text-text-primary pointer-events-none drop-shadow"
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
