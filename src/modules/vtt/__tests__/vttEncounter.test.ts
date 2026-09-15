import { describe, it, expect } from 'vitest';
import { useEncounterStore } from '../store/encounterStore';
import { useVTTStore } from '../store/vttStore';

describe('VTT & Combat Tracker Engine', () => {
  it('manages initiative order and turn progression', () => {
    const store = useEncounterStore.getState();
    store.resetCombat();

    expect(useEncounterStore.getState().activeEncounter.round).toBe(1);
    expect(useEncounterStore.getState().activeEncounter.currentTurnIndex).toBe(0);

    // Progress turn
    store.nextTurn();
    expect(useEncounterStore.getState().activeEncounter.currentTurnIndex).toBe(1);

    // Complete all turns to increment round
    const totalCombatants = useEncounterStore.getState().activeEncounter.combatants.length;
    for (let i = 1; i < totalCombatants; i++) {
      useEncounterStore.getState().nextTurn();
    }

    // Now round should have incremented to 2 and turn index reset to 0
    expect(useEncounterStore.getState().activeEncounter.round).toBe(2);
    expect(useEncounterStore.getState().activeEncounter.currentTurnIndex).toBe(0);
  });

  it('adjusts combatant HP within valid 0 to hpMax bounds', () => {
    const store = useEncounterStore.getState();
    const combatant = store.activeEncounter.combatants[0];

    // Apply damage (-5)
    store.updateCombatantHp(combatant.id, -5);
    const updated = useEncounterStore.getState().activeEncounter.combatants.find((c) => c.id === combatant.id);
    expect(updated?.hpCurrent).toBe(combatant.hpMax - 5);

    // Apply overkill damage
    store.updateCombatantHp(combatant.id, -999);
    const dead = useEncounterStore.getState().activeEncounter.combatants.find((c) => c.id === combatant.id);
    expect(dead?.hpCurrent).toBe(0);

    // Heal back up
    store.updateCombatantHp(combatant.id, 999);
    const healed = useEncounterStore.getState().activeEncounter.combatants.find((c) => c.id === combatant.id);
    expect(healed?.hpCurrent).toBe(combatant.hpMax);
  });

  it('toggles combat conditions', () => {
    const store = useEncounterStore.getState();
    const combatant = store.activeEncounter.combatants[0];

    store.toggleCombatantCondition(combatant.id, 'Atordoado');
    let c = useEncounterStore.getState().activeEncounter.combatants.find((x) => x.id === combatant.id);
    expect(c?.conditions).toContain('Atordoado');

    store.toggleCombatantCondition(combatant.id, 'Atordoado');
    c = useEncounterStore.getState().activeEncounter.combatants.find((x) => x.id === combatant.id);
    expect(c?.conditions).not.toContain('Atordoado');
  });

  it('adds and removes text labels on scene', () => {
    const vtt = useVTTStore.getState();
    vtt.addTextLabel({ x: 100, y: 150, text: 'Armadilha Detectada', color: '#ef4444' });

    const active = useVTTStore.getState().scenes.find((s) => s.id === vtt.activeSceneId);
    expect(active?.textLabels?.length).toBeGreaterThan(0);
    const label = active?.textLabels?.[0];
    expect(label?.text).toBe('Armadilha Detectada');

    if (label) {
      useVTTStore.getState().removeTextLabel(label.id);
      const after = useVTTStore.getState().scenes.find((s) => s.id === vtt.activeSceneId);
      expect(after?.textLabels?.some((l) => l.id === label.id)).toBe(false);
    }
  });

  it('toggles Fog of War state', () => {
    const vtt = useVTTStore.getState();
    const initialFog = Boolean(vtt.scenes.find((s) => s.id === vtt.activeSceneId)?.fogEnabled);

    vtt.toggleFog();
    const toggled = Boolean(useVTTStore.getState().scenes.find((s) => s.id === vtt.activeSceneId)?.fogEnabled);
    expect(toggled).toBe(!initialFog);

    vtt.toggleFog();
    const restored = Boolean(useVTTStore.getState().scenes.find((s) => s.id === vtt.activeSceneId)?.fogEnabled);
    expect(restored).toBe(initialFog);
  });
});
