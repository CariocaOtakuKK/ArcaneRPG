import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useVTTStore } from '../store/vttStore';
import { DiceRollerPanel } from './DiceRollerPanel';
import { CombatTracker } from './CombatTracker';
import { GMReferencePanel } from './GMReferencePanel';
import { SessionTimer } from './SessionTimer';
import { SceneManagerModal } from './SceneManagerModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  MousePointer,
  Hand,
  Pencil,
  Ruler,
  EyeOff,
  Type,
  PlusCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Grid,
  Dices,
  Swords,
  BookOpen,
  Map as MapIcon,
  Lock,
  Unlock,
} from 'lucide-react';

export const VTTCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageCacheRef = useRef<HTMLImageElement | null>(null);

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
  const updateTokenSize = useVTTStore((state) => state.updateTokenSize);
  const toggleTokenLock = useVTTStore((state) => state.toggleTokenLock);
  const updateTokenTeam = useVTTStore((state) => state.updateTokenTeam);
  const toggleCondition = useVTTStore((state) => state.toggleCondition);
  const startDrawing = useVTTStore((state) => state.startDrawing);
  const addPointToCurrentDrawing = useVTTStore((state) => state.addPointToCurrentDrawing);
  const finishDrawing = useVTTStore((state) => state.finishDrawing);
  const clearDrawings = useVTTStore((state) => state.clearDrawings);
  const currentDrawing = useVTTStore((state) => state.currentDrawing);

  const ruler = useVTTStore((state) => state.ruler);
  const setRuler = useVTTStore((state) => state.setRuler);
  const toggleFog = useVTTStore((state) => state.toggleFog);
  const revealFog = useVTTStore((state) => state.revealFog);
  const addTextLabel = useVTTStore((state) => state.addTextLabel);
  const removeTextLabel = useVTTStore((state) => state.removeTextLabel);

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState('');
  const [fogDragStart, setFogDragStart] = useState<{ x: number; y: number } | null>(null);

  // Floating sub-panels
  const [showDicePanel, setShowDicePanel] = useState(false);
  const [showCombatTracker, setShowCombatTracker] = useState(false);
  const [showGMPanel, setShowGMPanel] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  // Preload & cache background image
  useEffect(() => {
    if (activeScene.backgroundImage) {
      const img = new Image();
      img.src = activeScene.backgroundImage;
      img.onload = () => {
        bgImageCacheRef.current = img;
      };
    } else {
      bgImageCacheRef.current = null;
    }
  }, [activeScene.backgroundImage]);

  // Main Render loop for HTML5 Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Viewport Transform (Pan & Zoom)
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Layer 0: Background
    if (bgImageCacheRef.current && bgImageCacheRef.current.complete) {
      ctx.drawImage(
        bgImageCacheRef.current,
        0,
        0,
        activeScene.width,
        activeScene.height
      );
    } else {
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(0, 0, activeScene.width, activeScene.height);
    }

    // Scene Board Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, activeScene.width, activeScene.height);

    // Layer 1: Grid (Square or Hexagonal)
    const g = activeScene.gridSize;
    const gridOpacity = activeScene.gridOpacity ?? 0.08;

    if (activeScene.gridType === 'square') {
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
      ctx.lineWidth = 1;
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
    } else if (activeScene.gridType === 'hex') {
      // Hexagonal Grid Loop (Pointy topped)
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
      ctx.lineWidth = 1;
      const radius = g / Math.sqrt(3);
      const hexHeight = 2 * radius;
      const hexWidth = Math.sqrt(3) * radius;
      const vertDist = hexHeight * 0.75;

      ctx.beginPath();
      for (let y = 0; y < activeScene.height + radius; y += vertDist) {
        const row = Math.floor(y / vertDist);
        const xOffset = (row % 2) * (hexWidth / 2);
        for (let x = 0; x < activeScene.width + hexWidth; x += hexWidth) {
          const cx = x + xOffset;
          const cy = y;
          for (let side = 0; side < 6; side++) {
            const angle = (Math.PI / 180) * (60 * side - 30);
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);
            if (side === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
      }
      ctx.stroke();
    }

    // Layer 2: Drawings
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

    // Layer 3: Text Pin Labels
    if (activeScene.textLabels) {
      for (const lbl of activeScene.textLabels) {
        ctx.font = `bold ${lbl.fontSize || 13}px sans-serif`;
        const textMetrics = ctx.measureText(lbl.text);
        const padX = 6;
        const padY = 4;

        // Label Tag Background
        ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
        ctx.strokeStyle = lbl.color || '#8b5cf6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(
          lbl.x - padX,
          lbl.y - 14 - padY,
          textMetrics.width + padX * 2,
          18 + padY,
          4
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(lbl.text, lbl.x, lbl.y);
      }
    }

    // Layer 4: Tokens
    for (const token of activeScene.tokens) {
      const radius = (token.size * g) / 2;
      const centerX = token.x + radius;
      const centerY = token.y + radius;
      const isSelected = token.id === selectedTokenId;

      // Team colored outline ring
      const teamColor =
        token.team === 'ally'
          ? '#10b981'
          : token.team === 'enemy'
          ? '#ef4444'
          : token.team === 'neutral'
          ? '#eab308'
          : token.color || '#8b5cf6';

      // Token Body
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = token.color || '#8b5cf6';
      ctx.fill();

      // Selection Glow or Team Border
      ctx.lineWidth = isSelected ? 4 : 2.5;
      ctx.strokeStyle = isSelected ? '#ffffff' : teamColor;
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

      // Lock indicator
      if (token.isLocked) {
        ctx.fillStyle = '#eab308';
        ctx.fillText('🔒', centerX, centerY - radius - 10);
      }

      // HP Bar if token has hp defined
      if (token.hp && token.hp.max > 0) {
        const barWidth = radius * 1.8;
        const barHeight = 4;
        const barX = centerX - barWidth / 2;
        const barY = centerY - radius - 6;
        const pct = Math.max(0, Math.min(1, token.hp.current / token.hp.max));

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = pct > 0.5 ? '#10b981' : pct > 0.2 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(barX, barY, barWidth * pct, barHeight);
      }
    }

    // Layer 5: Fog of War
    if (activeScene.fogEnabled) {
      ctx.save();
      // Draw dark veil with cutouts
      ctx.fillStyle = 'rgba(5, 5, 10, 0.75)'; // GM Semi-transparent view
      ctx.fillRect(0, 0, activeScene.width, activeScene.height);

      // Cut out revealed areas
      if (activeScene.fogRevealed && activeScene.fogRevealed.length > 0) {
        ctx.globalCompositeOperation = 'destination-out';
        for (const cut of activeScene.fogRevealed) {
          ctx.beginPath();
          ctx.rect(cut.x, cut.y, cut.width, cut.height);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Layer 6: Measuring Ruler
    if (ruler.start && ruler.end) {
      const sx = ruler.start.x;
      const sy = ruler.start.y;
      const ex = ruler.end.x;
      const ey = ruler.end.y;

      const distPx = Math.hypot(ex - sx, ey - sy);
      const cells = (distPx / g).toFixed(1);
      const meters = ((distPx / g) * 1.5).toFixed(1); // 1.5m standard grid scale

      // Draw ruler line
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      // Start & End markers
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Measurement Badge
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;
      const label = `${cells} cel (${meters}m)`;
      ctx.font = 'bold 12px sans-serif';
      const textMetrics = ctx.measureText(label);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - textMetrics.width / 2 - 6, midY - 18, textMetrics.width + 12, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, midX, midY - 7);
    }

    ctx.restore();
  }, [activeScene, viewport, selectedTokenId, currentDrawing, ruler]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      renderCanvas();
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [renderCanvas]);

  // Screen to World coordinates
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

    if (activeTool === 'measure') {
      setRuler({ x, y }, { x, y });
      return;
    }

    if (activeTool === 'draw') {
      startDrawing({ x, y });
      return;
    }

    if (activeTool === 'fog-reveal') {
      setFogDragStart({ x, y });
      return;
    }

    if (activeTool === 'text') {
      const text = prompt('Digite o texto do marcador no mapa:');
      if (text && text.trim()) {
        addTextLabel({ x, y, text: text.trim(), color: '#8b5cf6', fontSize: 13 });
      }
      return;
    }

    if (activeTool === 'select') {
      // Check if clicked on a text label with Shift/Alt to remove
      const clickedLabel = activeScene.textLabels?.find(
        (lbl) => Math.hypot(x - lbl.x, y - lbl.y) < 30
      );
      if (clickedLabel && (e.shiftKey || e.altKey)) {
        removeTextLabel(clickedLabel.id);
        return;
      }

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
        if (!clickedToken.isLocked) {
          setDraggedTokenId(clickedToken.id);
        }
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

    if (activeTool === 'measure' && ruler.start) {
      setRuler(ruler.start, { x, y });
      return;
    }

    if (activeTool === 'draw') {
      addPointToCurrentDrawing({ x, y });
      return;
    }

    if (draggedTokenId) {
      const g = activeScene.gridSize;
      const token = activeScene.tokens.find((t) => t.id === draggedTokenId);
      if (token && !token.isLocked) {
        const radius = (token.size * g) / 2;
        moveToken(draggedTokenId, x - radius, y - radius, true);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingCanvas) setIsDraggingCanvas(false);
    if (draggedTokenId) setDraggedTokenId(null);
    if (activeTool === 'draw') finishDrawing();

    if (activeTool === 'fog-reveal' && fogDragStart) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      const minX = Math.min(fogDragStart.x, x);
      const minY = Math.min(fogDragStart.y, y);
      const w = Math.abs(x - fogDragStart.x);
      const h = Math.abs(y - fogDragStart.y);
      if (w > 10 && h > 10) {
        revealFog({ x: minX, y: minY, width: w, height: h });
      }
      setFogDragStart(null);
    }
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
      team: 'ally',
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
            variant={activeTool === 'measure' ? 'primary' : 'ghost'}
            onClick={() => setActiveTool('measure')}
            title="Régua de Medição de Distância (R)"
          >
            <Ruler className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={activeTool === 'draw' ? 'primary' : 'ghost'}
            onClick={() => setActiveTool('draw')}
            title="Desenhar / Pintar no Canvas (D)"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={activeTool === 'text' ? 'primary' : 'ghost'}
            onClick={() => setActiveTool('text')}
            title="Inserir Marcador de Texto (T)"
          >
            <Type className="w-4 h-4" />
          </Button>
        </Card>

        {/* Fog of War & GM Screen Toggles */}
        <Card className="p-1 flex flex-col gap-1 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card">
          <Button
            size="sm"
            variant={activeScene.fogEnabled ? 'primary' : 'ghost'}
            onClick={toggleFog}
            title={activeScene.fogEnabled ? 'Desativar Névoa de Guerra' : 'Ativar Névoa de Guerra'}
          >
            <EyeOff className="w-4 h-4" />
          </Button>

          {activeScene.fogEnabled && (
            <Button
              size="sm"
              variant={activeTool === 'fog-reveal' ? 'primary' : 'ghost'}
              onClick={() => setActiveTool('fog-reveal')}
              title="Revelar Área na Névoa (Arrastar Retângulo)"
            >
              <Grid className="w-4 h-4 text-accent" />
            </Button>
          )}

          <Button
            size="sm"
            variant={showGMPanel ? 'primary' : 'ghost'}
            onClick={() => setShowGMPanel(!showGMPanel)}
            title="Abrir Tela do Mestre (CDs, Condições & Ambiente)"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
        </Card>

        {/* Dice & Combat Quick Toggles */}
        <Card className="p-1 flex flex-col gap-1 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card">
          <Button
            size="sm"
            variant={showDicePanel ? 'primary' : 'ghost'}
            onClick={() => {
              setShowDicePanel(!showDicePanel);
              if (!showDicePanel) setShowCombatTracker(false);
            }}
            title="Abrir Rolador de Dados"
          >
            <Dices className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={showCombatTracker ? 'primary' : 'ghost'}
            onClick={() => {
              setShowCombatTracker(!showCombatTracker);
              if (!showCombatTracker) setShowDicePanel(false);
            }}
            title="Abrir Tracker de Combate & Iniciativa"
          >
            <Swords className="w-4 h-4" />
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

      {/* Floating Top Right: Session Stopwatch */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <SessionTimer />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowSceneModal(true)}
          icon={<MapIcon className="w-3.5 h-3.5" />}
          title="Gerenciar Cenas & Fundo de Mapa"
        >
          Cenas
        </Button>
      </div>

      {/* Floating Dice Roller Panel */}
      {showDicePanel && (
        <div className="absolute top-4 left-16 z-30 w-80 h-[520px]">
          <DiceRollerPanel />
        </div>
      )}

      {/* Floating Combat Tracker Panel */}
      {showCombatTracker && (
        <div className="absolute top-4 left-16 z-30 w-96 h-[560px]">
          <CombatTracker />
        </div>
      )}

      {/* Floating GM Reference Panel */}
      {showGMPanel && (
        <div className="absolute top-16 right-4 z-30 w-80 h-[520px]">
          <GMReferencePanel onClose={() => setShowGMPanel(false)} />
        </div>
      )}

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
        <div className="absolute top-16 right-4 z-20 w-80">
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
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleTokenLock(selectedToken.id)}
                  title={selectedToken.isLocked ? 'Destravar Token' : 'Travar Token'}
                >
                  {selectedToken.isLocked ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Unlock className="w-3.5 h-3.5 text-text-muted" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedTokenId(null)}
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Team / Alliance Selector */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
                Time / Aliança
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(['ally', 'enemy', 'neutral'] as const).map((team) => (
                  <button
                    key={team}
                    onClick={() => updateTokenTeam(selectedToken.id, team)}
                    className={`py-1 text-[10px] rounded border transition-colors capitalize ${
                      selectedToken.team === team
                        ? team === 'ally'
                          ? 'bg-status-success/20 text-status-success border-status-success/50'
                          : team === 'enemy'
                          ? 'bg-status-danger/20 text-status-danger border-status-danger/50'
                          : 'bg-status-warning/20 text-status-warning border-status-warning/50'
                        : 'bg-bg-tertiary text-text-muted border-border-subtle'
                    }`}
                  >
                    {team === 'ally' ? 'Aliado' : team === 'enemy' ? 'Inimigo' : 'Neutro'}
                  </button>
                ))}
              </div>
            </div>

            {/* Token Size Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>Tamanho no Grid:</span>
                <span className="font-mono font-bold text-text-primary">{selectedToken.size}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1, 2, 3].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateTokenSize(selectedToken.id, sz)}
                    className={`py-1 text-[10px] rounded border font-mono transition-colors ${
                      selectedToken.size === sz
                        ? 'bg-accent text-text-primary border-accent'
                        : 'bg-bg-tertiary text-text-muted border-border-subtle'
                    }`}
                  >
                    {sz === 0.5 ? 'Miúdo' : sz === 1 ? 'Médio' : sz === 2 ? 'Grande' : 'Enorme'}
                  </button>
                ))}
              </div>
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
                {['Cego', 'Envenenado', 'Inspirado', 'Atordoado', 'Caído', 'Invisível'].map((cond) => {
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
          <span>({activeScene.tokens.length} tokens • {activeScene.gridType})</span>
        </div>

        <div className="h-4 w-px bg-border-subtle" />

        <form onSubmit={handleCreateToken} className="flex items-center gap-2">
          <input
            placeholder="Novo token no mapa..."
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="bg-bg-tertiary border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border-focus w-44"
          />
          <Button type="submit" size="sm" variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />}>
            Criar
          </Button>
        </form>
      </div>

      {/* Scene Manager Modal */}
      <SceneManagerModal
        isOpen={showSceneModal}
        onClose={() => setShowSceneModal(false)}
      />
    </div>
  );
};
