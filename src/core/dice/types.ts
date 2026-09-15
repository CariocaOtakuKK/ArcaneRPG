// ARCANA Dice Engine Types — Strict TypeScript (Zero any)

export type ComparisonOperator = '>=' | '<=' | '>' | '<' | '=';

export interface Comparison {
  operator: ComparisonOperator;
  value: number;
}

export interface KeepDropModifier {
  type: 'kh' | 'kl' | 'dh' | 'dl';
  count: number;
}

export interface ExplodeModifier {
  comparison?: Comparison;
}

export interface CritModifier {
  type: 'cs' | 'cf'; // count successes (cs) or count failures (cf)
  comparison: Comparison;
}

export interface RerollModifier {
  recursive: boolean; // ro (once) vs rr (recursive)
  comparison: Comparison;
}

export interface DieModifiers {
  keepDrop?: KeepDropModifier;
  explode?: ExplodeModifier;
  critSuccess?: CritModifier;
  critFailure?: CritModifier;
  reroll?: RerollModifier;
  sort?: 'asc' | 'desc';
}

export interface SingleDieResult {
  sides: number | 'F' | '%';
  rolled: number; // Value on die (-1, 0, 1 for Fate; 1..sides for standard)
  discarded?: boolean;
  exploded?: boolean;
  rerolled?: boolean;
  isCritSuccess?: boolean;
  isCritFailure?: boolean;
}

export interface DiePoolResult {
  expression: string;
  count: number;
  sides: number | 'F' | '%';
  rolls: SingleDieResult[];
  subtotal: number;
  successes?: number;
  failures?: number;
}

export interface RollResult {
  id: string;
  expression: string;
  total: number;
  dice: DiePoolResult[];
  variablesUsed?: Record<string, number>;
  crits: {
    high: number[];
    low: number[];
  };
  successes?: number;
  failures?: number;
  label?: string;
  systemId?: string;
  characterId?: string;
  createdAt: number;
  isPublic?: boolean;
}
