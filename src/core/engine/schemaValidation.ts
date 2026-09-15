import { z } from 'zod';
import type {
  SystemDefinition,
  Character,
  TableScene,
  VaultDocument,
  Campaign,
  AttributeDefinition,
  RollPreset,
} from '@/types';

// ==========================================
// SYSTEM DEFINITION SCHEMAS
// ==========================================

export const AttributeDefinitionSchema: z.ZodType<AttributeDefinition, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1, 'ID do atributo é obrigatório'),
  name: z.string().min(1, 'Nome do atributo é obrigatório'),
  type: z.enum(['number', 'text', 'boolean', 'derived']),
  category: z.string().optional(),
  defaultValue: z.union([z.number(), z.string(), z.boolean()]),
  min: z.number().optional(),
  max: z.number().optional(),
  formula: z.string().optional(),
  hookFn: z.string().optional(),
  description: z.string().optional(),
});

export const RollPresetSchema: z.ZodType<RollPreset, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1, 'ID do preset é obrigatório'),
  name: z.string().min(1, 'Nome do preset é obrigatório'),
  expression: z.string().min(1, 'Fórmula de rolagem é obrigatória'),
  description: z.string().optional(),
});

export const SystemDefinitionSchema: z.ZodType<SystemDefinition, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1, 'ID do sistema é obrigatório'),
  name: z.string().min(1, 'Nome do sistema é obrigatório'),
  version: z.string().default('1.0.0'),
  author: z.string().default('ARCANA Master'),
  description: z.string().default(''),
  attributes: z.array(AttributeDefinitionSchema),
  rollPresets: z.array(RollPresetSchema).default([]),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});

// ==========================================
// CHARACTER SCHEMAS
// ==========================================

export const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome do item é obrigatório'),
  quantity: z.number().nonnegative().default(1),
  weight: z.number().nonnegative().default(0),
  equipped: z.boolean().default(false),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const AbilityItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome da habilidade é obrigatório'),
  cost: z.string().optional(),
  formula: z.string().optional(),
  description: z.string().default(''),
});

export const CharacterSchema: z.ZodType<Character, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1, 'ID do personagem é obrigatório'),
  systemId: z.string().min(1, 'ID do sistema é obrigatório'),
  campaignId: z.string().optional(),
  name: z.string().min(1, 'Nome do personagem é obrigatório'),
  avatarUrl: z.string().optional(),
  bio: z.string().default(''),
  attributes: z.record(z.union([z.number(), z.string(), z.boolean()])),
  inventory: z.array(InventoryItemSchema).default([]),
  abilities: z.array(AbilityItemSchema).default([]),
  notes: z.string().default(''),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});

// ==========================================
// VTT / MESA SCHEMAS
// ==========================================

export const VTTTokenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  characterId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  size: z.number().positive().default(1),
  color: z.string().default('#8b5cf6'),
  imageUrl: z.string().optional(),
  hp: z
    .object({
      current: z.number(),
      max: z.number(),
    })
    .optional(),
  conditions: z.array(z.string()).default([]),
  isLocked: z.boolean().optional(),
});

export const VTTDrawingSchema = z.object({
  id: z.string().min(1),
  color: z.string(),
  width: z.number().positive(),
  points: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
    })
  ),
});

export const TableSceneSchema: z.ZodType<TableScene, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1),
  campaignId: z.string().optional(),
  name: z.string().min(1, 'Nome da cena é obrigatório'),
  gridType: z.enum(['square', 'hex', 'none']).default('square'),
  gridSize: z.number().positive().default(50),
  width: z.number().positive().default(2000),
  height: z.number().positive().default(2000),
  backgroundImage: z.string().optional(),
  tokens: z.array(VTTTokenSchema).default([]),
  drawings: z.array(VTTDrawingSchema).default([]),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});

// ==========================================
// VAULT DOCUMENT SCHEMAS
// ==========================================

export const VaultDocumentSchema: z.ZodType<VaultDocument, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1),
  campaignId: z.string().optional(),
  title: z.string().min(1, 'Título do documento é obrigatório'),
  category: z.enum(['lore', 'npc', 'location', 'item', 'rule', 'quest']),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});

// ==========================================
// CAMPAIGN SCHEMA
// ==========================================

export const CampaignSchema: z.ZodType<Campaign, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome da campanha é obrigatório'),
  systemId: z.string().min(1, 'Sistema de RPG associado é obrigatório'),
  description: z.string().default(''),
  coverUrl: z.string().optional(),
  activeSceneId: z.string().optional(),
  characterIds: z.array(z.string()).default([]),
  documentIds: z.array(z.string()).default([]),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});

// ==========================================
// SAFE PARSING VALIDATION HELPERS
// ==========================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validateSystemDefinition(data: unknown): ValidationResult<SystemDefinition> {
  const result = SystemDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(
    (err) => `${err.path.join('.') || 'Root'}: ${err.message}`
  );
  return { success: false, errors };
}

export function validateCharacter(data: unknown): ValidationResult<Character> {
  const result = CharacterSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(
    (err) => `${err.path.join('.') || 'Root'}: ${err.message}`
  );
  return { success: false, errors };
}

export function validateJSONString<T>(
  jsonStr: string,
  validator: (data: unknown) => ValidationResult<T>
): ValidationResult<T> {
  try {
    const parsed: unknown = JSON.parse(jsonStr);
    return validator(parsed);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Sintaxe JSON inválida';
    return { success: false, errors: [`JSON Parse Error: ${errorMsg}`] };
  }
}
