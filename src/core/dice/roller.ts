// ARCANA Dice Engine — Roller Executor
// Safe execution of AST nodes, modifiers, pool evaluations and statistics

import { DiceParser, type ASTNode, type ASTRollNode } from './parser';
import type {
  RollResult,
  DiePoolResult,
  SingleDieResult,
  Comparison,
} from './types';

export interface RollOptions {
  variables?: Record<string, number>;
  label?: string;
  systemId?: string;
  characterId?: string;
  isPublic?: boolean;
}

export class DiceRoller {
  private variables: Record<string, number>;
  private recordedPools: DiePoolResult[] = [];
  private highCrits: number[] = [];
  private lowCrits: number[] = [];
  private totalSuccesses = 0;
  private totalFailures = 0;
  private hasPoolEvaluation = false;

  constructor(options: RollOptions = {}) {
    this.variables = options.variables || {};
  }

  public roll(expression: string, options: RollOptions = {}): RollResult {
    this.variables = { ...this.variables, ...(options.variables || {}) };
    this.recordedPools = [];
    this.highCrits = [];
    this.lowCrits = [];
    this.totalSuccesses = 0;
    this.totalFailures = 0;
    this.hasPoolEvaluation = false;

    const parser = new DiceParser(expression);
    const ast = parser.parse();

    const calculatedTotal = this.evaluateNode(ast);

    // If it's a success-pool (e.g. Vampiro 6d10cs>=8), total is successes
    const finalTotal = this.hasPoolEvaluation ? this.totalSuccesses : calculatedTotal;

    return {
      id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      expression,
      total: finalTotal,
      dice: this.recordedPools,
      variablesUsed: Object.keys(this.variables).length > 0 ? this.variables : undefined,
      crits: {
        high: this.highCrits,
        low: this.lowCrits,
      },
      successes: this.hasPoolEvaluation ? this.totalSuccesses : undefined,
      failures: this.hasPoolEvaluation ? this.totalFailures : undefined,
      label: options.label,
      systemId: options.systemId,
      characterId: options.characterId,
      createdAt: Date.now(),
      isPublic: options.isPublic ?? true,
    };
  }

  private evaluateNode(node: ASTNode): number {
    switch (node.type) {
      case 'NUMBER':
        return node.value;

      case 'VARIABLE': {
        const val = this.variables[node.name];
        if (val === undefined) {
          throw new Error(
            `Variável de rolagem "$${node.name}" não encontrada no contexto de personagem/mesa.`
          );
        }
        return val;
      }

      case 'UNARY_OP':
        return -this.evaluateNode(node.argument);

      case 'BINARY_OP': {
        const left = this.evaluateNode(node.left);
        const right = this.evaluateNode(node.right);
        switch (node.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return right === 0 ? 0 : Math.floor(left / right);
          case '%':
            return right === 0 ? 0 : left % right;
        }
        break;
      }

      case 'ROLL':
        return this.executeRoll(node);
    }
  }

  private rollSingle(sides: number | 'F' | '%'): number {
    if (sides === 'F') {
      // Fate dice: -1, 0, +1
      const rand = Math.floor(Math.random() * 3);
      return rand - 1; // 0 -> -1, 1 -> 0, 2 -> +1
    }
    const max = sides === '%' ? 100 : sides;
    return Math.floor(Math.random() * max) + 1;
  }

  private testComparison(val: number, comp: Comparison): boolean {
    switch (comp.operator) {
      case '>=':
        return val >= comp.value;
      case '<=':
        return val <= comp.value;
      case '>':
        return val > comp.value;
      case '<':
        return val < comp.value;
      case '=':
        return val === comp.value;
    }
  }

  private executeRoll(node: ASTRollNode): number {
    const { count, sides, modifiers } = node;
    const rolls: SingleDieResult[] = [];
    const maxSide = sides === '%' ? 100 : sides === 'F' ? 1 : sides;

    // Safety checks
    const safeCount = Math.min(100, Math.max(1, count));

    // 1. Initial rolls with reroll handling
    for (let i = 0; i < safeCount; i++) {
      let rolled = this.rollSingle(sides);

      // Handle Reroll (ro once, rr recursive)
      if (modifiers.reroll) {
        if (modifiers.reroll.recursive) {
          let rerollAttempts = 0;
          while (
            this.testComparison(rolled, modifiers.reroll.comparison) &&
            rerollAttempts < 20
          ) {
            rolls.push({ sides, rolled, rerolled: true, discarded: true });
            rolled = this.rollSingle(sides);
            rerollAttempts++;
          }
        } else if (this.testComparison(rolled, modifiers.reroll.comparison)) {
          rolls.push({ sides, rolled, rerolled: true, discarded: true });
          rolled = this.rollSingle(sides);
        }
      }

      const die: SingleDieResult = {
        sides,
        rolled,
        isCritSuccess: rolled === maxSide,
        isCritFailure: sides === 'F' ? rolled === -1 : rolled === 1,
      };

      if (die.isCritSuccess && typeof maxSide === 'number') {
        this.highCrits.push(rolled);
      }
      if (die.isCritFailure) {
        this.lowCrits.push(rolled);
      }

      rolls.push(die);

      // Handle Explode (!)
      if (modifiers.explode) {
        let currentDie = die;
        let explodeAttempts = 0;
        const explodeCondition = modifiers.explode.comparison
          ? (v: number) => this.testComparison(v, modifiers.explode!.comparison!)
          : (v: number) => v === maxSide;

        while (explodeCondition(currentDie.rolled) && explodeAttempts < 30) {
          explodeAttempts++;
          const explodedVal = this.rollSingle(sides);
          const explodedDie: SingleDieResult = {
            sides,
            rolled: explodedVal,
            exploded: true,
            isCritSuccess: explodedVal === maxSide,
          };
          rolls.push(explodedDie);
          currentDie = explodedDie;
        }
      }
    }

    // 2. Handle Keep / Drop (kh, kl, dh, dl)
    if (modifiers.keepDrop) {
      const activeRolls = rolls.filter((r) => !r.discarded);
      const sortedByValue = [...activeRolls].sort((a, b) => b.rolled - a.rolled);
      const kCount = modifiers.keepDrop.count;

      let keptRolls: SingleDieResult[] = [];
      switch (modifiers.keepDrop.type) {
        case 'kh':
          keptRolls = sortedByValue.slice(0, kCount);
          break;
        case 'kl':
          keptRolls = sortedByValue.slice(-kCount);
          break;
        case 'dh':
          keptRolls = sortedByValue.slice(kCount);
          break;
        case 'dl':
          keptRolls = sortedByValue.slice(0, -kCount);
          break;
      }

      for (const r of activeRolls) {
        if (!keptRolls.includes(r)) {
          r.discarded = true;
        }
      }
    }

    // 3. Handle Sort
    if (modifiers.sort === 'asc') {
      rolls.sort((a, b) => a.rolled - b.rolled);
    }

    // 4. Calculate Subtotals and Pools
    let subtotal = 0;
    let poolSuccesses = 0;
    let poolFailures = 0;

    for (const r of rolls) {
      if (!r.discarded) {
        subtotal += r.rolled;

        if (modifiers.critSuccess) {
          this.hasPoolEvaluation = true;
          if (this.testComparison(r.rolled, modifiers.critSuccess.comparison)) {
            poolSuccesses++;
          }
        }
        if (modifiers.critFailure) {
          this.hasPoolEvaluation = true;
          if (this.testComparison(r.rolled, modifiers.critFailure.comparison)) {
            poolFailures++;
          }
        }
      }
    }

    if (this.hasPoolEvaluation) {
      this.totalSuccesses += poolSuccesses;
      this.totalFailures += poolFailures;
    }

    const poolResult: DiePoolResult = {
      expression: `${count}d${sides}`,
      count,
      sides,
      rolls,
      subtotal,
      successes: modifiers.critSuccess ? poolSuccesses : undefined,
      failures: modifiers.critFailure ? poolFailures : undefined,
    };

    this.recordedPools.push(poolResult);

    return subtotal;
  }
}

// Convenient singleton helper for quick evaluation
export function rollDice(expression: string, options?: RollOptions): RollResult {
  const roller = new DiceRoller(options);
  return roller.roll(expression, options);
}
