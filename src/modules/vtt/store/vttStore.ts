import { create } from 'zustand';
import type { TableScene, VTTToken, VTTDrawing, GridType, VTTTextLabel, FogCutout } from '@/types';
import { db, DEFAULT_SCENE } from '@/core/db';
import { useAppStore } from '@/core/store/appStore';

export type VTTTool =
  | 'select'
  | 'move'
  | 'draw'
  | 'token-add'
  | 'measure'
  | 'fog-reveal'
  | 'fog-hide'
  | 'text';

interface VTTState {
  scenes: TableScene[];
  activeSceneId: string | null;
  activeTool: VTTTool;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedTokenId: string | null;
  brushColor: string;
  brushWidth: number;
  currentDrawing: VTTDrawing | null;

  // Ruler / Measurement State
  ruler: {
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
  };

  loadScenes: () => Promise<void>;
  selectScene: (id: string) => void;
  createScene: (name: string, campaignId?: string, width?: number, height?: number) => Promise<string>;
  deleteScene: (id: string) => Promise<void>;
  setActiveTool: (tool: VTTTool) => void;
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;
  setSelectedTokenId: (id: string | null) => void;
  setBrushColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  setRuler: (start: { x: number; y: number } | null, end: { x: number; y: number } | null) => void;

  // Token Actions
  moveToken: (tokenId: string, x: number, y: number, snapToGrid?: boolean) => void;
  addToken: (token: Omit<VTTToken, 'id'>) => void;
  removeToken: (tokenId: string) => void;
  updateTokenHp: (tokenId: string, current: number) => void;
  updateTokenSize: (tokenId: string, size: number) => void;
  toggleTokenLock: (tokenId: string) => void;
  updateTokenTeam: (tokenId: string, team: 'ally' | 'enemy' | 'neutral') => void;
  toggleCondition: (tokenId: string, condition: string) => void;

  // Drawing Actions (Native Canvas/SVG)
  startDrawing: (point: { x: number; y: number }) => void;
  addPointToCurrentDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: () => void;
  clearDrawings: () => void;

  // Fog of War Actions
  toggleFog: () => void;
  revealFog: (cutout: Omit<FogCutout, 'id'>) => void;
  resetFog: () => void;

  // Text Labels on Map
  addTextLabel: (label: Omit<VTTTextLabel, 'id'>) => void;
  removeTextLabel: (id: string) => void;

  // Scene settings & Background
  setBackgroundImage: (imageUrl: string) => void;
  updateGridSettings: (gridType: GridType, gridSize: number, gridOpacity?: number) => void;
}

export const useVTTStore = create<VTTState>((set, get) => ({
  scenes: [DEFAULT_SCENE],
  activeSceneId: DEFAULT_SCENE.id,
  activeTool: 'select',
  viewport: { x: 50, y: 50, zoom: 1 },
  selectedTokenId: null,
  brushColor: '#8b5cf6',
  brushWidth: 4,
  currentDrawing: null,
  ruler: { start: null, end: null },

  loadScenes: async () => {
    try {
      const all = await db.scenes.toArray();
      if (all.length > 0) {
        set({ scenes: all });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar cenas';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Mesa / VTT',
        message: msg,
      });
    }
  },

  selectScene: (id) => {
    set({ activeSceneId: id, selectedTokenId: null, ruler: { start: null, end: null } });
  },

  createScene: async (name, campaignId, width = 2000, height = 2000) => {
    const newScene: TableScene = {
      id: `scene-${Date.now()}`,
      campaignId,
      name,
      gridType: 'square',
      gridSize: 48,
      width,
      height,
      tokens: [],
      drawings: [],
      textLabels: [],
      fogEnabled: false,
      fogRevealed: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.scenes.add(newScene);
    set((state) => ({
      scenes: [...state.scenes, newScene],
      activeSceneId: newScene.id,
    }));

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Cena Criada',
      message: `Cena "${name}" pronta no tabuleiro.`,
    });

    return newScene.id;
  },

  deleteScene: async (id) => {
    try {
      await db.scenes.delete(id);
      set((state) => {
        const nextList = state.scenes.filter((s) => s.id !== id);
        return {
          scenes: nextList,
          activeSceneId: nextList.length > 0 ? nextList[0].id : null,
          selectedTokenId: null,
        };
      });
      useAppStore.getState().addToast({
        type: 'info',
        title: 'Cena Removida',
        message: 'A cena foi excluída da mesa.',
      });
    } catch (err) {
      console.error(err);
    }
  },

  setActiveTool: (tool) => set({ activeTool: tool, ruler: { start: null, end: null } }),
  setViewport: (viewport) => set({ viewport }),
  setSelectedTokenId: (id) => set({ selectedTokenId: id }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushWidth: (width) => set({ brushWidth: width }),
  setRuler: (start, end) => set({ ruler: { start, end } }),

  moveToken: (tokenId, x, y, snapToGrid = true) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    let finalX = x;
    let finalY = y;

    if (snapToGrid && scene.gridType !== 'none') {
      const g = scene.gridSize;
      finalX = Math.round(x / g) * g;
      finalY = Math.round(y / g) * g;
    }

    const updatedTokens = scene.tokens.map((tok) =>
      tok.id === tokenId && !tok.isLocked ? { ...tok, x: finalX, y: finalY } : tok
    );

    const updatedScene: TableScene = {
      ...scene,
      tokens: updatedTokens,
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  addToken: (token) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const newToken: VTTToken = {
      ...token,
      id: `tok-${Date.now()}`,
    };

    const updatedScene: TableScene = {
      ...scene,
      tokens: [...scene.tokens, newToken],
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes, selectedTokenId: newToken.id });

    db.scenes.put(updatedScene).catch(console.error);
  },

  removeToken: (tokenId) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      tokens: scene.tokens.filter((t) => t.id !== tokenId),
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({
      scenes: newScenes,
      selectedTokenId: get().selectedTokenId === tokenId ? null : get().selectedTokenId,
    });

    db.scenes.put(updatedScene).catch(console.error);
  },

  updateTokenHp: (tokenId, current) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      tokens: scene.tokens.map((tok) => {
        if (tok.id === tokenId && tok.hp) {
          return {
            ...tok,
            hp: {
              ...tok.hp,
              current: Math.max(0, Math.min(tok.hp.max, current)),
            },
          };
        }
        return tok;
      }),
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  updateTokenSize: (tokenId, size) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      tokens: scene.tokens.map((tok) => (tok.id === tokenId ? { ...tok, size } : tok)),
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  toggleTokenLock: (tokenId) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      tokens: scene.tokens.map((tok) =>
        tok.id === tokenId ? { ...tok, isLocked: !tok.isLocked } : tok
      ),
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  updateTokenTeam: (tokenId, team) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      tokens: scene.tokens.map((tok) => (tok.id === tokenId ? { ...tok, team } : tok)),
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  toggleCondition: (tokenId, condition) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      tokens: scene.tokens.map((tok) => {
        if (tok.id === tokenId) {
          const has = tok.conditions.includes(condition);
          const nextConditions = has
            ? tok.conditions.filter((c) => c !== condition)
            : [...tok.conditions, condition];
          return { ...tok, conditions: nextConditions };
        }
        return tok;
      }),
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  startDrawing: (point) => {
    const { brushColor, brushWidth } = get();
    const newDrawing: VTTDrawing = {
      id: `draw-${Date.now()}`,
      color: brushColor,
      width: brushWidth,
      points: [point],
    };
    set({ currentDrawing: newDrawing });
  },

  addPointToCurrentDrawing: (point) => {
    const current = get().currentDrawing;
    if (!current) return;
    set({
      currentDrawing: {
        ...current,
        points: [...current.points, point],
      },
    });
  },

  finishDrawing: () => {
    const current = get().currentDrawing;
    if (!current || current.points.length < 2) {
      set({ currentDrawing: null });
      return;
    }

    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) {
      set({ currentDrawing: null });
      return;
    }

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      drawings: [...scene.drawings, current],
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes, currentDrawing: null });

    db.scenes.put(updatedScene).catch(console.error);
  },

  clearDrawings: () => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      drawings: [],
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
    useAppStore.getState().addToast({
      type: 'info',
      title: 'Desenhos Limpos',
      message: 'Todos os traços da cena foram removidos.',
    });
  },

  toggleFog: () => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const isNowEnabled = !scene.fogEnabled;
    const updatedScene: TableScene = {
      ...scene,
      fogEnabled: isNowEnabled,
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
    useAppStore.getState().addToast({
      type: isNowEnabled ? 'warning' : 'info',
      title: 'Névoa de Guerra',
      message: isNowEnabled ? 'Névoa de Guerra ativada.' : 'Névoa de Guerra desativada.',
    });
  },

  revealFog: (cutout) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const newCutout: FogCutout = {
      ...cutout,
      id: `fog-${Date.now()}`,
    };

    const updatedScene: TableScene = {
      ...scene,
      fogRevealed: [...(scene.fogRevealed || []), newCutout],
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  resetFog: () => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      fogRevealed: [],
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  addTextLabel: (label) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const newLabel: VTTTextLabel = {
      ...label,
      id: `lbl-${Date.now()}`,
    };

    const updatedScene: TableScene = {
      ...scene,
      textLabels: [...(scene.textLabels || []), newLabel],
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  removeTextLabel: (id) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      textLabels: (scene.textLabels || []).filter((l) => l.id !== id),
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  setBackgroundImage: (imageUrl) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      backgroundImage: imageUrl,
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },

  updateGridSettings: (gridType, gridSize, gridOpacity = 0.08) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      gridType,
      gridSize,
      gridOpacity,
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },
}));
