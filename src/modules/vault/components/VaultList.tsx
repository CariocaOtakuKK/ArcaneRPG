import React, { useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { VaultCategory } from '@/types';
import { Plus, Search, Book, MapPin, Skull, Shield, Sparkles, Scroll } from 'lucide-react';

const CATEGORY_ICONS: Record<VaultCategory, React.ReactNode> = {
  lore: <Book className="w-3.5 h-3.5 text-accent" />,
  location: <MapPin className="w-3.5 h-3.5 text-status-warning" />,
  npc: <Skull className="w-3.5 h-3.5 text-status-danger" />,
  item: <Shield className="w-3.5 h-3.5 text-status-info" />,
  rule: <Scroll className="w-3.5 h-3.5 text-text-muted" />,
  quest: <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />,
  session: <Sparkles className="w-3.5 h-3.5 text-status-success" />,
};

export const VaultList: React.FC = () => {
  const documents = useVaultStore((state) => state.documents);
  const activeDocumentId = useVaultStore((state) => state.activeDocumentId);
  const selectDocument = useVaultStore((state) => state.selectDocument);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);
  const selectedCategory = useVaultStore((state) => state.selectedCategory);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const createDocument = useVaultStore((state) => state.createDocument);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<VaultCategory>('lore');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createDocument(newTitle.trim(), newCategory);
    setNewTitle('');
  };

  return (
    <div className="w-80 border-r border-border-subtle bg-bg-secondary flex flex-col h-[calc(100vh-3.5rem)] select-none">
      <div className="p-4 border-b border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            Vault de Conhecimento
          </h2>
          <span className="text-xs text-text-muted">{documents.length} docs</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar notas, lore, npcs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-tertiary border border-border-default rounded pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-accent text-text-primary'
                : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
            }`}
          >
            Todos
          </button>
          {(['lore', 'npc', 'location', 'item', 'rule', 'quest'] as VaultCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[11px] capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-accent text-text-primary'
                  : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* New Document inline form */}
      <form onSubmit={handleCreate} className="p-3 border-b border-border-subtle flex gap-1.5">
        <input
          placeholder="Nova anotação..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 bg-bg-tertiary border border-border-default rounded px-2.5 py-1 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as VaultCategory)}
          className="bg-bg-tertiary border border-border-default rounded px-1.5 py-1 text-xs text-text-primary capitalize focus:outline-none"
        >
          <option value="lore">Lore</option>
          <option value="location">Lugar</option>
          <option value="npc">NPC</option>
          <option value="item">Item</option>
          <option value="quest">Missão</option>
          <option value="rule">Regra</option>
        </select>
        <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
          Add
        </Button>
      </form>

      {/* Document List */}
      <div className="p-3 overflow-y-auto flex-1 space-y-1.5">
        {filteredDocs.map((doc) => {
          const isActive = doc.id === activeDocumentId;
          return (
            <Card
              key={doc.id}
              onClick={() => selectDocument(doc.id)}
              className={`p-2.5 cursor-pointer transition-all border flex items-center justify-between ${
                isActive
                  ? 'bg-bg-elevated border-accent shadow-subtle'
                  : 'bg-bg-tertiary/60 border-border-subtle hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded bg-bg-primary">
                  {CATEGORY_ICONS[doc.category]}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-text-primary truncate">{doc.title}</h4>
                  <span className="text-[10px] text-text-muted capitalize">
                    {doc.category} • {doc.links.length} conexões
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
