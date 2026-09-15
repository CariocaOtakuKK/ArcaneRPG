// ARCANA Encounter & Combat Tracker Store
// Manages initiative, turns, rounds, HP and conditions in real-time

import { create } from 'zustand';
import type { Encounter, EncounterCombatant } from '@/types';
import { db } from '@/core/db';
import { rollDice } from '@/core/dice/roller';

interface EncounterState {
  activeEncounter: Encounter;
  loadActiveEncounter: (campaignId?: string) => Promise<void>;
  addCombatant: (combatant: Omit<EncounterCombatant, 'id'>) => void;
  removeCombatant: (id: string) => void;
  updateCombatantHp: (id: string, delta: number) => void;
  setCombatantInitiative: (id: string, init: number) => void;
  toggleCombatantCondition: (id: string, condition: string) => void;
  rollAllInitiatives: (formula?: string) => void;
  nextTurn: () => void;
  prevTurn: () => void;
  resetCombat: () => void;
}

const DEFAULT_ENCOUNTER: Encounter = {
  id: 'enc-default',
  name: 'Encontro nas Catacumbas',
  round: 1,
  currentTurnIndex: 0,
  isActive: false,
  combatants: [
    {
      id: 'comb-elyon',
      name: 'Elyon, o Mago',
      initiative: 14,
      hpCurrent: 22,
      hpMax: 22,
      conditions: ['Inspirado'],
      isNpc: false,
    },
    {
      id: 'comb-skel-1',
      name: 'Esqueleto Guerreiro',
      initiative: 11,
      hpCurrent: 13,
      hpMax: 13,
      conditions: [],
      isNpc: true,
    },
    {
      id: 'comb-skel-2',
      name: 'Arqueiro Esqueleto',
      initiative: 8,
      hpCurrent: 11,
      hpMax: 11,
      conditions: [],
      isNpc: true,
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useEncounterStore = create<EncounterState>((set, get) => ({
  activeEncounter: DEFAULT_ENCOUNTER,

  loadActiveEncounter: async () => {
    try {
      const all = await db.encounters.toArray();
      if (all.length > 0) {
        set({ activeEncounter: all[0] });
      }
    } catch (err) {
      console.error('Falha ao carregar encontros', err);
    }
  },

  addCombatant: (combatant) => {
    const { activeEncounter } = get();
    const newComb: EncounterCombatant = {
      ...combatant,
      id: `comb-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };

    const updatedCombatants = [...activeEncounter.combatants, newComb].sort(
      (a, b) => b.initiative - a.initiative
    );

    const updated: Encounter = {
      ...activeEncounter,
      combatants: updatedCombatants,
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  removeCombatant: (id) => {
    const { activeEncounter } = get();
    const nextList = activeEncounter.combatants.filter((c) => c.id !== id);
    const updated: Encounter = {
      ...activeEncounter,
      combatants: nextList,
      currentTurnIndex: Math.max(0, Math.min(nextList.length - 1, activeEncounter.currentTurnIndex)),
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  updateCombatantHp: (id, delta) => {
    const { activeEncounter } = get();
    const updated = {
      ...activeEncounter,
      combatants: activeEncounter.combatants.map((c) => {
        if (c.id === id) {
          const nextHp = Math.max(0, Math.min(c.hpMax, c.hpCurrent + delta));
          return { ...c, hpCurrent: nextHp };
        }
        return c;
      }),
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  setCombatantInitiative: (id, init) => {
    const { activeEncounter } = get();
    const nextList = activeEncounter.combatants.map((c) =>
      c.id === id ? { ...c, initiative: init } : c
    );
    nextList.sort((a, b) => b.initiative - a.initiative);

    const updated: Encounter = {
      ...activeEncounter,
      combatants: nextList,
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  toggleCombatantCondition: (id, condition) => {
    const { activeEncounter } = get();
    const updated: Encounter = {
      ...activeEncounter,
      combatants: activeEncounter.combatants.map((c) => {
        if (c.id === id) {
          const has = c.conditions.includes(condition);
          const nextConds = has
            ? c.conditions.filter((cond) => cond !== condition)
            : [...c.conditions, condition];
          return { ...c, conditions: nextConds };
        }
        return c;
      }),
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  rollAllInitiatives: (formula = '1d20') => {
    const { activeEncounter } = get();
    const rolled = activeEncounter.combatants.map((c) => {
      const res = rollDice(formula);
      return { ...c, initiative: res.total };
    });
    rolled.sort((a, b) => b.initiative - a.initiative);

    const updated: Encounter = {
      ...activeEncounter,
      combatants: rolled,
      currentTurnIndex: 0,
      isActive: true,
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  nextTurn: () => {
    const { activeEncounter } = get();
    const count = activeEncounter.combatants.length;
    if (count === 0) return;

    let nextIndex = activeEncounter.currentTurnIndex + 1;
    let nextRound = activeEncounter.round;

    if (nextIndex >= count) {
      nextIndex = 0;
      nextRound += 1;
    }

    const updated: Encounter = {
      ...activeEncounter,
      currentTurnIndex: nextIndex,
      round: nextRound,
      isActive: true,
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  prevTurn: () => {
    const { activeEncounter } = get();
    const count = activeEncounter.combatants.length;
    if (count === 0) return;

    let nextIndex = activeEncounter.currentTurnIndex - 1;
    let nextRound = activeEncounter.round;

    if (nextIndex < 0) {
      nextIndex = Math.max(0, count - 1);
      nextRound = Math.max(1, nextRound - 1);
    }

    const updated: Encounter = {
      ...activeEncounter,
      currentTurnIndex: nextIndex,
      round: nextRound,
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },

  resetCombat: () => {
    const { activeEncounter } = get();
    const updated: Encounter = {
      ...activeEncounter,
      round: 1,
      currentTurnIndex: 0,
      isActive: false,
      updatedAt: Date.now(),
    };

    set({ activeEncounter: updated });
    db.encounters.put(updated).catch(console.error);
  },
}));
