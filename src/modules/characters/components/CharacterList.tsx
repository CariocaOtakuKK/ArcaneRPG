import React, { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useAppStore } from '@/core/store/appStore';
import { BestiaryModal } from './BestiaryModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Plus, User, Trash2, Skull } from 'lucide-react';

export const CharacterList: React.FC = () => {
  const characters = useCharacterStore((state) => state.characters);
  const activeCharacterId = useCharacterStore((state) => state.activeCharacterId);
  const selectCharacter = useCharacterStore((state) => state.selectCharacter);
  const createNewCharacter = useCharacterStore((state) => state.createNewCharacter);
  const deleteCharacter = useCharacterStore((state) => state.deleteCharacter);

  const systems = useAppStore((state) => state.systems);
  const activeSystemId = useAppStore((state) => state.activeSystemId);
  const activeCampaignId = useAppStore((state) => state.activeCampaignId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(activeSystemId);

  const handleCreate = async () => {
    await createNewCharacter(selectedSystem, activeCampaignId || undefined);
    setIsModalOpen(false);
  };

  return (
    <div className="w-80 border-r border-border-subtle bg-bg-secondary flex flex-col h-[calc(100vh-3.5rem)] select-none">
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Fichas & Bestiário</h2>
          <span className="text-xs text-text-muted">{characters.length} cadastrados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            icon={<Skull className="w-3.5 h-3.5" />}
            onClick={() => setIsBestiaryOpen(true)}
            title="Abrir Bestiário / NPCs"
          >
            Bestiário
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
            title="Criar Nova Ficha de Jogador"
          >
            Nova
          </Button>
        </div>
      </div>

      <div className="p-3 overflow-y-auto flex-1 space-y-2">
        {characters.map((char) => {
          const isActive = char.id === activeCharacterId;
          const charSystem = systems.find((s) => s.id === char.systemId);

          return (
            <Card
              key={char.id}
              onClick={() => selectCharacter(char.id)}
              className={`p-3 cursor-pointer transition-all border flex items-center justify-between group ${
                isActive
                  ? 'bg-bg-elevated border-accent shadow-subtle'
                  : 'bg-bg-tertiary/60 border-border-subtle hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    isActive ? 'bg-accent text-text-primary' : 'bg-bg-elevated text-text-muted'
                  }`}
                >
                  {charSystem?.icon || <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-text-primary truncate">{char.name}</h4>
                  <p className="text-[11px] text-text-muted truncate">
                    {charSystem?.name || 'Sistema Próprio'}
                  </p>
                </div>
              </div>

              {characters.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Deseja realmente remover "${char.name}"?`)) {
                      deleteCharacter(char.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-status-danger transition-opacity"
                  aria-label="Deletar personagem"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal do Bestiário & Stat Block Parser */}
      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
      />

      {/* Modal de Criação de Personagem com Seleção de Sistema */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Nova Ficha de Personagem"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Criar Personagem
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Selecione qual sistema de regras deseja utilizar para a nova ficha. Todos os
            atributos, fórmulas e recursos serão gerados automaticamente a partir do preset.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Sistema de RPG
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {systems.map((sys) => {
                const isSelected = sys.id === selectedSystem;
                return (
                  <div
                    key={sys.id}
                    onClick={() => setSelectedSystem(sys.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-bg-elevated border-accent shadow-subtle'
                        : 'bg-bg-tertiary border-border-subtle hover:border-border-default'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{sys.icon || '📜'}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-text-primary">{sys.name}</h4>
                        <span className="text-[10px] text-text-muted line-clamp-1">
                          {sys.description}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-primary text-accent border border-border-subtle">
                      {sys.rollConvention.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
