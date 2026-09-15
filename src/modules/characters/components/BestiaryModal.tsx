import React, { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useEncounterStore } from '@/modules/vtt/store/encounterStore';
import { useAppStore } from '@/core/store/appStore';
import { parseTextStatBlock } from '../utils/statBlockParser';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import {
  Skull,
  Search,
  FileText,
  Swords,
  Copy,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

export interface BestiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_STAT_BLOCK = `Goblin Salteador
Armor Class: 15
Hit Points: 7
Speed: 9m
STR: 8
DEX: 14
CON: 10
INT: 10
WIS: 8
CHA: 8
Cimitarra. Ataque corpo a corpo: 1d6+2 dano cortante.
Arco Curto. Ataque à distância: 1d6+2 dano perfurante.
Fuga Ágil. Pode usar Desengajar ou Esconder-se como ação bônus.`;

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ isOpen, onClose }) => {
  const characters = useCharacterStore((state) => state.characters);
  const deleteCharacter = useCharacterStore((state) => state.deleteCharacter);
  const addCombatant = useEncounterStore((state) => state.addCombatant);
  const activeSystemId = useAppStore((state) => state.activeSystemId);
  const addToast = useAppStore((state) => state.addToast);

  const [search, setSearch] = useState('');
  const [isImportMode, setIsImportMode] = useState(false);
  const [statBlockText, setStatBlockText] = useState(SAMPLE_STAT_BLOCK);

  const npcs = characters.filter((c) => c.type === 'npc');
  const filteredNpcs = npcs.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleImportStatBlock = () => {
    try {
      const npc = parseTextStatBlock(statBlockText, activeSystemId);
      // Save directly to characters
      useCharacterStore.setState((state) => ({
        characters: [npc, ...state.characters],
        activeCharacterId: npc.id,
      }));

      addToast({
        type: 'success',
        title: 'NPC Importado!',
        message: `"${npc.name}" adicionado com sucesso ao Bestiário.`,
      });

      setIsImportMode(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao analisar stat block';
      addToast({
        type: 'error',
        title: 'Erro no Stat Block',
        message: msg,
      });
    }
  };

  const handleSendToCombat = (npc: typeof npcs[0]) => {
    const hp = Number(npc.attributes['hp_current'] ?? npc.attributes['pv'] ?? 15);
    const modDex = Number(npc.attributes['mod_dex'] ?? npc.attributes['dex'] ?? 0);

    addCombatant({
      characterId: npc.id,
      name: npc.name,
      initiative: 10 + modDex,
      hpCurrent: hp,
      hpMax: Number(npc.attributes['hp_max'] ?? hp),
      conditions: [],
      isNpc: true,
    });

    addToast({
      type: 'info',
      title: 'Enviado ao Combate',
      message: `"${npc.name}" foi adicionado à lista de iniciativa da mesa.`,
    });
  };

  const handleDuplicateNpc = (npc: typeof npcs[0]) => {
    const clone = {
      ...npc,
      id: `npc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: `${npc.name} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    useCharacterStore.setState((state) => ({
      characters: [clone, ...state.characters],
    }));

    addToast({
      type: 'success',
      title: 'NPC Duplicado',
      message: `Criada variação "${clone.name}".`,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bestiário & Biblioteca de NPCs"
      maxWidth="xl"
      footer={
        <div className="flex justify-between w-full">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsImportMode(!isImportMode)}
            icon={<FileText className="w-3.5 h-3.5" />}
          >
            {isImportMode ? 'Ver Lista de Monstros' : 'Colar Stat Block (Importar)'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      {isImportMode ? (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-bg-tertiary border border-border-subtle text-xs text-text-secondary leading-relaxed">
            Cole abaixo o bloco de estatísticas (Stat Block) de qualquer monstro ou NPC em texto puro
            (formato D&D 5e, T20 ou Ordem Paranormal). O parser extrairá Nome, CA, PV, Atributos e Ações.
          </div>

          <Textarea
            rows={12}
            value={statBlockText}
            onChange={(e) => setStatBlockText(e.target.value)}
            className="font-mono text-xs"
            placeholder="Cole o Stat Block aqui..."
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleImportStatBlock}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Processar e Adicionar ao Bestiário
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar monstro por nome..."
              className="w-full bg-bg-tertiary border border-border-default rounded-md pl-9 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Monsters list */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredNpcs.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <Skull className="w-8 h-8 text-text-muted mx-auto" />
                <p className="text-xs text-text-muted">
                  Nenhum monstro cadastrado no momento.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsImportMode(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Importar Primeiro Monstro
                </Button>
              </div>
            ) : (
              filteredNpcs.map((npc) => {
                const hp = npc.attributes['hp_current'] ?? npc.attributes['pv'] ?? 10;
                const ac = npc.attributes['armor_class'] ?? npc.attributes['defesa'] ?? 10;

                return (
                  <Card
                    key={npc.id}
                    className="p-3 bg-bg-tertiary/70 border border-border-subtle hover:border-border-default flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-status-danger/20 border border-status-danger/30 flex items-center justify-center text-status-danger">
                        <Skull className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-text-primary truncate">{npc.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted font-mono">
                          <span>PV: {String(hp)}</span>
                          <span>•</span>
                          <span>CA/Def: {String(ac)}</span>
                          <span>•</span>
                          <span className="capitalize">{npc.systemId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSendToCombat(npc)}
                        icon={<Swords className="w-3 h-3 text-accent" />}
                        title="Enviar para o Tracker de Combate"
                      >
                        Combate
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicateNpc(npc)}
                        icon={<Copy className="w-3 h-3" />}
                        title="Duplicar Monstro"
                      />

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Remover "${npc.name}" do Bestiário?`)) {
                            deleteCharacter(npc.id);
                          }
                        }}
                        icon={<Trash2 className="w-3 h-3 text-status-danger" />}
                        title="Deletar Monstro"
                      />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
