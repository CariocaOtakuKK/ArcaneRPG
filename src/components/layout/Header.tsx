import React from 'react';
import { useAppStore } from '@/core/store/appStore';
import { useCampaignStore } from '@/modules/campaigns/store/campaignStore';
import { AVAILABLE_THEMES } from '@/core/theme/themeManager';
import type { PillarId, ThemeId } from '@/types';
import {
  Users,
  Map,
  BookOpen,
  FolderGit2,
  Cpu,
  Palette,
  WifiOff,
} from 'lucide-react';

export const Header: React.FC = () => {
  const activePillar = useAppStore((state) => state.activePillar);
  const setActivePillar = useAppStore((state) => state.setActivePillar);
  const currentTheme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const campaigns = useCampaignStore((state) => state.campaigns);
  const activeCampaignId = useCampaignStore((state) => state.activeCampaignId);
  const selectCampaign = useCampaignStore((state) => state.selectCampaign);

  const navItems: Array<{ id: PillarId; label: string; icon: React.ReactNode }> = [
    { id: 'characters', label: 'Fichas Dinâmicas', icon: <Users className="w-4 h-4" /> },
    { id: 'vtt', label: 'Mesa Virtual (VTT)', icon: <Map className="w-4 h-4" /> },
    { id: 'vault', label: 'Vault de Conhecimento', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Campanhas', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'system-builder', label: 'Motor de Regras & Fórmulas', icon: <Cpu className="w-4 h-4" /> },
  ];

  return (
    <header className="h-14 border-b border-border-subtle bg-bg-secondary px-4 flex items-center justify-between select-none sticky top-0 z-30">
      {/* Brand & Campaign */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center shadow-glow">
            <span className="text-accent font-bold text-lg leading-none">🔮</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-sm text-text-primary uppercase">
                ARCANA
              </span>
              <span className="text-[10px] px-1.5 py-0.2 font-mono bg-bg-tertiary text-text-muted border border-border-subtle rounded">
                v1.0-Fase 0
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
              <span>Offline-First (Dexie)</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-border-subtle hidden md:block" />

        {/* Campaign Switcher */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          <span className="text-text-muted">Campanha:</span>
          <select
            value={activeCampaignId || ''}
            onChange={(e) => selectCampaign(e.target.value || null)}
            className="bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-border-focus"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pillar Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-bg-tertiary/60 p-1 rounded-lg border border-border-subtle">
        {navItems.map((item) => {
          const isActive = activePillar === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePillar(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-accent text-text-primary shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Utility Controls */}
      <div className="flex items-center gap-3">
        {/* Theme Picker */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-text-muted" />
          <select
            value={currentTheme}
            onChange={(e) => setTheme(e.target.value as ThemeId)}
            className="bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-border-focus"
            aria-label="Selecionar Tema"
          >
            {AVAILABLE_THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Offline Badge */}
        <div
          title="Modo 100% Offline via IndexedDB ativo"
          className="p-1.5 rounded bg-bg-tertiary text-text-muted border border-border-subtle hidden md:flex items-center"
        >
          <WifiOff className="w-3.5 h-3.5 text-status-success" />
        </div>
      </div>
    </header>
  );
};
