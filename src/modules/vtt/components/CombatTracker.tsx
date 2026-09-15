import React, { useState } from 'react';
import { useEncounterStore } from '../store/encounterStore';
import { useCharacterStore } from '@/modules/characters/store/characterStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Swords,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Dices,
  Plus,
  Trash2,
  Heart,
} from 'lucide-react';

export const CombatTracker: React.FC = () => {
  const activeEncounter = useEncounterStore((state) => state.activeEncounter);
  const nextTurn = useEncounterStore((state) => state.nextTurn);
  const prevTurn = useEncounterStore((state) => state.prevTurn);
  const resetCombat = useEncounterStore((state) => state.resetCombat);
  const rollAllInitiatives = useEncounterStore((state) => state.rollAllInitiatives);
  const updateCombatantHp = useEncounterStore((state) => state.updateCombatantHp);
  const setCombatantInitiative = useEncounterStore((state) => state.setCombatantInitiative);
  const toggleCombatantCondition = useEncounterStore((state) => state.toggleCombatantCondition);
  const removeCombatant = useEncounterStore((state) => state.removeCombatant);
  const addCombatant = useEncounterStore((state) => state.addCombatant);

  const characters = useCharacterStore((state) => state.characters);

  const [newCombName, setNewCombName] = useState('');
  const [newCombHp, setNewCombHp] = useState(15);
  const [newCombInit, setNewCombInit] = useState(10);
  const [newCombIsNpc, setNewCombIsNpc] = useState(true);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombName.trim()) return;
    addCombatant({
      name: newCombName.trim(),
      initiative: Number(newCombInit) || 10,
      hpCurrent: Number(newCombHp) || 15,
      hpMax: Number(newCombHp) || 15,
      conditions: [],
      isNpc: newCombIsNpc,
    });
    setNewCombName('');
  };

  const handleAddFromRoster = (charId: string) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const hp = Number(char.attributes['hp_current'] ?? char.attributes['pv'] ?? 20);
    const modDex = Number(char.attributes['mod_dex'] ?? char.attributes['des'] ?? 0);

    addCombatant({
      characterId: char.id,
      name: char.name,
      initiative: 10 + modDex,
      hpCurrent: hp,
      hpMax: Number(char.attributes['hp_max'] ?? hp),
      conditions: [],
      isNpc: char.type === 'npc',
    });
  };

  const conditionsList = ['Cego', 'Envenenado', 'Inspirado', 'Caído', 'Atordoado', 'Sangrando'];

  return (
    <Card className="flex flex-col h-full bg-bg-secondary border border-border-default shadow-card p-4 space-y-4 select-none">
      {/* Header & Round Controls */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/20 text-accent">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Tracker de Combate
            </h3>
            <span className="text-[10px] text-text-muted">
              Round {activeEncounter.round} • {activeEncounter.combatants.length} combatentes
            </span>
          </div>
        </div>

        {/* Turn buttons */}
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={prevTurn} title="Turno Anterior">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Badge variant="primary" className="font-mono text-xs px-2 py-1">
            Turno {(activeEncounter.currentTurnIndex || 0) + 1}
          </Badge>
          <Button size="sm" variant="ghost" onClick={nextTurn} title="Próximo Turno">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={resetCombat} title="Reiniciar Combate">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => rollAllInitiatives('1d20')}
          icon={<Dices className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          Rolar Iniciativas
        </Button>

        {characters.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddFromRoster(e.target.value);
                e.target.value = '';
              }
            }}
            className="bg-bg-tertiary border border-border-default rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
          >
            <option value="">+ Personagem...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type.toUpperCase()})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Combatants Initiative Ordered List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {activeEncounter.combatants.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-muted">
            Nenhum combatente ativo no momento. Adicione heróis ou monstros abaixo.
          </div>
        ) : (
          activeEncounter.combatants.map((c, index) => {
            const isTurn = index === activeEncounter.currentTurnIndex;
            const hpPct = Math.max(0, Math.min(1, c.hpCurrent / c.hpMax));

            return (
              <div
                key={c.id}
                className={`p-3 rounded-lg border transition-all ${
                  isTurn
                    ? 'bg-bg-elevated border-accent shadow-subtle ring-1 ring-accent'
                    : 'bg-bg-tertiary/60 border-border-subtle hover:border-border-default'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="number"
                      value={c.initiative}
                      onChange={(e) => setCombatantInitiative(c.id, Number(e.target.value))}
                      className="w-12 bg-bg-primary text-center font-mono font-bold text-sm rounded border border-border-subtle py-0.5 text-accent focus:outline-none focus:border-border-focus"
                      title="Iniciativa"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary truncate">{c.name}</span>
                        {c.isNpc && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-status-danger/20 text-status-danger border border-status-danger/30">
                            NPC
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono mt-0.5">
                        <Heart className="w-3 h-3 text-status-danger inline" />
                        <span>
                          {c.hpCurrent} / {c.hpMax}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HP delta buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateCombatantHp(c.id, -5)}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-bg-elevated hover:bg-status-danger/20 hover:text-status-danger text-text-muted border border-border-subtle"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => updateCombatantHp(c.id, -1)}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-bg-elevated hover:bg-status-danger/20 hover:text-status-danger text-text-muted border border-border-subtle"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateCombatantHp(c.id, 1)}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-bg-elevated hover:bg-status-success/20 hover:text-status-success text-text-muted border border-border-subtle"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateCombatantHp(c.id, 5)}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-bg-elevated hover:bg-status-success/20 hover:text-status-success text-text-muted border border-border-subtle"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => removeCombatant(c.id)}
                      className="p-1 text-text-muted hover:text-status-danger transition-colors ml-1"
                      title="Remover combatente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* HP bar indicator */}
                <div className="w-full bg-bg-primary h-1.5 rounded-full mt-2 overflow-hidden border border-border-subtle">
                  <div
                    className={`h-full transition-all duration-300 ${
                      hpPct > 0.5
                        ? 'bg-status-success'
                        : hpPct > 0.2
                        ? 'bg-status-warning'
                        : 'bg-status-danger'
                    }`}
                    style={{ width: `${hpPct * 100}%` }}
                  />
                </div>

                {/* Conditions Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {conditionsList.map((cond) => {
                    const has = c.conditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        onClick={() => toggleCombatantCondition(c.id, cond)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                          has
                            ? 'bg-status-warning/20 text-status-warning border-status-warning/50'
                            : 'bg-bg-elevated text-text-muted border-border-subtle opacity-60 hover:opacity-100'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Monster Form */}
      <form onSubmit={handleAdd} className="pt-2 border-t border-border-subtle space-y-2">
        <div className="flex items-center gap-1.5">
          <input
            placeholder="Nome do monstro..."
            value={newCombName}
            onChange={(e) => setNewCombName(e.target.value)}
            className="flex-1 bg-bg-tertiary border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border-focus"
          />
          <input
            type="number"
            placeholder="PV"
            value={newCombHp}
            onChange={(e) => setNewCombHp(Number(e.target.value))}
            className="w-14 bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs font-mono text-center text-text-primary focus:outline-none"
            title="PV Total"
          />
          <input
            type="number"
            placeholder="Init"
            value={newCombInit}
            onChange={(e) => setNewCombInit(Number(e.target.value))}
            className="w-14 bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs font-mono text-center text-text-primary focus:outline-none"
            title="Iniciativa"
          />
          <label className="flex items-center gap-1 text-[10px] text-text-muted cursor-pointer" title="Marcar como Monstro / NPC">
            <input
              type="checkbox"
              checked={newCombIsNpc}
              onChange={(e) => setNewCombIsNpc(e.target.checked)}
              className="rounded text-accent focus:ring-0"
            />
            <span>NPC</span>
          </label>
          <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
            Add
          </Button>
        </div>
      </form>
    </Card>
  );
};
