import { describe, it, expect } from 'vitest';
import { parseTextStatBlock } from '../utils/statBlockParser';

describe('Stat Block Parser', () => {
  it('correctly parses creature name, AC, HP and attributes', () => {
    const raw = `
      Dragão Negro Jovem
      Armor Class: 18
      Hit Points: 127
      Speed: 12m, voo 24m
      STR: 19
      DEX: 14
      CON: 17
      INT: 12
      WIS: 11
      CHA: 15
      Mordida. Ataque corpo a corpo: 2d10+4 dano perfurante.
      Sopro Ácido. Linha de ácido: 9d8 dano de ácido.
    `;

    const npc = parseTextStatBlock(raw, 'dnd5e');

    expect(npc.name).toBe('Dragão Negro Jovem');
    expect(npc.type).toBe('npc');
    expect(npc.attributes['armor_class']).toBe(18);
    expect(npc.attributes['hp_current']).toBe(127);
    expect(npc.attributes['hp_max']).toBe(127);
    expect(npc.attributes['str']).toBe(19);
    expect(npc.attributes['dex']).toBe(14);
    expect(npc.attributes['con']).toBe(17);
    expect(npc.attributes['mod_str']).toBe(4); // floor((19-10)/2) = 4
    expect(npc.attributes['mod_dex']).toBe(2);

    expect(npc.abilities.length).toBe(2);
    expect(npc.abilities[0].name).toBe('Mordida');
    expect(npc.abilities[0].formula).toBe('2d10+4');
    expect(npc.abilities[1].name).toBe('Sopro Ácido');
    expect(npc.abilities[1].formula).toBe('9d8');
  });

  it('gracefully handles partial or minimal stat blocks', () => {
    const minimal = `
      Rato Gigante
      CA: 12
      PV: 7
    `;
    const npc = parseTextStatBlock(minimal, 'dnd5e');
    expect(npc.name).toBe('Rato Gigante');
    expect(npc.attributes['armor_class']).toBe(12);
    expect(npc.attributes['hp_current']).toBe(7);
  });
});
