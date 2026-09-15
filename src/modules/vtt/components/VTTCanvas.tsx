import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useVTTStore } from '../store/vttStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  MousePointer,
  Hand,
  Pencil,
  PlusCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Grid,
} from 'lucide-react';

export const VTTCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scenes = useVTTStore((state) => state.scenes);
  const activeSceneId = useVTTStore((state) => state.activeSceneId);
  const activeTool = useVTTStore((state) => state.activeTool);
  const setActiveTool = useVTTStore((state) => state.setActiveTool);
  const viewport = useVTTStore((state) => state.viewport);
  const setViewport = useVTTStore((state) => state.setViewport);
  const selectedTokenId = useVTTStore((state) => state.selectedTokenId);
  const setSelectedTokenId = useVTTStore((state) => state.setSelectedTokenId);
  const moveToken = useVTTStore((state) => state.moveToken);
  const addToken = useVTTStore((state) => state.addToken);
  const removeToken = useVTTStore((state) => state.removeToken);
  const updateTokenHp = useVTTStore((state) => state.updateTokenHp);
  const toggleCondition = useVTTStore((state) => state.toggleCondition);
  const startDrawing = useVTTStore((state) => state.startDrawing);
  const addPointToCurrentDrawing = useVTTStore((state) => state.addPointToCurrentDrawing);
  const finishDrawing = useVTTStore((state) => state.finishDrawing);
  const clearDrawings = useVTTStore((state) => state.clearDrawings);
  const currentDrawing = useVTTStore((state) => state.currentDrawing);

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState('');

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  // Render loop for HTML5 Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Apply viewport transform (Pan & Zoom)
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Background fill (Mesa Dark Board)
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, activeScene.width, activeScene.height);

    // Scene Board Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, activeScene.width, activeScene.height);

    // Grid rendering (Native fast loops)
    if (activeScene.gridType === 'square') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const g = activeScene.gridSize;

      ctx.beginPath();
      for (let x = 0; x <= activeScene.width; x += g) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, activeScene.height);
      }
      for (let y = 0; y <= activeScene.height; y += g) {
        ctx.moveTo(0, y);
        ctx.lineTo(activeScene.width, y);
      }
      ctx.stroke();
    }

    // Render Completed Drawings
    for (const drawing of activeScene.drawings) {
      if (drawing.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
      }
      ctx.stroke();
    }

    // Render Current Active Drawing
    if (currentDrawing && currentDrawing.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentDrawing.color;
      ctx.lineWidth = currentDrawing.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentDrawing.points[0].x, currentDrawing.points[0].y);
      for (let i = 1; i < currentDrawing.points.length; i++) {
        ctx.lineTo(currentDrawing.points[i].x, currentDrawing.points[i].y);
      }
      ctx.stroke();
    }

    // Render Tokens
    const g = activeScene.gridSize;
    for (const token of activeScene.tokens) {
      const radius = (token.size * g) / 2;
      const centerX = token.x + radius;
      const centerY = token.y + radius;
      const isSelected = token.id === selectedTokenId;

      // Token Body
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = token.color || '#8b5cf6';
      ctx.fill();

      // Selection Glow / Ring
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(0,0,0,0.6)';
      ctx.stroke();

      // Token Label Initial
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(12, radius * 0.7)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.name.substring(0, 2).toUpperCase(), centerX, centerY);

      // Name banner under token
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(token.name, centerX, centerY + radius + 12);

      // HP Bar if token has hp defined
      if (token.hp && token.hp.max > 0) {
        const barWidth = radius * 1.8;
        const barHeight = 4;
        const barX = centerX - barWidth / 2;
        const barY = centerY - radius - 8;
        const pct = Math.max(0, Math.min(1, token.hp.current / token.hp.max));

        // HP Background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // HP Fill
        ctx.fillStyle = pct > 0.5 ? '#10b981' : pct > 0.2 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(barX, barY, barWidth * pct, barHeight);
      }
    }

    ctx.restore();
  }, [activeScene, viewport, selectedTokenId, currentDrawing]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      renderCanvas();
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [renderCanvas]);

  // Transform screen coordinate to canvas board space
  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (clientY - rect.top - viewport.y) / viewport.zoom;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'move' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    if (activeTool === 'draw') {
      startDrawing({ x, y });
      return;
    }

    if (activeTool === 'select') {
      // Hit-test tokens
      const g = activeScene.gridSize;
      const clickedToken = activeScene.tokens.find((tok) => {
        const radius = (tok.size * g) / 2;
        const cx = tok.x + radius;
        const cy = tok.y + radius;
        const dist = Math.hypot(x - cx, y - cy);
        return dist <= radius;
      });

      if (clickedToken) {
        setSelectedTokenId(clickedToken.id);
        setDraggedTokenId(clickedToken.id);
      } else {
        setSelectedTokenId(null);
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingCanvas) {
      setViewport({
        ...viewport,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'draw') {
      addPointToCurrentDrawing({ x, y });
      return;
    }

    if (draggedTokenId) {
      const g = activeScene.gridSize;
      const token = activeScene.tokens.find((t) => t.id === draggedTokenId);
      if (token) {
        const radius = (token.size * g) / 2;
        moveToken(draggedTokenId, x - radius, y - radius, true);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDraggingCanvas) setIsDraggingCanvas(false);
    if (draggedTokenId) setDraggedTokenId(null);
    if (activeTool === 'draw') finishDrawing();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(3, Math.max(0.2, viewport.zoom * zoomFactor));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards cursor
    const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
    const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

    setViewport({ x: newX, y: newY, zoom: newZoom });
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    addToken({
      name: newTokenName.trim(),
      x: 100,
      y: 100,
      size: 1,
      color: '#8b5cf6',
      hp: { current: 20, max: 20 },
      conditions: [],
    });
    setNewTokenName('');
  };

  const selectedToken = activeScene.tokens.find((t) => t.id === selectedTokenId);

  return (
    <div className="relative flex-1 h-[calc(100vh-3.5rem)] overflow-hidden bg-bg-primary flex">
      {/* VTT Left Floating Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <Card className="p-1 flex flex-col gap-1 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card">
          <Button
            size="sm"
            variant={activeTool === 'select' ? 'primary' : 'ghost'}
            onClick={() => setActiveTool('select')}
            title="Selecionar / Mover Token (S)"
          >
            <MousePointer className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={activeTool === 'move' ? 'primary' : 'ghost'}
            onClick={() => setActiveTool('move')}
            title="Panorâmica / Mover Tabuleiro (M)"
          >
            <Hand className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={activeTool === 'draw' ? 'primary' : 'ghost'}
            onClick={() => setActiveTool('draw')}
            title="Desenhar / Pintar no Canvas (D)"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </Card>

        {/* Zoom & Viewport controls */}
        <Card className="p-1 flex flex-col gap-1 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewport({ ...viewport, zoom: Math.min(3, viewport.zoom * 1.2) })}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewport({ ...viewport, zoom: Math.max(0.2, viewport.zoom / 1.2) })}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewport({ x: 50, y: 50, zoom: 1 })}
            title="Resetar Câmera"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Card>

        {activeScene.drawings.length > 0 && (
          <Button
            size="sm"
            variant="danger"
            onClick={clearDrawings}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            title="Limpar todos os desenhos"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Main Native HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Right Token Inspector Panel (When Token Selected) */}
      {selectedToken && (
        <div className="absolute top-4 right-4 z-20 w-72">
          <Card className="p-4 bg-bg-secondary/95 backdrop-blur border border-border-default shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedToken.color }}
                />
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                  {selectedToken.name}
                </h4>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTokenId(null)}
              >
                ✕
              </Button>
            </div>

            {/* HP Management */}
            {selectedToken.hp && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Pontos de Vida:</span>
                  <span className="font-mono font-bold text-text-primary">
                    {selectedToken.hp.current} / {selectedToken.hp.max}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateTokenHp(selectedToken.id, selectedToken.hp!.current - 1)}
                  >
                    -1
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateTokenHp(selectedToken.id, selectedToken.hp!.current - 5)}
                  >
                    -5
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => updateTokenHp(selectedToken.id, selectedToken.hp!.current + 1)}
                  >
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => updateTokenHp(selectedToken.id, selectedToken.hp!.current + 5)}
                  >
                    +5
                  </Button>
                </div>
              </div>
            )}

            {/* Conditions */}
            <div className="space-y-1.5">
              <span className="text-xs text-text-muted block">Condições:</span>
              <div className="flex flex-wrap gap-1">
                {['Cego', 'Envenenado', 'Inspirado', 'Atordoado', 'Caído'].map((cond) => {
                  const has = selectedToken.conditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      onClick={() => toggleCondition(selectedToken.id, cond)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        has
                          ? 'bg-status-warning/20 text-status-warning border-status-warning/50'
                          : 'bg-bg-tertiary text-text-muted border-border-subtle hover:text-text-primary'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle flex justify-end">
              <Button
                size="sm"
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => removeToken(selectedToken.id)}
              >
                Remover Token
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Scene & Quick Token Add Ribbon */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-bg-secondary/90 backdrop-blur px-4 py-2 rounded-xl border border-border-default shadow-card">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Grid className="w-4 h-4 text-accent" />
          <span className="font-semibold text-text-primary">{activeScene.name}</span>
          <span>({activeScene.tokens.length} tokens)</span>
        </div>

        <div className="h-4 w-px bg-border-subtle" />

        <form onSubmit={handleCreateToken} className="flex items-center gap-2">
          <input
            placeholder="Nome do novo token..."
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="bg-bg-tertiary border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border-focus w-44"
          />
          <Button type="submit" size="sm" variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />}>
            Criar
          </Button>
        </form>
      </div>
    </div>
  );
};
