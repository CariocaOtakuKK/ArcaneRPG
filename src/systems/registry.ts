// ARCANA System Registry
// Manages builtin presets & custom systems

import type { SystemDefinition } from '@/types';
import { dnd5eSystem } from './presets/dnd5e';
import { ordemParanormalSystem } from './presets/ordem-paranormal';
import { tormenta20System } from './presets/tormenta20';
import { vampire5eSystem } from './presets/vampire5e';
import { coc7eSystem } from './presets/coc7e';
import { fateSystem } from './presets/fate';
import { genericSystem } from './presets/generico';

export const OFFICIAL_PRESETS: SystemDefinition[] = [
  dnd5eSystem,
  ordemParanormalSystem,
  tormenta20System,
  vampire5eSystem,
  coc7eSystem,
  fateSystem,
  genericSystem,
];

export class SystemRegistry {
  private static systemsMap = new Map<string, SystemDefinition>();

  static {
    for (const preset of OFFICIAL_PRESETS) {
      this.systemsMap.set(preset.id, preset);
    }
  }

  public static getSystem(id: string): SystemDefinition | undefined {
    return this.systemsMap.get(id);
  }

  public static getAllBuiltin(): SystemDefinition[] {
    return OFFICIAL_PRESETS;
  }

  public static registerCustom(system: SystemDefinition): void {
    this.systemsMap.set(system.id, system);
  }
}
