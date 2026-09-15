import type { ThemeId } from '@/types';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  previewColor: string;
}

export const AVAILABLE_THEMES: ThemeOption[] = [
  {
    id: 'arcana-dark',
    name: 'Arcana Obscura',
    description: 'Tema padrão sombrio com realces em violeta arcana e dourado.',
    previewColor: '#8b5cf6',
  },
  {
    id: 'parchment',
    name: 'Pergaminho Antigo',
    description: 'Estética clássica de pergaminho medieval com tons quentes.',
    previewColor: '#b45309',
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Visual futurista de alta densidade com magenta e ciano luminoso.',
    previewColor: '#ff007f',
  },
  {
    id: 'starlight',
    name: 'Starlight Void',
    description: 'Navegação estelar com fundo cósmico e ciano elétrico.',
    previewColor: '#38bdf8',
  },
];

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('arcana_theme', theme);
  } catch {
    // Ignore storage issues in restricted environments
  }
}

export function getInitialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem('arcana_theme') as ThemeId | null;
    if (saved && AVAILABLE_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // Fallback
  }
  return 'arcana-dark';
}
