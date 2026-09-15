import Dexie, { type Table } from 'dexie';
import type {
  SystemDefinition,
  Character,
  TableScene,
  VaultDocument,
  Campaign,
  Encounter,
  SessionLog,
  RollRecord,
} from '@/types';
import { OFFICIAL_PRESETS } from '@/systems/registry';
import { dnd5eSystem } from '@/systems/presets/dnd5e';

export class ArcanaDatabase extends Dexie {
  systems!: Table<SystemDefinition, string>;
  characters!: Table<Character, string>;
  scenes!: Table<TableScene, string>;
  vault!: Table<VaultDocument, string>;
  campaigns!: Table<Campaign, string>;
  encounters!: Table<Encounter, string>;
  sessions!: Table<SessionLog, string>;
  rolls!: Table<RollRecord, string>;

  constructor() {
    super('ArcanaRPG_DB');

    this.version(2).stores({
      systems: 'id, name, builtin, updatedAt',
      characters: 'id, systemId, campaignId, name, type, updatedAt',
      scenes: 'id, campaignId, name, updatedAt',
      vault: 'id, campaignId, category, folder, *tags, title, updatedAt',
      campaigns: 'id, systemId, name, updatedAt',
      encounters: 'id, campaignId, name, updatedAt',
      sessions: 'id, campaignId, date, updatedAt',
      rolls: 'id, campaignId, createdAt',
    });
  }
}

export const db = new ArcanaDatabase();

export const DEFAULT_CHARACTER: Character = {
  id: 'char-elyon',
  systemId: 'dnd5e',
  campaignId: 'camp-default',
  name: 'Elyon, o Mago Evocador',
  type: 'pc',
  avatarUrl: '',
  bio: 'Um estudioso dedicado aos mistérios do Éter e da magia planar.',
  attributes: {
    level: 3,
    str: 10,
    dex: 14,
    con: 12,
    int: 18,
    wis: 13,
    cha: 11,
    mod_str: 0,
    mod_dex: 2,
    mod_con: 1,
    mod_int: 4,
    mod_wis: 1,
    mod_cha: 0,
    proficiency_bonus: 2,
    armor_class: 12,
    speed: 9,
  },
  resources: {
    hp: { current: 22, max: 22 },
    inspiration: { current: 1, max: 1 },
  },
  inventory: [
    {
      id: 'item-1',
      name: 'Grimório de Feitiços',
      quantity: 1,
      weight: 3,
      equipped: true,
      category: 'Equipamento Geral',
      description: 'Capa de couro com runas douradas gravadas.',
      tags: ['Mágico', 'Foco'],
    },
    {
      id: 'item-2',
      name: 'Adaga de Prata',
      quantity: 1,
      weight: 1,
      equipped: true,
      category: 'Arma',
      description: '1d4 dano perfurante.',
      tags: ['Arma', 'Leve'],
    },
  ],
  abilities: [
    {
      id: 'skill-1',
      name: 'Raio de Fogo',
      cost: 'Truque',
      formula: '1d10',
      description: 'Dispara um feixe ardente contra o alvo a até 36 metros.',
    },
    {
      id: 'skill-2',
      name: 'Míssil Mágico',
      cost: 'Espaço Nível 1',
      formula: '3d4+3',
      description: 'Dardos de força luminosa teleguiados infalíveis.',
    },
  ],
  notes: 'Em busca do tomo ancestral escondido nas Criptas de Aethelgard.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const DEFAULT_SCENE: TableScene = {
  id: 'scene-crypt',
  campaignId: 'camp-default',
  name: 'Cripta de Aethelgard',
  gridType: 'square',
  gridSize: 48,
  width: 1440,
  height: 960,
  tokens: [
    {
      id: 'tok-elyon',
      characterId: 'char-elyon',
      name: 'Elyon',
      x: 192,
      y: 288,
      size: 1,
      color: '#8b5cf6',
      team: 'ally',
      hp: { current: 22, max: 22 },
      conditions: ['Inspirado'],
      isLocked: false,
    },
    {
      id: 'tok-skeleton-1',
      name: 'Esqueleto Guerreiro',
      x: 480,
      y: 288,
      size: 1,
      color: '#ef4444',
      team: 'enemy',
      hp: { current: 13, max: 13 },
      conditions: [],
      isLocked: false,
    },
  ],
  drawings: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const DEFAULT_VAULT_DOCS: VaultDocument[] = [
  {
    id: 'vault-lore-1',
    campaignId: 'camp-default',
    title: 'O Cataclismo de Aethelgard',
    category: 'lore',
    content: `# O Cataclismo de Aethelgard\n\nHá seis séculos, o império flutuante de Aethelgard ruiu quando o Núcleo Etéreo sofreu sobrecarga. Seus estilhaços caíram sobre os vales, gerando distorções de mana e despertando guardiões ancestrais.`,
    tags: ['História', 'Aethelgard', 'Origem'],
    links: ['vault-loc-1'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vault-loc-1',
    campaignId: 'camp-default',
    title: 'Catacumbas do Norte',
    category: 'location',
    content: `# Catacumbas do Norte\n\nConstruídas sobre as ruínas de uma fortaleza imperial. Diz a lenda que abrigam um fragmento intacto do Cristal de Éter, guardado por mortos-vivos jurados à antiga dinastia.`,
    tags: ['Masmorra', 'Perigo'],
    links: ['vault-lore-1'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const DEFAULT_CAMPAIGN: Campaign = {
  id: 'camp-default',
  name: 'Crônicas de Aethelgard',
  systemId: 'dnd5e',
  description: 'Uma expedição arqueológica e arcana através das profundezas das ruínas esquecidas.',
  activeSceneId: 'scene-crypt',
  characterIds: ['char-elyon'],
  documentIds: ['vault-lore-1', 'vault-loc-1'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function initializeDatabase(): Promise<void> {
  // Check if system definitions exist; populate official presets if empty
  const systemCount = await db.systems.count();
  if (systemCount === 0) {
    await db.systems.bulkAdd(OFFICIAL_PRESETS);
  } else {
    // Ensure all built-in official presets are present or updated
    for (const preset of OFFICIAL_PRESETS) {
      const existing = await db.systems.get(preset.id);
      if (!existing) {
        await db.systems.put(preset);
      }
    }
  }

  // Populate default campaign, character, scene and vault notes
  const charCount = await db.characters.count();
  if (charCount === 0) {
    await db.characters.add(DEFAULT_CHARACTER);
  }

  const sceneCount = await db.scenes.count();
  if (sceneCount === 0) {
    await db.scenes.add(DEFAULT_SCENE);
  }

  const vaultCount = await db.vault.count();
  if (vaultCount === 0) {
    await db.vault.bulkAdd(DEFAULT_VAULT_DOCS);
  }

  const campCount = await db.campaigns.count();
  if (campCount === 0) {
    await db.campaigns.add(DEFAULT_CAMPAIGN);
  }
}

export const DEFAULT_SYSTEM: SystemDefinition = dnd5eSystem;
