import { create } from 'zustand';
import type {
  Campaign,
  SessionLog,
  CampaignQuest,
  CampaignTimelineEvent,
  QuestObjective,
} from '@/types';
import { db, DEFAULT_CAMPAIGN, DEFAULT_SESSION_LOG } from '@/core/db';
import { useAppStore } from '@/core/store/appStore';

interface CampaignState {
  campaigns: Campaign[];
  sessions: SessionLog[];
  activeCampaignId: string | null;
  isLoading: boolean;

  loadCampaigns: () => Promise<void>;
  selectCampaign: (id: string | null) => void;
  createCampaign: (name: string, systemId: string, description?: string) => Promise<string>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  linkCharacterToCampaign: (campaignId: string, characterId: string) => Promise<void>;
  unlinkCharacterFromCampaign: (campaignId: string, characterId: string) => Promise<void>;

  // Session Logs
  createSessionLog: (
    campaignId: string,
    data: {
      title: string;
      date: string;
      sessionNumber: number;
      summary: string;
      attendees: string[];
      xpGranted?: number;
      loot?: string[];
    }
  ) => Promise<string>;
  updateSessionLog: (id: string, updates: Partial<SessionLog>) => Promise<void>;
  deleteSessionLog: (id: string) => Promise<void>;

  // Quests
  addQuest: (
    campaignId: string,
    data: {
      title: string;
      description: string;
      giverNpc?: string;
      location?: string;
      reward?: string;
      objectives?: string[];
    }
  ) => Promise<void>;
  updateQuestStatus: (
    campaignId: string,
    questId: string,
    status: 'active' | 'completed' | 'failed'
  ) => Promise<void>;
  toggleQuestObjective: (campaignId: string, questId: string, objectiveId: string) => Promise<void>;
  deleteQuest: (campaignId: string, questId: string) => Promise<void>;

  // Timeline
  addTimelineEvent: (
    campaignId: string,
    event: Omit<CampaignTimelineEvent, 'id' | 'campaignId'>
  ) => Promise<void>;
  deleteTimelineEvent: (campaignId: string, eventId: string) => Promise<void>;

  // Automated Report Generator (Markdown)
  generateCampaignReport: (campaignId: string) => string;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [DEFAULT_CAMPAIGN],
  sessions: [DEFAULT_SESSION_LOG],
  activeCampaignId: DEFAULT_CAMPAIGN.id,
  isLoading: false,

  loadCampaigns: async () => {
    set({ isLoading: true });
    try {
      const allCamp = await db.campaigns.toArray();
      if (allCamp.length > 0) {
        set({ campaigns: allCamp });
      }

      const allSessions = await db.sessions.toArray();
      if (allSessions.length > 0) {
        set({ sessions: allSessions });
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
      quests: [],
      timeline: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await db.campaigns.add(newCamp);
    } catch (err) {
      console.warn('Dexie add failed:', err);
    }

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

    try {
      await db.campaigns.put(updated);
    } catch (err) {
      console.warn('Dexie put failed:', err);
    }
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

  // Sessions
  createSessionLog: async (campaignId, data) => {
    const newSession: SessionLog = {
      id: `session-${Date.now()}`,
      campaignId,
      sessionNumber: data.sessionNumber,
      date: data.date,
      title: data.title,
      summary: data.summary,
      attendees: data.attendees || [],
      xpGranted: data.xpGranted,
      loot: data.loot || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await db.sessions.add(newSession);
    } catch (err) {
      console.warn('Dexie add session failed:', err);
    }

    set((state) => ({
      sessions: [newSession, ...state.sessions],
    }));

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Sessão Registrada',
      message: `Ata da Sessão #${newSession.sessionNumber} salva.`,
    });

    return newSession.id;
  },

  updateSessionLog: async (id, updates) => {
    const { sessions } = get();
    const index = sessions.findIndex((s) => s.id === id);
    if (index === -1) return;

    const updated: SessionLog = {
      ...sessions[index],
      ...updates,
      updatedAt: Date.now(),
    };

    const nextList = [...sessions];
    nextList[index] = updated;
    set({ sessions: nextList });

    try {
      await db.sessions.put(updated);
    } catch (err) {
      console.warn('Dexie put session failed:', err);
    }
  },

  deleteSessionLog: async (id) => {
    try {
      await db.sessions.delete(id);
    } catch (err) {
      console.warn('Dexie delete session failed:', err);
    }

    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    }));

    useAppStore.getState().addToast({
      type: 'info',
      title: 'Sessão Excluída',
      message: 'O registro de sessão foi removido.',
    });
  },

  // Quests
  addQuest: async (campaignId, data) => {
    const { campaigns, updateCampaign } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp) return;

    const objectives: QuestObjective[] = (data.objectives || []).map((t, i) => ({
      id: `obj-${Date.now()}-${i}`,
      text: t,
      completed: false,
    }));

    const newQuest: CampaignQuest = {
      id: `quest-${Date.now()}`,
      campaignId,
      title: data.title,
      description: data.description,
      status: 'active',
      giverNpc: data.giverNpc,
      location: data.location,
      reward: data.reward,
      objectives,
      createdAt: Date.now(),
    };

    const nextQuests = [...(camp.quests || []), newQuest];
    await updateCampaign(campaignId, { quests: nextQuests });

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Missão Adicionada',
      message: `Nova quest "${data.title}" registrada no diário.`,
    });
  },

  updateQuestStatus: async (campaignId, questId, status) => {
    const { campaigns, updateCampaign } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp || !camp.quests) return;

    const nextQuests = camp.quests.map((q) => (q.id === questId ? { ...q, status } : q));
    await updateCampaign(campaignId, { quests: nextQuests });
  },

  toggleQuestObjective: async (campaignId, questId, objectiveId) => {
    const { campaigns, updateCampaign } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp || !camp.quests) return;

    const nextQuests = camp.quests.map((q) => {
      if (q.id !== questId) return q;
      const nextObjectives = q.objectives.map((o) =>
        o.id === objectiveId ? { ...o, completed: !o.completed } : o
      );
      return { ...q, objectives: nextObjectives };
    });

    await updateCampaign(campaignId, { quests: nextQuests });
  },

  deleteQuest: async (campaignId, questId) => {
    const { campaigns, updateCampaign } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp || !camp.quests) return;

    const nextQuests = camp.quests.filter((q) => q.id !== questId);
    await updateCampaign(campaignId, { quests: nextQuests });
  },

  // Timeline
  addTimelineEvent: async (campaignId, event) => {
    const { campaigns, updateCampaign } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp) return;

    const newEvent: CampaignTimelineEvent = {
      ...event,
      id: `time-${Date.now()}`,
      campaignId,
    };

    const nextTimeline = [...(camp.timeline || []), newEvent];
    await updateCampaign(campaignId, { timeline: nextTimeline });

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Evento Registrado',
      message: `"${event.title}" adicionado à cronologia.`,
    });
  },

  deleteTimelineEvent: async (campaignId, eventId) => {
    const { campaigns, updateCampaign } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp || !camp.timeline) return;

    const nextTimeline = camp.timeline.filter((e) => e.id !== eventId);
    await updateCampaign(campaignId, { timeline: nextTimeline });
  },

  // Automated Report Generator
  generateCampaignReport: (campaignId) => {
    const { campaigns, sessions } = get();
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp) return '';

    const campSessions = sessions
      .filter((s) => s.campaignId === campaignId)
      .sort((a, b) => a.sessionNumber - b.sessionNumber);

    const totalXp = campSessions.reduce((acc, s) => acc + (s.xpGranted || 0), 0);
    const activeQuests = (camp.quests || []).filter((q) => q.status === 'active');
    const completedQuests = (camp.quests || []).filter((q) => q.status === 'completed');

    const lines: string[] = [
      `# 📜 Relatório de Campanha: ${camp.name}`,
      `*Gerado pelo ARCANA RPG Suite em ${new Date().toLocaleDateString('pt-BR')}*`,
      '',
      `## 📖 Visão Geral`,
      camp.description || 'Nenhuma descrição fornecida.',
      '',
      `## 📊 Estatísticas do Grupo`,
      `- **Total de Sessões Registradas:** ${campSessions.length}`,
      `- **XP Total Concedido:** ${totalXp} XP`,
      `- **Missões Concluídas:** ${completedQuests.length}`,
      `- **Missões Ativas:** ${activeQuests.length}`,
      '',
      `## 🎯 Diário de Missões`,
    ];

    if (activeQuests.length > 0) {
      lines.push('### 🟡 Missões Ativas');
      for (const q of activeQuests) {
        lines.push(`- **${q.title}** (${q.giverNpc ? `Doador: ${q.giverNpc}` : 'Geral'})`);
        if (q.description) lines.push(`  *${q.description}*`);
        for (const o of q.objectives) {
          lines.push(`  - [${o.completed ? 'x' : ' '}] ${o.text}`);
        }
      }
      lines.push('');
    }

    if (completedQuests.length > 0) {
      lines.push('### 🟢 Missões Concluídas');
      for (const q of completedQuests) {
        lines.push(`- **${q.title}** (Recompensa: ${q.reward || 'N/A'})`);
      }
      lines.push('');
    }

    lines.push('## 📅 Resumo das Sessões');
    if (campSessions.length === 0) {
      lines.push('*Nenhuma sessão registrada até o momento.*');
    } else {
      for (const s of campSessions) {
        lines.push(`### Sessão #${s.sessionNumber}: ${s.title} (${s.date})`);
        lines.push(`- **Participantes:** ${s.attendees.length > 0 ? s.attendees.join(', ') : 'Todo o grupo'}`);
        if (s.xpGranted) lines.push(`- **XP Ganho:** +${s.xpGranted} XP`);
        if (s.loot && s.loot.length > 0) lines.push(`- **Saque / Espólios:** ${s.loot.join(', ')}`);
        lines.push('');
        lines.push(s.summary);
        lines.push('');
      }
    }

    lines.push('## ⏳ Linha do Tempo Cronológica');
    const timeline = camp.timeline || [];
    if (timeline.length === 0) {
      lines.push('*Nenhum marco temporal registrado.*');
    } else {
      for (const evt of timeline) {
        lines.push(`- **[${evt.inGameDate}] ${evt.title}** (${evt.category.toUpperCase()}): ${evt.summary}`);
      }
    }

    return lines.join('\n');
  },
}));
