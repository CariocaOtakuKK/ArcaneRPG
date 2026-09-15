import React, { useState } from 'react';
import { useAppStore } from '@/core/store/appStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { BookOpen, Shield, Volume2, Edit3, X } from 'lucide-react';

export interface GMReferencePanelProps {
  onClose: () => void;
}

export const GMReferencePanel: React.FC<GMReferencePanelProps> = ({ onClose }) => {
  const systems = useAppStore((state) => state.systems);
  const activeSystemId = useAppStore((state) => state.activeSystemId);
  const activeSystem = systems.find((s) => s.id === activeSystemId) || systems[0];

  const [activeTab, setActiveTab] = useState<'rules' | 'scratchpad' | 'audio'>('rules');
  const [scratchpadText, setScratchpadText] = useState(
    'Anotações secretas do Mestre:\n- A porta leste tem armadilha de agulha venenosa (Percepção CD 15).\n- O baú contém 120 PO e uma Chave de Latão com runas arcanas.'
  );
  const [ambientVolume, setAmbientVolume] = useState(50);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const dcTable = [
    { dc: 5, difficulty: 'Muito Fácil', example: 'Notar algo chamativo, arrombar fechadura quebrada' },
    { dc: 10, difficulty: 'Fácil', example: 'Subir muro com apoios, lembrar história conhecida' },
    { dc: 15, difficulty: 'Médio', example: 'Ouvir passos suaves, destrancar porta típica' },
    { dc: 20, difficulty: 'Difícil', example: 'Nadar contra correnteza, decifrar código arcano' },
    { dc: 25, difficulty: 'Muito Difícil', example: 'Saltar abismo largo, resistir a veneno letal' },
    { dc: 30, difficulty: 'Quase Impossível', example: 'Rastrear em pedra pura durante tempestade' },
  ];

  return (
    <Card className="flex flex-col h-full bg-bg-secondary/95 backdrop-blur border border-border-default shadow-card p-4 space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/20 text-accent">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Painel do Mestre (Tela Rápida)
            </h3>
            <span className="text-[10px] text-text-muted">{activeSystem.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onClose} className="p-1 h-6 w-6">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg border border-border-subtle">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 text-[11px] font-medium py-1 rounded transition-colors ${
            activeTab === 'rules'
              ? 'bg-accent text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Regras & CDs
        </button>
        <button
          onClick={() => setActiveTab('scratchpad')}
          className={`flex-1 text-[11px] font-medium py-1 rounded transition-colors ${
            activeTab === 'scratchpad'
              ? 'bg-accent text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Scratchpad
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 text-[11px] font-medium py-1 rounded transition-colors ${
            activeTab === 'audio'
              ? 'bg-accent text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Ambiente
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 text-xs">
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {/* CD Table */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-accent" /> Tabela Canônica de CDs (D&D / d20)
              </span>
              <div className="space-y-1">
                {dcTable.map((item) => (
                  <div
                    key={item.dc}
                    className="p-1.5 rounded bg-bg-tertiary border border-border-subtle flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-accent w-6">CD {item.dc}</span>
                      <span className="font-medium text-text-primary">{item.difficulty}</span>
                    </div>
                    <span className="text-[10px] text-text-muted line-clamp-1 max-w-[140px]">
                      {item.example}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conditions */}
            {activeSystem.combat?.conditions && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                  Condições de {activeSystem.name} ({activeSystem.combat.conditions.length})
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeSystem.combat.conditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="p-1.5 rounded bg-bg-tertiary border border-border-subtle text-[10px] flex items-center justify-between"
                    >
                      <span className="font-medium text-text-primary">{cond.name}</span>
                      <Badge variant="warning">Ativa</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scratchpad' && (
          <div className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Bloco de Notas Rápido
              </span>
              <span>Salvo Localmente</span>
            </div>
            <Textarea
              rows={12}
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="Digite anotações rápidas durante a sessão..."
              className="flex-1 font-mono text-xs"
            />
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-accent" /> Trilha Sonora & Clima
                </span>
                <Badge variant={isPlayingAudio ? 'success' : 'neutral'}>
                  {isPlayingAudio ? 'Tocando' : 'Pausado'}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-text-muted block">Volume Geral ({ambientVolume}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-full accent-accent h-1.5 rounded-lg bg-bg-elevated cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle">
                {['Masmorra Sombria', 'Taverna Aconchegante', 'Tempestade com Chuva', 'Combate Épico'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="p-2 rounded bg-bg-elevated hover:bg-accent/20 border border-border-subtle text-left text-[11px] font-medium text-text-primary transition-all"
                  >
                    🎵 {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
