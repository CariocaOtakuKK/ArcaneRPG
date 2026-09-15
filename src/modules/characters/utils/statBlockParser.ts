// ARCANA Stat Block Parser
// Parses plain-text RPG monster/NPC stat blocks into ARCANA Character/NPC objects

import type { Character, InventoryItem, AbilityItem } from '@/types';

export interface ParsedStatBlock {
  name: string;
  sizeType?: string;
  ac?: number;
  hp?: number;
  speed?: string;
  attributes: Record<string, number>;
  skills?: string[];
  senses?: string;
  languages?: string;
  cr?: string;
  abilities: AbilityItem[];
}

export function parseTextStatBlock(text: string, systemId: string = 'dnd5e'): Character {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  let name = 'Monstro Desconhecido';
  let hp = 20;
  let ac = 10;
  const attributes: Record<string, number> = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    mod_str: 0,
    mod_dex: 0,
    mod_con: 0,
    mod_int: 0,
    mod_wis: 0,
    mod_cha: 0,
  };
  const abilities: AbilityItem[] = [];
  const inventory: InventoryItem[] = [];
  let bio = '';

  if (lines.length > 0) {
    name = lines[0];
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Armor Class / CA / Defesa
    const acMatch = line.match(/(?:Armor Class|Classe de Armadura|CA|Defesa)[:\s]+(\d+)/i);
    if (acMatch) {
      ac = parseInt(acMatch[1], 10);
      continue;
    }

    // Hit Points / PV / Vida
    const hpMatch = line.match(/(?:Hit Points|Pontos de Vida|PV|Vida)[:\s]+(\d+)/i);
    if (hpMatch) {
      hp = parseInt(hpMatch[1], 10);
      continue;
    }

    // Speed / Deslocamento
    const speedMatch = line.match(/(?:Speed|Deslocamento)[:\s]+([^\n]+)/i);
    if (speedMatch) {
      bio += `Deslocamento: ${speedMatch[1]}\n`;
      continue;
    }

    // Ability Scores: STR DEX CON INT WIS CHA
    // Look for numbers following STR / FOR, etc.
    const strMatch = line.match(/(?:STR|FOR)[:\s]+(\d+)/i);
    const dexMatch = line.match(/(?:DEX|DES)[:\s]+(\d+)/i);
    const conMatch = line.match(/(?:CON)[:\s]+(\d+)/i);
    const intMatch = line.match(/(?:INT)[:\s]+(\d+)/i);
    const wisMatch = line.match(/(?:WIS|SAB)[:\s]+(\d+)/i);
    const chaMatch = line.match(/(?:CHA|CAR)[:\s]+(\d+)/i);

    if (strMatch) { attributes.str = parseInt(strMatch[1], 10); continue; }
    if (dexMatch) { attributes.dex = parseInt(dexMatch[1], 10); continue; }
    if (conMatch) { attributes.con = parseInt(conMatch[1], 10); continue; }
    if (intMatch) { attributes.int = parseInt(intMatch[1], 10); continue; }
    if (wisMatch) { attributes.wis = parseInt(wisMatch[1], 10); continue; }
    if (chaMatch) { attributes.cha = parseInt(chaMatch[1], 10); continue; }

    // Look for actions / attacks with dice formulas, e.g. "Espada Longa: 1d8+3" or "Mordida. +5 para acertar, dano 2d6+3"
    const actionMatch = line.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\s]+)[.:]\s*(.+)$/);
    if (actionMatch && !line.startsWith('STR') && !line.startsWith('FOR')) {
      const actionTitle = actionMatch[1].trim();
      const actionDesc = actionMatch[2].trim();

      // Check if description has dice formula
      const diceMatch = actionDesc.match(/(\d+d\d+(?:[+-]\d+)?)/i);
      const formula = diceMatch ? diceMatch[1] : undefined;

      abilities.push({
        id: `act-${Date.now()}-${abilities.length}`,
        name: actionTitle,
        formula,
        description: actionDesc,
      });
    }
  }

  // Calculate mods
  for (const k of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
    if (attributes[k] !== undefined) {
      attributes[`mod_${k}`] = Math.floor((attributes[k] - 10) / 2);
    }
  }
  attributes.armor_class = ac;
  attributes.defesa = ac;

  return {
    id: `npc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    systemId,
    name,
    type: 'npc',
    bio: bio || 'NPC importado via bloco de estatísticas.',
    attributes: {
      ...attributes,
      level: 1,
      hp_current: hp,
      hp_max: hp,
      pv: hp,
    },
    resources: {
      hp: { current: hp, max: hp },
      pv: { current: hp, max: hp },
    },
    inventory,
    abilities,
    notes: text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
