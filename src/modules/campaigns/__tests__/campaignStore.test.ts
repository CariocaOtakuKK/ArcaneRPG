import { describe, it, expect } from 'vitest';
import { useCampaignStore } from '../store/campaignStore';

describe('Campaigns, Sessions & Timeline Engine', () => {
  it('creates and manages session logs with attendees and XP', async () => {
    const store = useCampaignStore.getState();
    const campId = store.activeCampaignId || store.campaigns[0].id;

    const sessionId = await store.createSessionLog(campId, {
      title: 'A Batalha do Desfiladeiro',
      sessionNumber: 2,
      date: '2026-09-12',
      summary: 'O grupo armou uma emboscada bem-sucedida contra os orcs.',
      attendees: ['Elyon', 'Kaelen'],
      xpGranted: 500,
      loot: ['Escudo Encantado'],
    });

    expect(sessionId).toBeDefined();
    const session = useCampaignStore.getState().sessions.find((s) => s.id === sessionId);
    expect(session?.title).toBe('A Batalha do Desfiladeiro');
    expect(session?.xpGranted).toBe(500);
    expect(session?.loot).toContain('Escudo Encantado');
  });

  it('manages quest lifecycle and objectives', async () => {
    const store = useCampaignStore.getState();
    const campId = store.activeCampaignId || store.campaigns[0].id;

    await store.addQuest(campId, {
      title: 'Purificar a Fonte Sagrada',
      description: 'Águas corrompidas por miasma antigo.',
      giverNpc: 'Clériga Varis',
      reward: '300 PO',
      objectives: ['Encontrar o templo', 'Derrotar a aberração'],
    });

    const camp = useCampaignStore.getState().campaigns.find((c) => c.id === campId);
    const quest = camp?.quests?.find((q) => q.title === 'Purificar a Fonte Sagrada');
    expect(quest).toBeDefined();
    expect(quest?.objectives.length).toBe(2);
    expect(quest?.status).toBe('active');

    // Toggle objective
    if (quest) {
      const objId = quest.objectives[0].id;
      await store.toggleQuestObjective(campId, quest.id, objId);
      const afterObj = useCampaignStore
        .getState()
        .campaigns.find((c) => c.id === campId)
        ?.quests?.find((q) => q.id === quest.id)
        ?.objectives.find((o) => o.id === objId);
      expect(afterObj?.completed).toBe(true);

      // Complete quest
      await store.updateQuestStatus(campId, quest.id, 'completed');
      const completedQuest = useCampaignStore
        .getState()
        .campaigns.find((c) => c.id === campId)
        ?.quests?.find((q) => q.id === quest.id);
      expect(completedQuest?.status).toBe('completed');
    }
  });

  it('records timeline events chronologically', async () => {
    const store = useCampaignStore.getState();
    const campId = store.activeCampaignId || store.campaigns[0].id;

    await store.addTimelineEvent(campId, {
      inGameDate: 'Ano 1492 - 20 de Mirtul',
      title: 'Assinatura do Tratado de Paz',
      summary: 'Os dois reinos cessaram as hostilidades.',
      category: 'milestone',
    });

    const camp = useCampaignStore.getState().campaigns.find((c) => c.id === campId);
    const evt = camp?.timeline?.find((t) => t.title === 'Assinatura do Tratado de Paz');
    expect(evt).toBeDefined();
    expect(evt?.category).toBe('milestone');
  });

  it('generates a comprehensive Markdown campaign report', () => {
    const store = useCampaignStore.getState();
    const campId = store.activeCampaignId || store.campaigns[0].id;
    const report = store.generateCampaignReport(campId);

    expect(report).toContain('# 📜 Relatório de Campanha');
    expect(report).toContain('Diário de Missões');
    expect(report).toContain('Linha do Tempo Cronológica');
    expect(report).toContain('Resumo das Sessões');
  });
});
