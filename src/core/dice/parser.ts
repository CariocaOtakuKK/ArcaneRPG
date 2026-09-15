// ARCANA Dice Engine — Recursive Descent Parser
// Handwritten, zero dependencies, lightweight & safe

import type {
  Comparison,
  ComparisonOperator,
  DieModifiers,
  KeepDropModifier,
} from './types';

export type ASTNodeType =
  | 'BINARY_OP'
  | 'UNARY_OP'
  | 'NUMBER'
  | 'VARIABLE'
  | 'ROLL';

export interface ASTBinaryOpNode {
  type: 'BINARY_OP';
  operator: '+' | '-' | '*' | '/' | '%';
  left: ASTNode;
  right: ASTNode;
}

export interface ASTUnaryOpNode {
  type: 'UNARY_OP';
  operator: '-';
  argument: ASTNode;
}

export interface ASTNumberNode {
  type: 'NUMBER';
  value: number;
}

export interface ASTVariableNode {
  type: 'VARIABLE';
  name: string;
}

export interface ASTRollNode {
  type: 'ROLL';
  rawExpression: string;
  count: number;
  sides: number | 'F' | '%';
  modifiers: DieModifiers;
}

export type ASTNode =
  | ASTBinaryOpNode
  | ASTUnaryOpNode
  | ASTNumberNode
  | ASTVariableNode
  | ASTRollNode;

export class DiceParser {
  private input: string;
  private pos = 0;

  constructor(input: string) {
    this.input = input.trim();
  }

  private peek(): string {
    return this.input.charAt(this.pos);
  }

  private next(): string {
    return this.input.charAt(this.pos++);
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.peek())) {
      this.pos++;
    }
  }

  public parse(): ASTNode {
    this.pos = 0;
    const node = this.parseExpression();
    this.skipWhitespace();
    if (this.pos < this.input.length) {
      throw new Error(
        `Caractere inesperado '${this.peek()}' na posição ${this.pos} na expressão: "${this.input}"`
      );
    }
    return node;
  }

  // expression := term (('+' | '-') term)*
  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    this.skipWhitespace();

    while (this.pos < this.input.length) {
      const ch = this.peek();
      if (ch === '+' || ch === '-') {
        this.next();
        const right = this.parseTerm();
        left = {
          type: 'BINARY_OP',
          operator: ch,
          left,
          right,
        };
        this.skipWhitespace();
      } else {
        break;
      }
    }

    return left;
  }

  // term := factor (('*' | '/' | '%') factor)*
  private parseTerm(): ASTNode {
    let left = this.parseFactor();
    this.skipWhitespace();

    while (this.pos < this.input.length) {
      const ch = this.peek();
      if (ch === '*' || ch === '/' || ch === '%') {
        this.next();
        const right = this.parseFactor();
        left = {
          type: 'BINARY_OP',
          operator: ch as '*' | '/' | '%',
          left,
          right,
        };
        this.skipWhitespace();
      } else {
        break;
      }
    }

    return left;
  }

  // factor := '-' factor | '(' expression ')' | roll | number | variable
  private parseFactor(): ASTNode {
    this.skipWhitespace();
    const ch = this.peek();

    if (ch === '-') {
      this.next();
      const arg = this.parseFactor();
      return {
        type: 'UNARY_OP',
        operator: '-',
        argument: arg,
      };
    }

    if (ch === '(') {
      this.next(); // skip '('
      const expr = this.parseExpression();
      this.skipWhitespace();
      if (this.peek() !== ')') {
        throw new Error("Esperado ')' para fechar expressão");
      }
      this.next(); // skip ')'
      return expr;
    }

    if (ch === '$') {
      return this.parseVariable();
    }

    // Check if it's a roll starting with 'd' (e.g. "d20", "d6")
    if (ch === 'd' || ch === 'D') {
      return this.parseRoll(1);
    }

    // Number or roll with count (e.g. "2d6", "1d20", or plain "5")
    if (/[0-9]/.test(ch)) {
      const num = this.parseNumber();

      this.skipWhitespace();
      if (this.peek() === 'd' || this.peek() === 'D') {
        return this.parseRoll(num);
      }

      return {
        type: 'NUMBER',
        value: num,
      };
    }

    throw new Error(
      `Símbolo inesperado '${ch}' na posição ${this.pos} ao analisar fator.`
    );
  }

  private parseVariable(): ASTVariableNode {
    this.next(); // skip '$'
    const start = this.pos;
    while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.peek())) {
      this.pos++;
    }
    const name = this.input.substring(start, this.pos);
    if (!name) {
      throw new Error('Nome de variável vazio após $');
    }
    return {
      type: 'VARIABLE',
      name,
    };
  }

  private parseNumber(): number {
    const start = this.pos;
    while (this.pos < this.input.length && /[0-9]/.test(this.peek())) {
      this.pos++;
    }
    return parseInt(this.input.substring(start, this.pos), 10);
  }

  // roll := [count] 'd' sides [modifiers]
  private parseRoll(count: number): ASTRollNode {
    this.next(); // skip 'd' or 'D'

    // Parse sides: number | 'F' | '%'
    let sides: number | 'F' | '%';
    const sideCh = this.peek();

    if (sideCh === 'F' || sideCh === 'f') {
      this.next();
      sides = 'F';
    } else if (sideCh === '%') {
      this.next();
      sides = '%';
    } else if (/[0-9]/.test(sideCh)) {
      sides = this.parseNumber();
    } else {
      throw new Error(`Faces do dado inválidas na posição ${this.pos}`);
    }

    const modifiers: DieModifiers = {};

    // Parse combinable modifiers: kh, kl, dh, dl, !, cs, cf, ro, rr, s
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      const lookahead2 = this.input.substring(this.pos, this.pos + 2).toLowerCase();
      const lookahead1 = this.peek().toLowerCase();

      // Keep / Drop: kh, kl, dh, dl
      if (['kh', 'kl', 'dh', 'dl'].includes(lookahead2)) {
        this.pos += 2;
        this.skipWhitespace();
        const modCount = /[0-9]/.test(this.peek()) ? this.parseNumber() : 1;
        modifiers.keepDrop = {
          type: lookahead2 as KeepDropModifier['type'],
          count: modCount,
        };
        continue;
      }

      // Explode: ! or ![comp]
      if (lookahead1 === '!') {
        this.next();
        let comp: Comparison | undefined;
        if (this.isComparisonStart()) {
          comp = this.parseComparison();
        }
        modifiers.explode = { comparison: comp };
        continue;
      }

      // Crit success / failure count (Pools): cs>=8, cf<=1
      if (lookahead2 === 'cs' || lookahead2 === 'cf') {
        this.pos += 2;
        this.skipWhitespace();
        const comp = this.parseComparison();
        if (lookahead2 === 'cs') {
          modifiers.critSuccess = { type: 'cs', comparison: comp };
        } else {
          modifiers.critFailure = { type: 'cf', comparison: comp };
        }
        continue;
      }

      // Reroll: ro (once), rr (recursive)
      if (lookahead2 === 'ro' || lookahead2 === 'rr') {
        this.pos += 2;
        this.skipWhitespace();
        const comp = this.parseComparison();
        modifiers.reroll = {
          recursive: lookahead2 === 'rr',
          comparison: comp,
        };
        continue;
      }

      // Sort modifier: s
      if (lookahead1 === 's' && !/[a-zA-Z]/.test(this.input.charAt(this.pos + 1))) {
        this.next();
        modifiers.sort = 'asc';
        continue;
      }

      break;
    }

    return {
      type: 'ROLL',
      rawExpression: `${count}d${sides}`,
      count,
      sides,
      modifiers,
    };
  }

  private isComparisonStart(): boolean {
    const ch = this.peek();
    return ch === '>' || ch === '<' || ch === '=';
  }

  private parseComparison(): Comparison {
    this.skipWhitespace();
    let op: ComparisonOperator = '=';

    if (this.input.startsWith('>=', this.pos)) {
      op = '>=';
      this.pos += 2;
    } else if (this.input.startsWith('<=', this.pos)) {
      op = '<=';
      this.pos += 2;
    } else if (this.peek() === '>') {
      op = '>';
      this.next();
    } else if (this.peek() === '<') {
      op = '<';
      this.next();
    } else if (this.peek() === '=') {
      op = '=';
      this.next();
    } else {
      // Default comparison if operator omitted
      op = '>=';
    }

    this.skipWhitespace();
    const value = this.parseNumber();
    return { operator: op, value };
  }
}
