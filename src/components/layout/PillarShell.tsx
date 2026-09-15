import React from 'react';
import { useAppStore } from '@/core/store/appStore';
import { CharacterSheet } from '@/modules/characters/components/CharacterSheet';
import { CharacterList } from '@/modules/characters/components/CharacterList';
import { VTTCanvas } from '@/modules/vtt/components/VTTCanvas';
import { VaultList } from '@/modules/vault/components/VaultList';
import { VaultEditor } from '@/modules/vault/components/VaultEditor';
import { VaultGraph } from '@/modules/vault/components/VaultGraph';
import { CampaignManager } from '@/modules/campaigns/components/CampaignManager';
import { SystemBuilder } from '@/modules/system/components/SystemBuilder';
import { Button } from '@/components/ui/Button';
import { Network, FileText } from 'lucide-react';

export const PillarShell: React.FC = () => {
  const activePillar = useAppStore((state) => state.activePillar);
  const [vaultSubView, setVaultSubView] = React.useState<'editor' | 'graph'>('editor');

  switch (activePillar) {
    case 'characters':
      return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          <CharacterList />
          <div className="flex-1 overflow-y-auto">
            <CharacterSheet />
          </div>
        </div>
      );

    case 'vtt':
      return (
        <div className="h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col">
          <VTTCanvas />
        </div>
      );

    case 'vault':
      return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
          <VaultList />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Vault Mode Switcher Bar */}
            <div className="px-6 py-2 border-b border-border-subtle bg-bg-secondary/40 flex items-center justify-between">
              <span className="text-xs text-text-muted">Visualização do Vault</span>
              <div className="flex gap-1 bg-bg-tertiary p-0.5 rounded-lg border border-border-subtle">
                <Button
                  size="sm"
                  variant={vaultSubView === 'editor' ? 'primary' : 'ghost'}
                  onClick={() => setVaultSubView('editor')}
                  icon={<FileText className="w-3.5 h-3.5" />}
                >
                  Documento
                </Button>
                <Button
                  size="sm"
                  variant={vaultSubView === 'graph' ? 'primary' : 'ghost'}
                  onClick={() => setVaultSubView('graph')}
                  icon={<Network className="w-3.5 h-3.5" />}
                >
                  Grafo de Conexões
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {vaultSubView === 'editor' ? <VaultEditor /> : <VaultGraph />}
            </div>
          </div>
        </div>
      );

    case 'campaigns':
      return (
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
          <CampaignManager />
        </div>
      );

    case 'system-builder':
      return (
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
          <SystemBuilder />
        </div>
      );

    default:
      return null;
  }
};
