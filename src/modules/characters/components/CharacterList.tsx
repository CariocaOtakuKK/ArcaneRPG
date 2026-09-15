import React from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useAppStore } from '@/core/store/appStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, User, Trash2 } from 'lucide-react';

export const CharacterList: React.FC = () => {
  const characters = useCharacterStore((state) => state.characters);
  const activeCharacterId = useCharacterStore((state) => state.activeCharacterId);
  const selectCharacter = useCharacterStore((state) => state.selectCharacter);
  const createNewCharacter = useCharacterStore((state) => state.createNewCharacter);
  const deleteCharacter = useCharacterStore((state) => state.deleteCharacter);

  const activeSystemId = useAppStore((state) => state.activeSystemId);
  const activeCampaignId = useAppStore((state) => state.activeCampaignId);

  return (
    <div className="w-80 border-r border-border-subtle bg-bg-secondary flex flex-col h-[calc(100vh-3.5rem)] select-none">
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Fichas</h2>
          <span className="text-xs text-text-muted">{characters.length} cadastrados</span>
        </div>
        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => createNewCharacter(activeSystemId, activeCampaignId || undefined)}
        >
          Nova
        </Button>
      </div>

      <div className="p-3 overflow-y-auto flex-1 space-y-2">
        {characters.map((char) => {
          const isActive = char.id === activeCharacterId;
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
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-text-primary truncate">{char.name}</h4>
                  <p className="text-[11px] text-text-muted">
                    Nível {String(char.attributes['level'] ?? 1)} • PVs{' '}
                    {String(char.attributes['hp_current'] ?? 0)}
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
    </div>
  );
};
