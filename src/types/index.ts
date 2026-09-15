// ARCANA RPG Suite — Central Type Definitions
// Strict TypeScript — Zero 'any' policy
// Adheres strictly to the ARCANA Bible specification

export type ThemeId = 'arcana-dark' | 'parchment' | 'cyberpunk' | 'starlight';

export type PillarId = 'characters' | 'vtt' | 'vault' | 'campaigns' | 'system-builder';

// ==========================================
// SYSTEM DEFINITION & FORMULA ENGINE
// ==========================================

export type AttributeDataType = 'number' | 'text' | 'boolean' | 'derived' | 'ladder' | 'percent';

export interface LadderTerm {
  value: number;
  label: string;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  shortName?: string;
  type: AttributeDataType;
  category?: string;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  formula?: string; // Standard arithmetic expression, e.g.: "floor((strength - 10) / 2)"
  hookFn?: string;  // Pure JS sandbox code, e.g.: "return Math.floor((attr.strength - 10) / 2);"
  description?: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  baseAttribute?: string;
  type?: 'proficiency' | 'value' | 'percent';
  description?: string;
}

export interface DerivedDefinition {
  id: string;
  name: string;
  formula?: string;
  hookFn?: string;
  suffix?: string;
  description?: string;
}

export type ResourceType = 'bar' | 'pool' | 'slots' | 'checkbox';

export interface ResourceDefinition {
  id: string;
  name: string;
  maxFormula: string | number;
  defaultValue?: number;
  color?: string;
  type: ResourceType;
  description?: string;
}

export interface ConditionDefinition {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface CombatConfig {
  initiativeFormula: string;
  hpResource: string;
  defenseStat?: {
    name: string;
    formula?: string;
  };
  conditions: ConditionDefinition[];
  deathSaves?: {
    name: string;
    formula: string;
    success: number;
    failure: number;
  };
}

export interface SectionDefinition {
  id: string;
  name: string;
  type: string;
  order?: number;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  description?: string;
}

export interface DiceMacro {
  id: string;
  name: string;
  expression: string;
  color?: string;
  description?: string;
}

export interface RollPreset {
  id: string;
  name: string;
  expression: string; // e.g. "1d20 + $modFor"
  description?: string;
}

export type RollConvention = 'd20' | 'd100' | 'pool' | 'ladder' | 'custom';

export interface SystemDefinition {
  id: string;
  name: string;
  version: string;
  author: string;
  icon?: string;
  color?: string;
  description: string;
  builtin: boolean;

  attributes: AttributeDefinition[];
  attributeScale?: LadderTerm[];

  skills?: SkillDefinition[];
  derived?: DerivedDefinition[];
  resources?: ResourceDefinition[];

  combat?: CombatConfig;
  sections?: SectionDefinition[];
  itemCategories?: string[];
  spellFields?: CustomFieldDefinition[];
  characterFields?: CustomFieldDefinition[];

  diceMacros: DiceMacro[];
  rollPresets: RollPreset[];
  rollConvention: RollConvention;
  glossary?: Record<string, string>;

  createdAt: number;
  updatedAt: number;
}

// ==========================================
// CHARACTER PILLAR
// ==========================================

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  cost?: string;
  equipped: boolean;
  category?: string;
  description?: string;
  tags?: string[];
}

export interface SpellItem {
  id: string;
  name: string;
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  formula?: string;
  description: string;
}

export interface AbilityItem {
  id: string;
  name: string;
  source?: string;
  cost?: string;
  formula?: string;
  usesPerRest?: string;
  description: string;
}

export type AttributeValue = number | string | boolean;

export interface Character {
  id: string;
  systemId: string;
  campaignId?: string;
  name: string;
  type: 'pc' | 'npc';
  avatarUrl?: string;
  bio: string;
  attributes: Record<string, AttributeValue>;
  resources?: Record<string, { current: number; max: number }>;
  skills?: Record<string, number | boolean>;
  inventory: InventoryItem[];
  spells?: SpellItem[];
  abilities: AbilityItem[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// VTT (MESA) PILLAR
// ==========================================

export type GridType = 'square' | 'hex' | 'none';

export interface VTTToken {
  id: string;
  name: string;
  characterId?: string;
  x: number;
  y: number;
  size: number; // in grid cells
  color: string;
  imageUrl?: string;
  team?: 'ally' | 'enemy' | 'neutral';
  hp?: {
    current: number;
    max: number;
  };
  conditions: string[];
  isLocked?: boolean;
}

export interface VTTDrawingPoint {
  x: number;
  y: number;
}

export interface VTTDrawing {
  id: string;
  color: string;
  width: number;
  points: VTTDrawingPoint[];
}

export interface TableScene {
  id: string;
  campaignId?: string;
  name: string;
  gridType: GridType;
  gridSize: number; // pixels per unit
  gridColor?: string;
  gridOpacity?: number;
  width: number;    // scene width in pixels
  height: number;   // scene height in pixels
  backgroundImage?: string;
  tokens: VTTToken[];
  drawings: VTTDrawing[];
  createdAt: number;
  updatedAt: number;
}

export interface EncounterCombatant {
  id: string;
  tokenId?: string;
  characterId?: string;
  name: string;
  initiative: number;
  hpCurrent: number;
  hpMax: number;
  conditions: string[];
  isNpc: boolean;
  notes?: string;
}

export interface Encounter {
  id: string;
  campaignId?: string;
  name: string;
  round: number;
  currentTurnIndex: number;
  combatants: EncounterCombatant[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// VAULT (KNOWLEDGE / COMPENDIUM) PILLAR
// ==========================================

export type VaultCategory = 'lore' | 'npc' | 'location' | 'item' | 'rule' | 'quest' | 'session';

export interface VaultDocument {
  id: string;
  campaignId?: string;
  title: string;
  category: VaultCategory;
  folder?: string;
  content: string; // Markdown / plain text
  tags: string[];
  links: string[]; // List of referenced document IDs
  frontmatter?: Record<string, string | number | boolean>;
  createdAt: number;
  updatedAt: number;
}

export interface VaultGraphNode {
  id: string;
  title: string;
  category: VaultCategory;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

export interface VaultGraphEdge {
  source: string;
  target: string;
}

// ==========================================
// CAMPAIGN PILLAR & SESSIONS
// ==========================================

export interface SessionLog {
  id: string;
  campaignId: string;
  sessionNumber: number;
  date: string;
  title: string;
  summary: string;
  attendees: string[];
  xpGranted?: number;
  loot?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  systemId: string;
  description: string;
  coverUrl?: string;
  activeSceneId?: string;
  activeEncounterId?: string;
  characterIds: string[];
  documentIds: string[];
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// DICE ROLLS HISTORY
// ==========================================

export interface RollRecord {
  id: string;
  campaignId?: string;
  characterId?: string;
  characterName?: string;
  expression: string;
  total: number;
  detail: string;
  label?: string;
  createdAt: number;
}

// ==========================================
// CORE APP STATE & UI
// ==========================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export interface FormulaHookContext {
  attributes: Record<string, AttributeValue>;
  math: Math;
}

export interface FormulaCalculationResult {
  value: AttributeValue;
  error?: string;
}
