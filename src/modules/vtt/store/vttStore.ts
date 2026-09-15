import { create } from 'zustand';
import type { TableScene, VTTToken, VTTDrawing, GridType } from '@/types';
import { db, DEFAULT_SCENE } from '@/core/db';
import { useAppStore } from '@/core/store/appStore';

export type VTTTool = 'select' | 'move' | 'draw' | 'token-add' | 'measure';

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

  loadScenes: () => Promise<void>;
  selectScene: (id: string) => void;
  createScene: (name: string, campaignId?: string) => Promise<string>;
  setActiveTool: (tool: VTTTool) => void;
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;
  setSelectedTokenId: (id: string | null) => void;
  setBrushColor: (color: string) => void;
  setBrushWidth: (width: number) => void;

  // Token Actions
  moveToken: (tokenId: string, x: number, y: number, snapToGrid?: boolean) => void;
  addToken: (token: Omit<VTTToken, 'id'>) => void;
  removeToken: (tokenId: string) => void;
  updateTokenHp: (tokenId: string, current: number) => void;
  toggleCondition: (tokenId: string, condition: string) => void;

  // Drawing Actions (Native Canvas/SVG)
  startDrawing: (point: { x: number; y: number }) => void;
  addPointToCurrentDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: () => void;
  clearDrawings: () => void;

  // Scene settings
  updateGridSettings: (gridType: GridType, gridSize: number) => void;
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
    set({ activeSceneId: id, selectedTokenId: null });
  },

  createScene: async (name, campaignId) => {
    const newScene: TableScene = {
      id: `scene-${Date.now()}`,
      campaignId,
      name,
      gridType: 'square',
      gridSize: 48,
      width: 2000,
      height: 2000,
      tokens: [],
      drawings: [],
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
      message: `Cena "${name}" inicializada.`,
    });

    return newScene.id;
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setViewport: (viewport) => set({ viewport }),
  setSelectedTokenId: (id) => set({ selectedTokenId: id }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushWidth: (width) => set({ brushWidth: width }),

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
      tok.id === tokenId ? { ...tok, x: finalX, y: finalY } : tok
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

  updateGridSettings: (gridType, gridSize) => {
    const { scenes, activeSceneId } = get();
    const sceneIndex = scenes.findIndex((s) => s.id === activeSceneId);
    if (sceneIndex === -1) return;

    const scene = scenes[sceneIndex];
    const updatedScene: TableScene = {
      ...scene,
      gridType,
      gridSize,
      updatedAt: Date.now(),
    };

    const newScenes = [...scenes];
    newScenes[sceneIndex] = updatedScene;
    set({ scenes: newScenes });

    db.scenes.put(updatedScene).catch(console.error);
  },
}));
