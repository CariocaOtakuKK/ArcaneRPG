import React, { useState } from 'react';
import { useCampaignStore } from '../store/campaignStore';
import { useCharacterStore } from '@/modules/characters/store/characterStore';
import { useVTTStore } from '@/modules/vtt/store/vttStore';
import { useAppStore } from '@/core/store/appStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  FolderGit2,
  Plus,
  Users,
  Map,
  CheckCircle2,
  Trash2,
  Calendar,
  Compass,
  History,
  FileCheck2,
  Copy,
  Download,
  Award,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { CampaignTimelineEvent } from '@/types';

type CampaignTab = 'overview' | 'sessions' | 'quests' | 'timeline' | 'report';

export const CampaignManager: React.FC = () => {
  const campaigns = useCampaignStore((state) => state.campaigns);
  const sessions = useCampaignStore((state) => state.sessions);
  const activeCampaignId = useCampaignStore((state) => state.activeCampaignId);
  const selectCampaign = useCampaignStore((state) => state.selectCampaign);
  const createCampaign = useCampaignStore((state) => state.createCampaign);
  const updateCampaign = useCampaignStore((state) => state.updateCampaign);
  const deleteCampaign = useCampaignStore((state) => state.deleteCampaign);
  const createSessionLog = useCampaignStore((state) => state.createSessionLog);
  const deleteSessionLog = useCampaignStore((state) => state.deleteSessionLog);
  const addQuest = useCampaignStore((state) => state.addQuest);
  const updateQuestStatus = useCampaignStore((state) => state.updateQuestStatus);
  const toggleQuestObjective = useCampaignStore((state) => state.toggleQuestObjective);
  const deleteQuest = useCampaignStore((state) => state.deleteQuest);
  const addTimelineEvent = useCampaignStore((state) => state.addTimelineEvent);
  const deleteTimelineEvent = useCampaignStore((state) => state.deleteTimelineEvent);
  const generateCampaignReport = useCampaignStore((state) => state.generateCampaignReport);

  const characters = useCharacterStore((state) => state.characters);
  const scenes = useVTTStore((state) => state.scenes);
  const systems = useAppStore((state) => state.systems);

  const [activeTab, setActiveTab] = useState<CampaignTab>('overview');

  // New Campaign state
  const [newCampName, setNewCampName] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState(systems[0]?.id || 'dnd5e');

  // New Session state
  const [sessionNum, setSessionNum] = useState(1);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessionXp, setSessionXp] = useState(250);
  const [sessionLoot, setSessionLoot] = useState('');

  // New Quest state
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [questGiver, setQuestGiver] = useState('');
  const [questReward, setQuestReward] = useState('');
  const [questObjectivesText, setQuestObjectivesText] = useState('');

  // New Timeline state
  const [timelineDate, setTimelineDate] = useState('Ano 1492 CV');
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineSummary, setTimelineSummary] = useState('');
  const [timelineCategory, setTimelineCategory] = useState<
    CampaignTimelineEvent['category']
  >('milestone');

  const activeCamp = campaigns.find((c) => c.id === activeCampaignId) || campaigns[0];

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;
    await createCampaign(newCampName.trim(), selectedSystemId, newCampDesc.trim());
    setNewCampName('');
    setNewCampDesc('');
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp || !sessionTitle.trim()) return;

    const lootArray = sessionLoot
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await createSessionLog(activeCamp.id, {
      sessionNumber: sessionNum,
      date: sessionDate,
      title: sessionTitle.trim(),
      summary: sessionSummary.trim(),
      attendees: activeCamp.characterIds.map(
        (id) => characters.find((c) => c.id === id)?.name || id
      ),
      xpGranted: Number(sessionXp) || 0,
      loot: lootArray,
    });

    setSessionTitle('');
    setSessionSummary('');
    setSessionLoot('');
    setSessionNum((prev) => prev + 1);
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp || !questTitle.trim()) return;

    const objectives = questObjectivesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    await addQuest(activeCamp.id, {
      title: questTitle.trim(),
      description: questDesc.trim(),
      giverNpc: questGiver.trim() || undefined,
      reward: questReward.trim() || undefined,
      objectives,
    });

    setQuestTitle('');
    setQuestDesc('');
    setQuestGiver('');
    setQuestReward('');
    setQuestObjectivesText('');
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp || !timelineTitle.trim()) return;

    await addTimelineEvent(activeCamp.id, {
      inGameDate: timelineDate.trim(),
      title: timelineTitle.trim(),
      summary: timelineSummary.trim(),
      category: timelineCategory,
    });

    setTimelineTitle('');
    setTimelineSummary('');
  };

  const campSessions = activeCamp
    ? sessions
        .filter((s) => s.campaignId === activeCamp.id)
        .sort((a, b) => b.sessionNumber - a.sessionNumber)
    : [];

  const handleCopyReport = () => {
    if (!activeCamp) return;
    const report = generateCampaignReport(activeCamp.id);
    navigator.clipboard.writeText(report);
    useAppStore.getState().addToast({
      type: 'success',
      title: 'Relatório Copiado',
      message: 'O relatório consolidado da campanha foi copiado para a área de transferência!',
    });
  };

  const handleDownloadReport = () => {
    if (!activeCamp) return;
    const report = generateCampaignReport(activeCamp.id);
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${activeCamp.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-accent" />
            Gestão de Campanhas & Sessões
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Registro de atas de sessões, diário de missões (quests), linha do tempo cronológica e relatório automatizado.
          </p>
        </div>

        {/* Global Tabs */}
        <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-lg border border-border-subtle overflow-x-auto">
          <Button
            size="sm"
            variant={activeTab === 'overview' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            icon={<FolderGit2 className="w-3.5 h-3.5" />}
          >
            Visão Geral
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'sessions' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('sessions')}
            icon={<Calendar className="w-3.5 h-3.5" />}
          >
            Sessões ({campSessions.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'quests' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('quests')}
            icon={<Compass className="w-3.5 h-3.5" />}
          >
            Missões ({activeCamp?.quests?.length || 0})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'timeline' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('timeline')}
            icon={<History className="w-3.5 h-3.5" />}
          >
            Linha do Tempo
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'report' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('report')}
            icon={<FileCheck2 className="w-3.5 h-3.5" />}
          >
            Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Campaign Picker & Quick Info */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Nova Campanha
            </h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <Input
                label="Nome da Campanha"
                placeholder="Ex: Maldição dos Reis Antigos"
                value={newCampName}
                onChange={(e) => setNewCampName(e.target.value)}
              />
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Sistema de Regras
                </label>
                <select
                  value={selectedSystemId}
                  onChange={(e) => setSelectedSystemId(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
                >
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <Textarea
                label="Descrição Breve"
                rows={2}
                placeholder="Sinopse do mundo ou premissa..."
                value={newCampDesc}
                onChange={(e) => setNewCampDesc(e.target.value)}
              />
              <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                Criar Campanha
              </Button>
            </form>
          </Card>

          {/* List of campaigns */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Campanhas ({campaigns.length})
            </h3>
            {campaigns.map((camp) => {
              const isActive = camp.id === activeCampaignId;
              const systemObj = systems.find((s) => s.id === camp.systemId);

              return (
                <Card
                  key={camp.id}
                  onClick={() => selectCampaign(camp.id)}
                  className={`p-3 cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-bg-elevated border-accent shadow-subtle'
                      : 'bg-bg-secondary border-border-subtle hover:bg-bg-tertiary'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-text-primary">{camp.name}</h4>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />}
                      </div>
                      <span className="text-[10px] text-accent block mt-0.5">
                        {systemObj ? systemObj.name : 'Sistema Personalizado'}
                      </span>
                    </div>

                    {campaigns.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remover campanha "${camp.name}"?`)) {
                            deleteCampaign(camp.id);
                          }
                        }}
                        className="text-text-muted hover:text-status-danger p-1"
                        aria-label="Deletar campanha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Selected Tab Content */}
        {activeCamp && (
          <div className="lg:col-span-2 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="space-y-4 border-l-4 border-l-accent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{activeCamp.name}</h3>
                      <Badge variant="primary">
                        {systems.find((s) => s.id === activeCamp.systemId)?.name || 'Sistema D20'}
                      </Badge>
                    </div>
                  </div>

                  <Textarea
                    label="Sinopse / Visão Geral"
                    rows={3}
                    value={activeCamp.description}
                    onChange={(e) => updateCampaign(activeCamp.id, { description: e.target.value })}
                  />
                </Card>

                {/* Linked Characters */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-accent" />
                      Personagens do Grupo
                    </h4>
                    <span className="text-xs text-text-muted">{characters.length} no sistema</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {characters.map((char) => {
                      const isLinked = activeCamp.characterIds.includes(char.id);
                      return (
                        <div
                          key={char.id}
                          className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-semibold text-text-primary block">
                              {char.name}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Nível {String(char.attributes['level'] ?? 1)}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              const updated = isLinked
                                ? activeCamp.characterIds.filter((id) => id !== char.id)
                                : [...activeCamp.characterIds, char.id];
                              updateCampaign(activeCamp.id, { characterIds: updated });
                            }}
                            className={`text-xs px-2.5 py-1 rounded transition-colors ${
                              isLinked
                                ? 'bg-status-success/20 text-status-success border border-status-success/40'
                                : 'bg-bg-elevated text-text-muted border border-border-subtle hover:text-text-primary'
                            }`}
                          >
                            {isLinked ? 'Vinculado' : '+ Vincular'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Linked Scenes */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                      <Map className="w-3.5 h-3.5 text-accent" />
                      Cenas da Mesa Virtual (VTT)
                    </h4>
                    <span className="text-xs text-text-muted">{scenes.length} disponíveis</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scenes.map((scene) => {
                      const isCurrent = activeCamp.activeSceneId === scene.id;
                      return (
                        <div
                          key={scene.id}
                          className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-bg-tertiary border-accent'
                              : 'bg-bg-tertiary border-border-subtle'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-semibold text-text-primary block">
                              {scene.name}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {scene.tokens.length} tokens • {scene.width}x{scene.height}px
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant={isCurrent ? 'primary' : 'secondary'}
                            onClick={() => updateCampaign(activeCamp.id, { activeSceneId: scene.id })}
                          >
                            {isCurrent ? 'Cena Ativa' : 'Ativar'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 2: SESSIONS */}
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                {/* Add Session Form */}
                <Card className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    Registrar Nova Sessão
                  </h4>

                  <form onSubmit={handleAddSession} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-text-secondary uppercase block mb-1">
                          Nº Sessão
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={sessionNum}
                          onChange={(e) => setSessionNum(Number(e.target.value))}
                          className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-text-secondary uppercase block mb-1">
                          Data do Jogo
                        </label>
                        <input
                          type="date"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-text-secondary uppercase block mb-1">
                          XP Concedido
                        </label>
                        <input
                          type="number"
                          value={sessionXp}
                          onChange={(e) => setSessionXp(Number(e.target.value))}
                          className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs text-text-primary"
                        />
                      </div>
                    </div>

                    <Input
                      label="Título da Sessão"
                      placeholder="Ex: O Labirinto das Almas Perdidas"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                    />

                    <Textarea
                      label="Ata / Resumo dos Acontecimentos"
                      rows={4}
                      placeholder="Descreva as decisões críticas dos personagens, batalhas travadas e descobertas..."
                      value={sessionSummary}
                      onChange={(e) => setSessionSummary(e.target.value)}
                    />

                    <Input
                      label="Saques & Itens Encontrados (Separar por vírgula)"
                      placeholder="Ex: Espada Longa +1, 100 PO, Chave de Jade"
                      value={sessionLoot}
                      onChange={(e) => setSessionLoot(e.target.value)}
                    />

                    <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                      Salvar Registro de Sessão
                    </Button>
                  </form>
                </Card>

                {/* Session List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Histórico de Sessões ({campSessions.length})
                  </h4>

                  {campSessions.length === 0 ? (
                    <p className="text-xs text-text-muted">Nenhuma sessão registrada ainda.</p>
                  ) : (
                    campSessions.map((session) => (
                      <Card key={session.id} className="p-4 space-y-3 bg-bg-secondary border border-border-subtle">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="primary" className="font-bold">
                                Sessão #{session.sessionNumber}
                              </Badge>
                              <h5 className="text-sm font-bold text-text-primary">{session.title}</h5>
                            </div>
                            <span className="text-[10px] text-text-muted block mt-1">
                              📅 {session.date} • {session.attendees.join(', ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {session.xpGranted ? (
                              <span className="text-xs font-semibold text-status-success flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" /> +{session.xpGranted} XP
                              </span>
                            ) : null}
                            <button
                              onClick={() => {
                                if (confirm('Excluir esta sessão?')) {
                                  deleteSessionLog(session.id);
                                }
                              }}
                              className="text-text-muted hover:text-status-danger p-1"
                              title="Excluir sessão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-text-secondary leading-relaxed bg-bg-tertiary/60 p-3 rounded">
                          {session.summary}
                        </p>

                        {session.loot && session.loot.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] text-text-muted font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-status-warning" /> Saque:
                            </span>
                            {session.loot.map((item, idx) => (
                              <Badge key={idx} variant="warning" className="text-[10px]">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: QUESTS */}
            {activeTab === 'quests' && (
              <div className="space-y-6">
                {/* Add Quest Form */}
                <Card className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <Compass className="w-4 h-4 text-accent" />
                    Registrar Nova Missão / Quest
                  </h4>

                  <form onSubmit={handleAddQuest} className="space-y-3">
                    <Input
                      label="Título da Missão"
                      placeholder="Ex: O Coração da Montanha"
                      value={questTitle}
                      onChange={(e) => setQuestTitle(e.target.value)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Doador / NPC Responsável"
                        placeholder="Ex: Arquimago Therion"
                        value={questGiver}
                        onChange={(e) => setQuestGiver(e.target.value)}
                      />
                      <Input
                        label="Recompensa Prometida"
                        placeholder="Ex: 500 PO e Anel de Invisibilidade"
                        value={questReward}
                        onChange={(e) => setQuestReward(e.target.value)}
                      />
                    </div>

                    <Textarea
                      label="Descrição da Missão"
                      rows={2}
                      placeholder="Qual é a urgência e contexto da missão..."
                      value={questDesc}
                      onChange={(e) => setQuestDesc(e.target.value)}
                    />

                    <Textarea
                      label="Objetivos (Um por linha)"
                      rows={3}
                      placeholder="Encontrar a entrada das cavernas&#10;Derrotar o lorde ogro&#10;Recuperar o medalhão"
                      value={questObjectivesText}
                      onChange={(e) => setQuestObjectivesText(e.target.value)}
                    />

                    <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                      Adicionar ao Diário de Quests
                    </Button>
                  </form>
                </Card>

                {/* Quests List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Diário de Missões ({activeCamp.quests?.length || 0})
                  </h4>

                  {(!activeCamp.quests || activeCamp.quests.length === 0) ? (
                    <p className="text-xs text-text-muted">Nenhuma quest cadastrada.</p>
                  ) : (
                    activeCamp.quests.map((q) => (
                      <Card
                        key={q.id}
                        className={`p-4 space-y-3 border transition-colors ${
                          q.status === 'completed'
                            ? 'bg-bg-tertiary/40 border-status-success/30'
                            : q.status === 'failed'
                            ? 'bg-bg-tertiary/40 border-status-danger/30'
                            : 'bg-bg-secondary border-border-default'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-text-primary">{q.title}</h5>
                              <Badge
                                variant={
                                  q.status === 'completed'
                                    ? 'success'
                                    : q.status === 'failed'
                                    ? 'danger'
                                    : 'warning'
                                }
                                className="uppercase text-[10px]"
                              >
                                {q.status === 'active'
                                  ? 'Ativa'
                                  : q.status === 'completed'
                                  ? 'Concluída'
                                  : 'Falhada'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-text-muted mt-1">
                              {q.giverNpc && <span>👤 Doador: {q.giverNpc}</span>}
                              {q.reward && <span className="text-accent">💰 Recompensa: {q.reward}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={q.status}
                              onChange={(e) =>
                                updateQuestStatus(
                                  activeCamp.id,
                                  q.id,
                                  e.target.value as 'active' | 'completed' | 'failed'
                                )
                              }
                              className="text-[11px] bg-bg-tertiary border border-border-default rounded px-2 py-1 text-text-primary focus:outline-none"
                            >
                              <option value="active">Ativa</option>
                              <option value="completed">Concluída</option>
                              <option value="failed">Falhada</option>
                            </select>

                            <button
                              onClick={() => deleteQuest(activeCamp.id, q.id)}
                              className="text-text-muted hover:text-status-danger p-1"
                              title="Deletar missão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {q.description && (
                          <p className="text-xs text-text-secondary italic">{q.description}</p>
                        )}

                        {/* Objectives checklist */}
                        {q.objectives.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border-subtle">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                              Objetivos:
                            </span>
                            {q.objectives.map((obj) => (
                              <button
                                key={obj.id}
                                onClick={() => toggleQuestObjective(activeCamp.id, q.id, obj.id)}
                                className="w-full flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-bg-tertiary transition-colors text-left"
                              >
                                {obj.completed ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-status-success shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                )}
                                <span
                                  className={
                                    obj.completed
                                      ? 'line-through text-text-muted'
                                      : 'text-text-primary'
                                  }
                                >
                                  {obj.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                {/* Add Timeline Event */}
                <Card className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <History className="w-4 h-4 text-accent" />
                    Adicionar Marco à Linha do Tempo
                  </h4>

                  <form onSubmit={handleAddTimeline} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Data no Mundo de Jogo"
                        placeholder="Ex: Ano 1492 - 15 de Mirtul"
                        value={timelineDate}
                        onChange={(e) => setTimelineDate(e.target.value)}
                      />
                      <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                          Categoria do Evento
                        </label>
                        <select
                          value={timelineCategory}
                          onChange={(e) =>
                            setTimelineCategory(e.target.value as CampaignTimelineEvent['category'])
                          }
                          className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                        >
                          <option value="milestone">Marco Épico</option>
                          <option value="combat">Batalha / Conflito</option>
                          <option value="discovery">Descoberta Arcana</option>
                          <option value="lore">História / Política</option>
                          <option value="tragedy">Tragédia / Queda</option>
                        </select>
                      </div>
                    </div>

                    <Input
                      label="Título do Evento"
                      placeholder="Ex: A Queda do Portão de Jade"
                      value={timelineTitle}
                      onChange={(e) => setTimelineTitle(e.target.value)}
                    />

                    <Textarea
                      label="Detalhes do Acontecimento"
                      rows={2}
                      placeholder="Resumo cronológico das repercussões no mundo..."
                      value={timelineSummary}
                      onChange={(e) => setTimelineSummary(e.target.value)}
                    />

                    <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                      Gravar na Linha do Tempo
                    </Button>
                  </form>
                </Card>

                {/* Timeline Visualization */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Cronologia da Campanha
                  </h4>

                  {(!activeCamp.timeline || activeCamp.timeline.length === 0) ? (
                    <p className="text-xs text-text-muted">Nenhum evento registrado na linha do tempo.</p>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-accent/40 space-y-6">
                      {activeCamp.timeline.map((evt) => (
                        <div key={evt.id} className="relative group">
                          {/* Dot marker */}
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-accent border-2 border-bg-primary shadow-glow flex items-center justify-center text-[8px]" />

                          <Card className="p-3 space-y-1.5 bg-bg-secondary border border-border-subtle">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-accent px-1.5 py-0.5 rounded bg-accent/20">
                                  {evt.inGameDate}
                                </span>
                                <Badge
                                  variant={
                                    evt.category === 'combat'
                                      ? 'danger'
                                      : evt.category === 'discovery'
                                      ? 'info'
                                      : evt.category === 'milestone'
                                      ? 'success'
                                      : 'neutral'
                                  }
                                  className="text-[9px] uppercase"
                                >
                                  {evt.category}
                                </Badge>
                                <h5 className="text-xs font-bold text-text-primary">{evt.title}</h5>
                              </div>

                              <button
                                onClick={() => deleteTimelineEvent(activeCamp.id, evt.id)}
                                className="text-text-muted hover:text-status-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Excluir evento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-xs text-text-secondary">{evt.summary}</p>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: AUTOMATED REPORT */}
            {activeTab === 'report' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-status-success" />
                    Relatório Automatizado da Campanha
                  </h4>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyReport}
                      icon={<Copy className="w-3.5 h-3.5" />}
                    >
                      Copiar Markdown
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleDownloadReport}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Baixar Relatório .md
                    </Button>
                  </div>
                </div>

                <Card className="p-4 bg-bg-secondary border border-border-default">
                  <pre className="font-mono text-xs text-text-secondary whitespace-pre-wrap leading-relaxed select-all">
                    {generateCampaignReport(activeCamp.id)}
                  </pre>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
