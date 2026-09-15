import { z } from 'zod';
import type {
  SystemDefinition,
  Character,
  TableScene,
  VaultDocument,
  Campaign,
  AttributeDefinition,
  RollPreset,
  SkillDefinition,
  DerivedDefinition,
  ResourceDefinition,
  DiceMacro,
} from '@/types';

// ==========================================
// SYSTEM DEFINITION SCHEMAS
// ==========================================

export const AttributeDefinitionSchema: z.ZodType<AttributeDefinition, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1, 'ID do atributo é obrigatório'),
  name: z.string().min(1, 'Nome do atributo é obrigatório'),
  shortName: z.string().optional(),
  type: z.enum(['number', 'text', 'boolean', 'derived', 'ladder', 'percent']),
  category: z.string().optional(),
  defaultValue: z.union([z.number(), z.string(), z.boolean()]),
  min: z.number().optional(),
  max: z.number().optional(),
  formula: z.string().optional(),
  hookFn: z.string().optional(),
  description: z.string().optional(),
});

export const SkillDefinitionSchema: z.ZodType<SkillDefinition, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  baseAttribute: z.string().optional(),
  type: z.enum(['proficiency', 'value', 'percent']).optional(),
  description: z.string().optional(),
});

export const DerivedDefinitionSchema: z.ZodType<DerivedDefinition, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  formula: z.string().optional(),
  hookFn: z.string().optional(),
  suffix: z.string().optional(),
  description: z.string().optional(),
});

export const ResourceDefinitionSchema: z.ZodType<ResourceDefinition, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  maxFormula: z.union([z.string(), z.number()]),
  defaultValue: z.number().optional(),
  color: z.string().optional(),
  type: z.enum(['bar', 'pool', 'slots', 'checkbox']),
  description: z.string().optional(),
});

export const DiceMacroSchema: z.ZodType<DiceMacro, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  expression: z.string().min(1),
  color: z.string().optional(),
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
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().default(''),
  builtin: z.boolean().default(false),
  attributes: z.array(AttributeDefinitionSchema),
  attributeScale: z
    .array(
      z.object({
        value: z.number(),
        label: z.string(),
      })
    )
    .optional(),
  skills: z.array(SkillDefinitionSchema).optional(),
  derived: z.array(DerivedDefinitionSchema).optional(),
  resources: z.array(ResourceDefinitionSchema).optional(),
  combat: z
    .object({
      initiativeFormula: z.string(),
      hpResource: z.string(),
      defenseStat: z
        .object({
          name: z.string(),
          formula: z.string().optional(),
        })
        .optional(),
      conditions: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          color: z.string().optional(),
        })
      ),
      deathSaves: z
        .object({
          name: z.string(),
          formula: z.string(),
          success: z.number(),
          failure: z.number(),
        })
        .optional(),
    })
    .optional(),
  sections: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        order: z.number().optional(),
      })
    )
    .optional(),
  itemCategories: z.array(z.string()).optional(),
  spellFields: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['text', 'number', 'select', 'textarea']),
        options: z.array(z.string()).optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  characterFields: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['text', 'number', 'select', 'textarea']),
        options: z.array(z.string()).optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  diceMacros: z.array(DiceMacroSchema).default([]),
  rollPresets: z.array(RollPresetSchema).default([]),
  rollConvention: z.enum(['d20', 'd100', 'pool', 'ladder', 'custom']).default('d20'),
  glossary: z.record(z.string()).optional(),
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
  cost: z.string().optional(),
  equipped: z.boolean().default(false),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const AbilityItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome da habilidade é obrigatório'),
  source: z.string().optional(),
  cost: z.string().optional(),
  formula: z.string().optional(),
  usesPerRest: z.string().optional(),
  description: z.string().default(''),
});

export const CharacterSchema: z.ZodType<Character, z.ZodTypeDef, unknown> = z.object({
  id: z.string().min(1, 'ID do personagem é obrigatório'),
  systemId: z.string().min(1, 'ID do sistema é obrigatório'),
  campaignId: z.string().optional(),
  name: z.string().min(1, 'Nome do personagem é obrigatório'),
  type: z.enum(['pc', 'npc']).default('pc'),
  avatarUrl: z.string().optional(),
  bio: z.string().default(''),
  attributes: z.record(z.union([z.number(), z.string(), z.boolean()])),
  resources: z.record(z.object({ current: z.number(), max: z.number() })).optional(),
  skills: z.record(z.union([z.number(), z.boolean()])).optional(),
  inventory: z.array(InventoryItemSchema).default([]),
  spells: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        level: z.number().nonnegative(),
        school: z.string().optional(),
        castingTime: z.string().optional(),
        range: z.string().optional(),
        components: z.string().optional(),
        duration: z.string().optional(),
        formula: z.string().optional(),
        description: z.string(),
      })
    )
    .optional(),
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
  team: z.enum(['ally', 'enemy', 'neutral']).optional(),
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
  gridColor: z.string().optional(),
  gridOpacity: z.number().optional(),
  width: z.number().positive().default(2000),
  height: z.number().positive().default(2000),
  backgroundImage: z.string().optional(),
  tokens: z.array(VTTTokenSchema).default([]),
  drawings: z.array(VTTDrawingSchema).default([]),
  textLabels: z
    .array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        text: z.string(),
        color: z.string().optional(),
        fontSize: z.number().optional(),
      })
    )
    .optional(),
  fogEnabled: z.boolean().optional(),
  fogRevealed: z
    .array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
    )
    .optional(),
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
  category: z.enum(['lore', 'npc', 'location', 'item', 'rule', 'quest', 'session']),
  folder: z.string().optional(),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  frontmatter: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
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
  activeEncounterId: z.string().optional(),
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
