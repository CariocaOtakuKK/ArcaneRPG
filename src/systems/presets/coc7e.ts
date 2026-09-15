// ARCANA Official Preset — Call of Cthulhu 7e (CoC)
// Fully compliant with Bible Section 6

import type { SystemDefinition } from '@/types';

export const coc7eSystem: SystemDefinition = {
  id: 'coc7e',
  name: 'Call of Cthulhu 7e',
  version: '7.0.0',
  author: 'Chaosium / ARCANA',
  icon: '🐙',
  color: '#065f46',
  description: 'Horror lovecraftiano clássico nos anos 1920 ou dias modernos. Investigadores frágeis encarando horrores cósmicos.',
  builtin: true,
  rollConvention: 'd100',

  attributes: [
    { id: 'for', name: 'Força', shortName: 'FOR', type: 'percent', category: 'Características', defaultValue: 50, min: 0, max: 100 },
    { id: 'con', name: 'Constituição', shortName: 'CON', type: 'percent', category: 'Características', defaultValue: 50, min: 0, max: 100 },
    { id: 'tam', name: 'Tamanho', shortName: 'TAM', type: 'percent', category: 'Características', defaultValue: 55, min: 0, max: 100 },
    { id: 'des', name: 'Destreza', shortName: 'DES', type: 'percent', category: 'Características', defaultValue: 50, min: 0, max: 100 },
    { id: 'apa', name: 'Aparência', shortName: 'APA', type: 'percent', category: 'Características', defaultValue: 50, min: 0, max: 100 },
    { id: 'int', name: 'Inteligência', shortName: 'INT', type: 'percent', category: 'Características', defaultValue: 60, min: 0, max: 100 },
    { id: 'pod', name: 'Poder', shortName: 'POD', type: 'percent', category: 'Características', defaultValue: 50, min: 0, max: 100 },
    { id: 'edu', name: 'Educação', shortName: 'EDU', type: 'percent', category: 'Características', defaultValue: 70, min: 0, max: 100 },
    { id: 'mov', name: 'Movimento', shortName: 'MOV', type: 'number', category: 'Características', defaultValue: 8, min: 0, max: 12 },
    // Derived success thresholds
    {
      id: 'for_bom',
      name: 'FOR (Sucesso Bom - Metade)',
      type: 'derived',
      category: 'Metades',
      defaultValue: 25,
      formula: 'floor(for / 2)',
    },
    {
      id: 'for_extremo',
      name: 'FOR (Sucesso Extremo - Quinto)',
      type: 'derived',
      category: 'Quintos',
      defaultValue: 10,
      formula: 'floor(for / 5)',
    },
  ],

  resources: [
    {
      id: 'pv',
      name: 'Pontos de Vida (PV)',
      maxFormula: 'floor((con + tam) / 10)',
      defaultValue: 10,
      color: '#ef4444',
      type: 'bar',
    },
    {
      id: 'san',
      name: 'Sanidade (SAN)',
      maxFormula: 'pod',
      defaultValue: 50,
      color: '#8b5cf6',
      type: 'bar',
    },
    {
      id: 'sorte',
      name: 'Sorte',
      maxFormula: 99,
      defaultValue: 50,
      color: '#eab308',
      type: 'bar',
    },
    {
      id: 'magia',
      name: 'Pontos de Magia (PM)',
      maxFormula: 'floor(pod / 5)',
      defaultValue: 10,
      color: '#3b82f6',
      type: 'bar',
    },
  ],

  combat: {
    initiativeFormula: 'des',
    hpResource: 'pv',
    conditions: [
      { id: 'ferimento_grave', name: 'Ferimento Grave', color: '#b91c1c' },
      { id: 'inconsciente', name: 'Inconsciente', color: '#1e293b' },
      { id: 'loucura_temporaria', name: 'Loucura Temporária', color: '#a855f7' },
      { id: 'loucura_indefinida', name: 'Loucura Indefinida', color: '#7c2d12' },
      { id: 'morrendo', name: 'Morrendo', color: '#ef4444' },
    ],
  },

  diceMacros: [
    { id: 'teste_1d100', name: 'Teste Percentual 1d100', expression: '1d100' },
    { id: 'dado_sanidade_leve', name: 'Perda de SAN Leve (1d4)', expression: '1d4' },
    { id: 'dado_sanidade_grave', name: 'Perda de SAN Grave (1d10)', expression: '1d10' },
  ],

  rollPresets: [
    { id: 'teste_sorte', name: 'Gastar Sorte (1d100)', expression: '1d100' },
    { id: 'teste_sanidade', name: 'Teste de Sanidade (1d100)', expression: '1d100' },
  ],

  itemCategories: ['Arma', 'Livro / Tomo Antigo', 'Relíquia Oculta', 'Equipamento Investigativo'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
