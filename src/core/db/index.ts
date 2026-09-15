import Dexie, { type Table } from 'dexie';
import type {
  SystemDefinition,
  Character,
  TableScene,
  VaultDocument,
  Campaign,
} from '@/types';

export class ArcanaDatabase extends Dexie {
  systems!: Table<SystemDefinition, string>;
  characters!: Table<Character, string>;
  scenes!: Table<TableScene, string>;
  vault!: Table<VaultDocument, string>;
  campaigns!: Table<Campaign, string>;

  constructor() {
    super('ArcanaRPG_DB');

    this.version(1).stores({
      systems: 'id, name, updatedAt',
      characters: 'id, systemId, campaignId, name, updatedAt',
      scenes: 'id, campaignId, name, updatedAt',
      vault: 'id, campaignId, category, title, updatedAt',
      campaigns: 'id, systemId, name, updatedAt',
    });
  }
}

export const db = new ArcanaDatabase();

// Default starter system definition showing both arithmetic formulas and functional hooks
export const DEFAULT_SYSTEM: SystemDefinition = {
  id: 'd20-arcana',
  name: 'Arcana D20 Core',
  version: '1.0.0',
  author: 'ARCANA Architecture',
  description: 'Sistema D20 adaptativo com atributos canônicos e ganchos funcionais.',
  attributes: [
    {
      id: 'level',
      name: 'Nível',
      type: 'number',
      category: 'Geral',
      defaultValue: 1,
      min: 1,
      max: 20,
      description: 'Nível de personagem.',
    },
    {
      id: 'strength',
      name: 'Força',
      type: 'number',
      category: 'Atributos Base',
      defaultValue: 10,
      min: 1,
      max: 30,
      description: 'Poder físico e capacidade atlética.',
    },
    {
      id: 'dexterity',
      name: 'Destreza',
      type: 'number',
      category: 'Atributos Base',
      defaultValue: 10,
      min: 1,
      max: 30,
      description: 'Agilidade, reflexos e equilíbrio.',
    },
    {
      id: 'constitution',
      name: 'Constituição',
      type: 'number',
      category: 'Atributos Base',
      defaultValue: 10,
      min: 1,
      max: 30,
      description: 'Saúde, vigor e resistência física.',
    },
    {
      id: 'intelligence',
      name: 'Inteligência',
      type: 'number',
      category: 'Atributos Base',
      defaultValue: 10,
      min: 1,
      max: 30,
      description: 'Acuidade mental, memória e raciocínio.',
    },
    {
      id: 'wisdom',
      name: 'Sabedoria',
      type: 'number',
      category: 'Atributos Base',
      defaultValue: 10,
      min: 1,
      max: 30,
      description: 'Percepção, intuição e sintonia.',
    },
    {
      id: 'charisma',
      name: 'Carisma',
      type: 'number',
      category: 'Atributos Base',
      defaultValue: 10,
      min: 1,
      max: 30,
      description: 'Força de personalidade e persuasão.',
    },
    // Derived attribute via arithmetic formula
    {
      id: 'strength_mod',
      name: 'Modificador de Força',
      type: 'derived',
      category: 'Modificadores',
      defaultValue: 0,
      formula: 'floor((strength - 10) / 2)',
      description: 'Calculado aritmeticamente: floor((Força - 10) / 2).',
    },
    {
      id: 'dexterity_mod',
      name: 'Modificador de Destreza',
      type: 'derived',
      category: 'Modificadores',
      defaultValue: 0,
      formula: 'floor((dexterity - 10) / 2)',
      description: 'Calculado aritmeticamente: floor((Destreza - 10) / 2).',
    },
    {
      id: 'constitution_mod',
      name: 'Modificador de Constituição',
      type: 'derived',
      category: 'Modificadores',
      defaultValue: 0,
      formula: 'floor((constitution - 10) / 2)',
      description: 'Calculado aritmeticamente: floor((Constituição - 10) / 2).',
    },
    // Derived attribute via functional JS hook (demonstrating non-linear progression hook)
    {
      id: 'proficiency_bonus',
      name: 'Bônus de Proficiência',
      type: 'derived',
      category: 'Geral',
      defaultValue: 2,
      hookFn: `// Exemplo de Hook não-linear para progressão de proficiência por nível
const lvl = Number(attr.level) || 1;
if (lvl >= 17) return 6;
if (lvl >= 13) return 5;
if (lvl >= 9) return 4;
if (lvl >= 5) return 3;
return 2;`,
      description: 'Calculado via Hook funcional de progressão escalonada.',
    },
    {
      id: 'armor_class',
      name: 'Classe de Armadura (CA)',
      type: 'derived',
      category: 'Combate',
      defaultValue: 10,
      formula: '10 + dexterity_mod',
      description: 'Defesa baseada em 10 + Modificador de Destreza.',
    },
    {
      id: 'hp_max',
      name: 'Pontos de Vida Máximos',
      type: 'derived',
      category: 'Combate',
      defaultValue: 10,
      hookFn: `// Hook: Cálculo de vida considerando dado de vida d10 no nível 1 + mod constituição
const lvl = Number(attr.level) || 1;
const conMod = Number(attr.constitution_mod) || 0;
return Math.max(1, 10 + conMod + (lvl - 1) * (6 + conMod));`,
      description: 'Calculado via Hook dinâmico de PVs máximos.',
    },
    {
      id: 'hp_current',
      name: 'Pontos de Vida Atuais',
      type: 'number',
      category: 'Combate',
      defaultValue: 10,
      min: 0,
      description: 'Vida atual do personagem.',
    },
  ],
  rollPresets: [
    {
      id: 'attack_melee',
      name: 'Ataque Corpo a Corpo',
      expression: '1d20 + @attributes.strength_mod + @attributes.proficiency_bonus',
      description: 'Ataque padrão usando modificador de força e proficiência.',
    },
    {
      id: 'initiative',
      name: 'Iniciativa',
      expression: '1d20 + @attributes.dexterity_mod',
      description: 'Teste de rapidez no início do combate.',
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const DEFAULT_CHARACTER: Character = {
  id: 'char-elyon',
  systemId: 'd20-arcana',
  campaignId: 'camp-default',
  name: 'Elyon, o Arcanista Cinzento',
  avatarUrl: '',
  bio: 'Um sábio andarilho dedicado a decifrar as antigas runas dos Reinos Astrais.',
  attributes: {
    level: 3,
    strength: 10,
    dexterity: 14,
    constitution: 12,
    intelligence: 18,
    wisdom: 13,
    charisma: 11,
    strength_mod: 0,
    dexterity_mod: 2,
    constitution_mod: 1,
    proficiency_bonus: 2,
    armor_class: 12,
    hp_max: 24,
    hp_current: 24,
  },
  inventory: [
    {
      id: 'item-1',
      name: 'Grimório de Éter',
      quantity: 1,
      weight: 3,
      equipped: true,
      description: 'Páginas gravadas com tinta fluorescente arcana.',
      tags: ['Mágico', 'Foco'],
    },
    {
      id: 'item-2',
      name: 'Adaga de Prata Lunar',
      quantity: 1,
      weight: 1,
      equipped: true,
      description: '1d4 dano perfurante.',
      tags: ['Arma', 'Leve'],
    },
    {
      id: 'item-3',
      name: 'Poção de Cura Menor',
      quantity: 3,
      weight: 0.5,
      equipped: false,
      description: 'Restaura 2d4+2 pontos de vida.',
      tags: ['Consumível'],
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
  notes: 'Procura fragmentos do Selo de Aethelgard nas catacumbas do Norte.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const DEFAULT_SCENE: TableScene = {
  id: 'scene-crypt',
  campaignId: 'camp-default',
  name: 'Cripta das Sombras Esquecidas',
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
      hp: { current: 24, max: 24 },
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
      hp: { current: 13, max: 13 },
      conditions: [],
      isLocked: false,
    },
    {
      id: 'tok-skeleton-2',
      name: 'Arqueiro Esqueleto',
      x: 576,
      y: 192,
      size: 1,
      color: '#ef4444',
      hp: { current: 11, max: 11 },
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
  systemId: 'd20-arcana',
  description: 'Uma expedição arqueológica e arcana através das profundezas das ruínas esquecidas.',
  activeSceneId: 'scene-crypt',
  characterIds: ['char-elyon'],
  documentIds: ['vault-lore-1', 'vault-loc-1'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function initializeDatabase(): Promise<void> {
  const count = await db.systems.count();
  if (count === 0) {
    await db.systems.add(DEFAULT_SYSTEM);
    await db.characters.add(DEFAULT_CHARACTER);
    await db.scenes.add(DEFAULT_SCENE);
    await db.vault.bulkAdd(DEFAULT_VAULT_DOCS);
    await db.campaigns.add(DEFAULT_CAMPAIGN);
  }
}
