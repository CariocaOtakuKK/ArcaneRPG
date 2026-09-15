import { create } from 'zustand';
import type { PillarId, ThemeId, ToastNotification, ToastType, SystemDefinition } from '@/types';
import { applyTheme, getInitialTheme } from '@/core/theme/themeManager';
import { db, DEFAULT_SYSTEM, initializeDatabase } from '@/core/db';
import { validateSystemDefinition } from '@/core/engine/schemaValidation';

interface AppState {
  // Navigation & Pillars
  activePillar: PillarId;
  setActivePillar: (pillar: PillarId) => void;

  // Active Context
  activeCampaignId: string | null;
  setActiveCampaignId: (campaignId: string | null) => void;

  activeSystemId: string;
  setActiveSystemId: (systemId: string) => void;

  systems: SystemDefinition[];
  loadSystems: () => Promise<void>;
  saveSystem: (system: SystemDefinition) => Promise<boolean>;

  // Theme Management
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;

  // Notification / Toast System (Integrated with Zod & Error Handlers)
  toasts: ToastNotification[];
  addToast: (toast: { type: ToastType; title: string; message: string; duration?: number }) => void;
  removeToast: (id: string) => void;

  // Initialization State
  isInitialized: boolean;
  initApp: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activePillar: 'characters',
  setActivePillar: (pillar) => set({ activePillar: pillar }),

  activeCampaignId: 'camp-default',
  setActiveCampaignId: (campaignId) => set({ activeCampaignId: campaignId }),

  activeSystemId: 'dnd5e',
  setActiveSystemId: (systemId) => set({ activeSystemId: systemId }),

  systems: [DEFAULT_SYSTEM],

  loadSystems: async () => {
    try {
      const allSystems = await db.systems.toArray();
      if (allSystems.length > 0) {
        set({ systems: allSystems });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar sistemas';
      get().addToast({
        type: 'error',
        title: 'Erro de Banco de Dados',
        message: msg,
      });
    }
  },

  saveSystem: async (system: SystemDefinition) => {
    // Validate with Zod before saving
    const validation = validateSystemDefinition(system);
    if (!validation.success) {
      get().addToast({
        type: 'error',
        title: 'Definição de Sistema Inválida',
        message: validation.errors.slice(0, 3).join(' | '),
      });
      return false;
    }

    try {
      await db.systems.put(system);
      await get().loadSystems();
      get().addToast({
        type: 'success',
        title: 'Sistema Salvo',
        message: `O sistema "${system.name}" foi salvo com sucesso.`,
      });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar sistema';
      get().addToast({
        type: 'error',
        title: 'Erro de Persistência',
        message: msg,
      });
      return false;
    }
  },

  theme: getInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toasts: [],
  addToast: ({ type, title, message, duration = 4000 }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = { id, type, title, message, duration };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  isInitialized: false,
  initApp: async () => {
    if (get().isInitialized) return;
    try {
      await initializeDatabase();
      await get().loadSystems();
      applyTheme(get().theme);
      set({ isInitialized: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao inicializar o banco de dados';
      get().addToast({
        type: 'error',
        title: 'Inicialização Offline',
        message: msg,
      });
      set({ isInitialized: true });
    }
  },
}));
