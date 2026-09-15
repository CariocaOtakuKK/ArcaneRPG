// ARCANA Official Preset — Fate Core / Acelerado
// Fully compliant with Bible Section 6

import type { SystemDefinition } from '@/types';

export const fateSystem: SystemDefinition = {
  id: 'fate',
  name: 'Fate Core / Acelerado',
  version: '2.0.0',
  author: 'Evil Hat Productions / ARCANA',
  icon: '⚡',
  color: '#0284c7',
  description: 'Sistema narrativo e flexível baseado em Aspectos, Destino e a famosa Escada de Adjetivos com dados Fudge (4dF).',
  builtin: true,
  rollConvention: 'ladder',

  attributeScale: [
    { value: 8, label: 'Lendário (+8)' },
    { value: 7, label: 'Épico (+7)' },
    { value: 6, label: 'Fantástico (+6)' },
    { value: 5, label: 'Excepcional (+5)' },
    { value: 4, label: 'Ótimo (+4)' },
    { value: 3, label: 'Bom (+3)' },
    { value: 2, label: 'Razoável (+2)' },
    { value: 1, label: 'Médio (+1)' },
    { value: 0, label: 'Medíocre (0)' },
    { value: -1, label: 'Pobre (-1)' },
    { value: -2, label: 'Terrível (-2)' },
  ],

  attributes: [
    { id: 'cuidadoso', name: 'Cuidadoso', type: 'ladder', category: 'Abordagens', defaultValue: 1, min: -2, max: 8 },
    { id: 'esperto', name: 'Esperto', type: 'ladder', category: 'Abordagens', defaultValue: 2, min: -2, max: 8 },
    { id: 'estiloso', name: 'Estiloso', type: 'ladder', category: 'Abordagens', defaultValue: 0, min: -2, max: 8 },
    { id: 'flashy', name: 'Fascinante', type: 'ladder', category: 'Abordagens', defaultValue: 1, min: -2, max: 8 },
    { id: 'forcudo', name: 'Poderoso / Vigoroso', type: 'ladder', category: 'Abordagens', defaultValue: 3, min: -2, max: 8 },
    { id: 'rapido', name: 'Rápido', type: 'ladder', category: 'Abordagens', defaultValue: 2, min: -2, max: 8 },
  ],

  resources: [
    {
      id: 'pontos_destino',
      name: 'Pontos de Destino (Fate Points)',
      maxFormula: 5,
      defaultValue: 3,
      color: '#0ea5e9',
      type: 'slots',
      description: 'Pontos para invocar aspectos ou recusar complicações.',
    },
    {
      id: 'estresse_fisico',
      name: 'Estresse Físico',
      maxFormula: 3,
      defaultValue: 0,
      color: '#ef4444',
      type: 'slots',
    },
    {
      id: 'estresse_mental',
      name: 'Estresse Mental',
      maxFormula: 3,
      defaultValue: 0,
      color: '#8b5cf6',
      type: 'slots',
    },
  ],

  combat: {
    initiativeFormula: '4dF + rapido',
    hpResource: 'estresse_fisico',
    conditions: [
      { id: 'conseq_suave', name: 'Consequência Suave (-2)', color: '#eab308' },
      { id: 'conseq_moderada', name: 'Consequência Moderada (-4)', color: '#f97316' },
      { id: 'conseq_severa', name: 'Consequência Severa (-6)', color: '#ef4444' },
    ],
  },

  diceMacros: [
    { id: 'fudge_simples', name: 'Rolar 4dF Puro', expression: '4dF' },
    { id: 'fudge_mais_1', name: 'Rolar 4dF + 1', expression: '4dF + 1' },
    { id: 'fudge_mais_2', name: 'Rolar 4dF + 2', expression: '4dF + 2' },
  ],

  rollPresets: [
    { id: 'acao_rapida', name: 'Ação Rápida (4dF + Rápido)', expression: '4dF + $rapido' },
    { id: 'acao_poderosa', name: 'Ação Poderosa (4dF + Poderoso)', expression: '4dF + $forcudo' },
    { id: 'acao_esperta', name: 'Ação Esperta (4dF + Esperto)', expression: '4dF + $esperto' },
  ],

  itemCategories: ['Equipamento', 'Aspecto de Item', 'Recurso Especial'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
