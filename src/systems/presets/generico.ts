// ARCANA Official Preset — Sistema Genérico / Customizável
// Fully compliant with Bible Section 6

import type { SystemDefinition } from '@/types';

export const genericSystem: SystemDefinition = {
  id: 'generico',
  name: 'Sistema Genérico ARCANA',
  version: '1.0.0',
  author: 'ARCANA Architecture',
  icon: '🎲',
  color: '#6366f1',
  description: 'Estrutura aberta para criação rápida de novos mundos, hackeamento de regras ou campanhas minimalistas.',
  builtin: true,
  rollConvention: 'd20',

  attributes: [
    { id: 'vigor', name: 'Vigor / Físico', type: 'number', category: 'Pilares', defaultValue: 10, min: 1, max: 20 },
    { id: 'mente', name: 'Mente / Astúcia', type: 'number', category: 'Pilares', defaultValue: 10, min: 1, max: 20 },
    { id: 'espirito', name: 'Espírito / Vontade', type: 'number', category: 'Pilares', defaultValue: 10, min: 1, max: 20 },
    {
      id: 'defesa',
      name: 'Defesa Base',
      type: 'derived',
      category: 'Combate',
      defaultValue: 10,
      formula: '10 + floor((vigor - 10) / 2)',
    },
  ],

  resources: [
    {
      id: 'vida',
      name: 'Vitalidade',
      maxFormula: 'vigor * 2',
      defaultValue: 20,
      color: '#ef4444',
      type: 'bar',
    },
    {
      id: 'energia',
      name: 'Energia',
      maxFormula: 'espirito',
      defaultValue: 10,
      color: '#3b82f6',
      type: 'bar',
    },
  ],

  combat: {
    initiativeFormula: '1d20 + floor((mente - 10) / 2)',
    hpResource: 'vida',
    defenseStat: {
      name: 'Defesa',
      formula: 'defesa',
    },
    conditions: [
      { id: 'ferido', name: 'Ferido', color: '#ef4444' },
      { id: 'exaurido', name: 'Exaurido', color: '#f59e0b' },
    ],
  },

  diceMacros: [
    { id: 'd20_teste', name: 'Rolar 1d20', expression: '1d20' },
    { id: 'd6_teste', name: 'Rolar 2d6', expression: '2d6' },
  ],

  rollPresets: [
    { id: 'teste_vigor', name: 'Teste Físico', expression: '1d20 + floor(($vigor - 10) / 2)' },
  ],

  itemCategories: ['Geral', 'Armas', 'Itens Úteis'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
