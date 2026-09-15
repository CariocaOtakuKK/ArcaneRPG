// ARCANA Official Preset — Vampiro: A Máscara 5e (V5)
// Fully compliant with Bible Section 6

import type { SystemDefinition } from '@/types';

export const vampire5eSystem: SystemDefinition = {
  id: 'vampire5e',
  name: 'Vampiro: A Máscara 5e',
  version: '5.0.0',
  author: 'World of Darkness / Paradox / ARCANA',
  icon: '🩸',
  color: '#991b1b',
  description: 'Horror pessoal e político. Membros da Família lidando com a Fera interior, politicagem da Camarilla e a Fome eterna.',
  builtin: true,
  rollConvention: 'pool',

  attributes: [
    // Físicos
    { id: 'forca', name: 'Força', category: 'Físicos', type: 'number', defaultValue: 1, min: 1, max: 5 },
    { id: 'destreza', name: 'Destreza', category: 'Físicos', type: 'number', defaultValue: 1, min: 1, max: 5 },
    { id: 'vigor', name: 'Vigor', category: 'Físicos', type: 'number', defaultValue: 1, min: 1, max: 5 },
    // Sociais
    { id: 'carisma', name: 'Carisma', category: 'Sociais', type: 'number', defaultValue: 1, min: 1, max: 5 },
    { id: 'manipulacao', name: 'Manipulação', category: 'Sociais', type: 'number', defaultValue: 1, min: 1, max: 5 },
    { id: 'autocontrole', name: 'Autocontrole', category: 'Sociais', type: 'number', defaultValue: 1, min: 1, max: 5 },
    // Mentais
    { id: 'inteligencia', name: 'Inteligência', category: 'Mentais', type: 'number', defaultValue: 1, min: 1, max: 5 },
    { id: 'raciocinio', name: 'Raciocínio', category: 'Mentais', type: 'number', defaultValue: 1, min: 1, max: 5 },
    { id: 'determinacao', name: 'Determinação', category: 'Mentais', type: 'number', defaultValue: 1, min: 1, max: 5 },
    // Geração & Humanidade
    { id: 'humanidade', name: 'Humanidade', category: 'Condição', type: 'number', defaultValue: 7, min: 0, max: 10 },
    { id: 'potencia_sangue', name: 'Potência do Sangue', category: 'Condição', type: 'number', defaultValue: 1, min: 0, max: 10 },
  ],

  resources: [
    {
      id: 'saude',
      name: 'Saúde',
      maxFormula: 'vigor + 3',
      defaultValue: 5,
      color: '#dc2626',
      type: 'bar',
    },
    {
      id: 'vontade',
      name: 'Força de Vontade',
      maxFormula: 'autocontrole + determinacao',
      defaultValue: 4,
      color: '#3b82f6',
      type: 'bar',
    },
    {
      id: 'fome',
      name: 'Fome',
      maxFormula: 5,
      defaultValue: 1,
      color: '#7f1d1d',
      type: 'slots',
      description: 'Nível de sede da Fera (0 a 5).',
    },
  ],

  combat: {
    initiativeFormula: 'raciocinio + autocontrole',
    hpResource: 'saude',
    defenseStat: {
      name: 'Evasão',
      formula: 'destreza + atletismo',
    },
    conditions: [
      { id: 'frenesi', name: 'Frenesi da Fera', color: '#b91c1c' },
      { id: 'torpor', name: 'Torpor', color: '#1e293b' },
      { id: 'maculado', name: 'Mancha na Humanidade', color: '#7c2d12' },
      { id: 'exposto', name: 'Quebra de Máscara', color: '#eab308' },
    ],
  },

  diceMacros: [
    { id: 'pool_4', name: 'Pool 4d10 (Dif 6)', expression: '4d10cs>=6' },
    { id: 'pool_6', name: 'Pool 6d10 (Dif 6)', expression: '6d10cs>=6' },
    { id: 'pool_8', name: 'Pool 8d10 (Dif 6)', expression: '8d10cs>=6' },
    { id: 'rouse_check', name: 'Checagem de Despertar (1d10)', expression: '1d10cs>=6' },
  ],

  rollPresets: [
    { id: 'teste_fome', name: 'Teste de Instinto Faminto', expression: '5d10cs>=6' },
  ],

  itemCategories: ['Arma', 'Acessório', 'Bolsa de Sangue', 'Artefato Ocultista', 'Eletrônico'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
