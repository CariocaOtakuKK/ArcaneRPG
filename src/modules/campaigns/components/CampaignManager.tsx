import React, { useState } from 'react';
import { useCampaignStore } from '../store/campaignStore';
import { useCharacterStore } from '@/modules/characters/store/characterStore';
import { useVTTStore } from '@/modules/vtt/store/vttStore';
import { useAppStore } from '@/core/store/appStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { FolderGit2, Plus, Users, Map, CheckCircle2, Trash2 } from 'lucide-react';

export const CampaignManager: React.FC = () => {
  const campaigns = useCampaignStore((state) => state.campaigns);
  const activeCampaignId = useCampaignStore((state) => state.activeCampaignId);
  const selectCampaign = useCampaignStore((state) => state.selectCampaign);
  const createCampaign = useCampaignStore((state) => state.createCampaign);
  const updateCampaign = useCampaignStore((state) => state.updateCampaign);
  const deleteCampaign = useCampaignStore((state) => state.deleteCampaign);

  const characters = useCharacterStore((state) => state.characters);
  const scenes = useVTTStore((state) => state.scenes);
  const systems = useAppStore((state) => state.systems);

  const [newCampName, setNewCampName] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState(systems[0]?.id || 'd20-arcana');

  const activeCamp = campaigns.find((c) => c.id === activeCampaignId) || campaigns[0];

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;
    await createCampaign(newCampName.trim(), selectedSystemId, newCampDesc.trim());
    setNewCampName('');
    setNewCampDesc('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-accent" />
            Gestão de Campanhas
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Organize suas sagas, personagens vinculados e cenas ativas da mesa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Campaign List & Creation */}
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
              Campanhas Ativas ({campaigns.length})
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

        {/* Right Column: Active Campaign Details */}
        {activeCamp && (
          <div className="lg:col-span-2 space-y-6">
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
      </div>
    </div>
  );
};
