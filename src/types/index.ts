// ARCANA RPG Suite — Central Type Definitions
// Strict TypeScript — Zero 'any' policy

export type ThemeId = 'arcana-dark' | 'parchment' | 'cyberpunk' | 'starlight';

export type PillarId = 'characters' | 'vtt' | 'vault' | 'campaigns' | 'system-builder';

// ==========================================
// SYSTEM DEFINITION & FORMULA ENGINE
// ==========================================

export type AttributeDataType = 'number' | 'text' | 'boolean' | 'derived';

export interface AttributeDefinition {
  id: string;
  name: string;
  type: AttributeDataType;
  category?: string;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  formula?: string; // Standard arithmetic expression, e.g.: "floor((strength - 10) / 2)"
  hookFn?: string;  // Pure JS sandbox code, e.g.: "return Math.floor((attr.strength - 10) / 2);"
  description?: string;
}

export interface RollPreset {
  id: string;
  name: string;
  expression: string; // e.g. "1d20 + @attributes.strength_mod"
  description?: string;
}

export interface SystemDefinition {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  attributes: AttributeDefinition[];
  rollPresets: RollPreset[];
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
  equipped: boolean;
  description?: string;
  tags?: string[];
}

export interface AbilityItem {
  id: string;
  name: string;
  cost?: string;
  formula?: string;
  description: string;
}

export type AttributeValue = number | string | boolean;

export interface Character {
  id: string;
  systemId: string;
  campaignId?: string;
  name: string;
  avatarUrl?: string;
  bio: string;
  attributes: Record<string, AttributeValue>;
  inventory: InventoryItem[];
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
  width: number;    // scene width in pixels
  height: number;   // scene height in pixels
  backgroundImage?: string;
  tokens: VTTToken[];
  drawings: VTTDrawing[];
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// VAULT (KNOWLEDGE / COMPENDIUM) PILLAR
// ==========================================

export type VaultCategory = 'lore' | 'npc' | 'location' | 'item' | 'rule' | 'quest';

export interface VaultDocument {
  id: string;
  campaignId?: string;
  title: string;
  category: VaultCategory;
  content: string; // Markdown / plain text
  tags: string[];
  links: string[]; // List of referenced document IDs
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
// CAMPAIGN PILLAR
// ==========================================

export interface Campaign {
  id: string;
  name: string;
  systemId: string;
  description: string;
  coverUrl?: string;
  activeSceneId?: string;
  characterIds: string[];
  documentIds: string[];
  createdAt: number;
  updatedAt: number;
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
