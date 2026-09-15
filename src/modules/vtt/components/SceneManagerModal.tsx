import React, { useState } from 'react';
import { useVTTStore } from '../store/vttStore';
import { useAppStore } from '@/core/store/appStore';
import type { GridType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, Map, Upload, Check } from 'lucide-react';

export interface SceneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SceneManagerModal: React.FC<SceneManagerModalProps> = ({ isOpen, onClose }) => {
  const scenes = useVTTStore((state) => state.scenes);
  const activeSceneId = useVTTStore((state) => state.activeSceneId);
  const selectScene = useVTTStore((state) => state.selectScene);
  const createScene = useVTTStore((state) => state.createScene);
  const deleteScene = useVTTStore((state) => state.deleteScene);
  const setBackgroundImage = useVTTStore((state) => state.setBackgroundImage);
  const updateGridSettings = useVTTStore((state) => state.updateGridSettings);

  const activeCampaignId = useAppStore((state) => state.activeCampaignId);
  const addToast = useAppStore((state) => state.addToast);

  const [newSceneName, setNewSceneName] = useState('');
  const [newGridType, setNewGridType] = useState<GridType>('square');
  const [newGridSize, setNewGridSize] = useState(48);
  const [newWidth, setNewWidth] = useState(2000);
  const [newHeight, setNewHeight] = useState(2000);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneName.trim()) return;

    const id = await createScene(
      newSceneName.trim(),
      activeCampaignId || undefined,
      newWidth,
      newHeight
    );
    updateGridSettings(newGridType, newGridSize);
    selectScene(id);
    setNewSceneName('');
    onClose();
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBackgroundImage(base64);
      addToast({
        type: 'success',
        title: 'Mapa Carregado',
        message: 'A imagem de fundo foi salva localmente no tabuleiro.',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciador de Cenas do Tabuleiro (VTT)"
      maxWidth="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Existing Scenes */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
            Cenas Existentes ({scenes.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scenes.map((scene) => {
              const isActive = scene.id === activeSceneId;
              return (
                <Card
                  key={scene.id}
                  onClick={() => selectScene(scene.id)}
                  className={`p-3 cursor-pointer transition-all border flex items-center justify-between ${
                    isActive
                      ? 'bg-bg-elevated border-accent shadow-subtle'
                      : 'bg-bg-tertiary border-border-subtle hover:border-border-default'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Map className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-text-primary truncate">
                        {scene.name}
                      </h4>
                      <span className="text-[10px] text-text-muted">
                        {scene.tokens.length} tokens • {scene.gridType} ({scene.gridSize}px)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isActive && <Check className="w-4 h-4 text-accent" />}
                    {scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remover cena "${scene.name}"?`)) {
                            deleteScene(scene.id);
                          }
                        }}
                        className="text-text-muted hover:text-status-danger p-1"
                        aria-label="Deletar cena"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Upload Background Map Image for Active Scene */}
        <Card className="p-3 bg-bg-tertiary border border-border-subtle space-y-2">
          <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-accent" /> Imagem de Fundo da Cena Ativa
          </span>
          <p className="text-[11px] text-text-secondary">
            Carregue qualquer imagem de mapa (PNG, JPG, WebP). Ela é salva offline em base64 no
            IndexedDB.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            className="text-xs text-text-muted file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-bg-elevated file:text-text-primary hover:file:bg-accent hover:file:text-white cursor-pointer"
          />
        </Card>

        {/* Form to create new scene */}
        <Card className="p-4 space-y-3 border-l-4 border-l-accent">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-accent" /> Criar Nova Cena
          </h4>

          <form onSubmit={handleCreate} className="space-y-3">
            <Input
              label="Nome da Cena"
              placeholder="Ex: Pátio do Castelo Sombrio"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Tipo de Grid
                </label>
                <select
                  value={newGridType}
                  onChange={(e) => setNewGridType(e.target.value as GridType)}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                >
                  <option value="square">Quadrado</option>
                  <option value="hex">Hexagonal</option>
                  <option value="none">Sem Grid</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Grid (Pixels)
                </label>
                <input
                  type="number"
                  value={newGridSize}
                  onChange={(e) => setNewGridSize(Number(e.target.value))}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Largura (px)
                </label>
                <input
                  type="number"
                  value={newWidth}
                  onChange={(e) => setNewWidth(Number(e.target.value))}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Altura (px)
                </label>
                <input
                  type="number"
                  value={newHeight}
                  onChange={(e) => setNewHeight(Number(e.target.value))}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>
            </div>

            <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Criar Cena
            </Button>
          </form>
        </Card>
      </div>
    </Modal>
  );
};
