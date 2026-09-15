import { create } from 'zustand';
import type { Campaign } from '@/types';
import { db, DEFAULT_CAMPAIGN } from '@/core/db';
import { useAppStore } from '@/core/store/appStore';

interface CampaignState {
  campaigns: Campaign[];
  activeCampaignId: string | null;
  isLoading: boolean;

  loadCampaigns: () => Promise<void>;
  selectCampaign: (id: string | null) => void;
  createCampaign: (name: string, systemId: string, description?: string) => Promise<string>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  linkCharacterToCampaign: (campaignId: string, characterId: string) => Promise<void>;
  unlinkCharacterFromCampaign: (campaignId: string, characterId: string) => Promise<void>;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [DEFAULT_CAMPAIGN],
  activeCampaignId: DEFAULT_CAMPAIGN.id,
  isLoading: false,

  loadCampaigns: async () => {
    set({ isLoading: true });
    try {
      const all = await db.campaigns.toArray();
      if (all.length > 0) {
        set({ campaigns: all });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar campanhas';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Campanhas',
        message: msg,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  selectCampaign: (id) => {
    set({ activeCampaignId: id });
    useAppStore.getState().setActiveCampaignId(id);
  },

  createCampaign: async (name, systemId, description = '') => {
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name,
      systemId,
      description,
      characterIds: [],
      documentIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.campaigns.add(newCamp);
    set((state) => ({
      campaigns: [...state.campaigns, newCamp],
      activeCampaignId: newCamp.id,
    }));
    useAppStore.getState().setActiveCampaignId(newCamp.id);

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Campanha Criada',
      message: `Campanha "${name}" criada com sucesso!`,
    });

    return newCamp.id;
  },

  updateCampaign: async (id, updates) => {
    const { campaigns } = get();
    const index = campaigns.findIndex((c) => c.id === id);
    if (index === -1) return;

    const updated: Campaign = {
      ...campaigns[index],
      ...updates,
      updatedAt: Date.now(),
    };

    const nextList = [...campaigns];
    nextList[index] = updated;
    set({ campaigns: nextList });

    await db.campaigns.put(updated);
  },

  deleteCampaign: async (id) => {
    try {
      await db.campaigns.delete(id);
      set((state) => {
        const nextList = state.campaigns.filter((c) => c.id !== id);
        return {
          campaigns: nextList,
          activeCampaignId: nextList.length > 0 ? nextList[0].id : null,
        };
      });
      useAppStore.getState().addToast({
        type: 'info',
        title: 'Campanha Removida',
        message: 'A campanha foi removida da base.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Erro',
        message: msg,
      });
    }
  },

  linkCharacterToCampaign: async (campaignId, characterId) => {
    const { campaigns } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp || camp.characterIds.includes(characterId)) return;

    await get().updateCampaign(campaignId, {
      characterIds: [...camp.characterIds, characterId],
    });
  },

  unlinkCharacterFromCampaign: async (campaignId, characterId) => {
    const { campaigns } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp) return;

    await get().updateCampaign(campaignId, {
      characterIds: camp.characterIds.filter((id) => id !== characterId),
    });
  },
}));
