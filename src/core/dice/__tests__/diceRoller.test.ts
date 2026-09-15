import { describe, it, expect } from 'vitest';
import { rollDice, DiceRoller } from '../roller';
import { DiceParser } from '../parser';

describe('Dice Parser & Roller Engine', () => {
  it('parses basic arithmetic and dice notation', () => {
    const parser = new DiceParser('3d6 + 5 * 2');
    const ast = parser.parse();
    expect(ast.type).toBe('BINARY_OP');
  });

  it('rolls standard 3d6+2 within valid mathematical bounds', () => {
    for (let i = 0; i < 20; i++) {
      const res = rollDice('3d6 + 2');
      expect(res.total).toBeGreaterThanOrEqual(5); // 3*1 + 2
      expect(res.total).toBeLessThanOrEqual(20);  // 3*6 + 2
      expect(res.dice.length).toBe(1);
      expect(res.dice[0].rolls.length).toBe(3);
    }
  });

  it('handles Keep Highest (kh) correctly (e.g. 4d6kh3 for D&D)', () => {
    for (let i = 0; i < 15; i++) {
      const res = rollDice('4d6kh3');
      expect(res.total).toBeGreaterThanOrEqual(3);
      expect(res.total).toBeLessThanOrEqual(18);
      const discarded = res.dice[0].rolls.filter((r) => r.discarded);
      const kept = res.dice[0].rolls.filter((r) => !r.discarded);
      expect(discarded.length).toBe(1);
      expect(kept.length).toBe(3);
    }
  });

  it('handles Keep Lowest (kl) for disadvantage (2d20kl1)', () => {
    const res = rollDice('2d20kl1');
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.total).toBeLessThanOrEqual(20);
    const kept = res.dice[0].rolls.filter((r) => !r.discarded);
    const discarded = res.dice[0].rolls.filter((r) => r.discarded);
    expect(kept.length).toBe(1);
    expect(discarded.length).toBe(1);
    expect(kept[0].rolled).toBeLessThanOrEqual(discarded[0].rolled);
  });

  it('evaluates success pools (Vampire 5e: 6d10cs>=8)', () => {
    const res = rollDice('6d10cs>=8');
    expect(res.successes).toBeDefined();
    expect(res.successes).toBeGreaterThanOrEqual(0);
    expect(res.successes).toBeLessThanOrEqual(6);
    expect(res.total).toBe(res.successes);
  });

  it('supports Fate Fudge dice (4dF + 2)', () => {
    for (let i = 0; i < 20; i++) {
      const res = rollDice('4dF + 2');
      // 4dF produces between -4 and +4; plus 2 is between -2 and +6
      expect(res.total).toBeGreaterThanOrEqual(-2);
      expect(res.total).toBeLessThanOrEqual(6);
    }
  });

  it('supports percentile dice (1d100)', () => {
    const res = rollDice('1d100');
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.total).toBeLessThanOrEqual(100);
  });

  it('resolves variables ($modFor)', () => {
    const roller = new DiceRoller({ variables: { modFor: 4 } });
    const res = roller.roll('1d20 + $modFor');
    expect(res.variablesUsed).toEqual({ modFor: 4 });
    expect(res.total).toBeGreaterThanOrEqual(5);
    expect(res.total).toBeLessThanOrEqual(24);
  });

  it('throws descriptive error on missing variables', () => {
    expect(() => rollDice('1d20 + $missingVar')).toThrow(
      'Variável de rolagem "$missingVar" não encontrada'
    );
  });
});
