import React, { useState, useRef } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { VaultCategory } from '@/types';
import {
  Plus,
  Search,
  Book,
  MapPin,
  Skull,
  Shield,
  Sparkles,
  Scroll,
  Upload,
  Calendar,
} from 'lucide-react';

const CATEGORY_ICONS: Record<VaultCategory, React.ReactNode> = {
  lore: <Book className="w-3.5 h-3.5 text-accent" />,
  location: <MapPin className="w-3.5 h-3.5 text-status-warning" />,
  npc: <Skull className="w-3.5 h-3.5 text-status-danger" />,
  item: <Shield className="w-3.5 h-3.5 text-status-info" />,
  rule: <Scroll className="w-3.5 h-3.5 text-text-muted" />,
  quest: <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />,
  session: <Calendar className="w-3.5 h-3.5 text-status-success" />,
};

export const VaultList: React.FC = () => {
  const documents = useVaultStore((state) => state.documents);
  const activeDocumentId = useVaultStore((state) => state.activeDocumentId);
  const selectDocument = useVaultStore((state) => state.selectDocument);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);
  const selectedCategory = useVaultStore((state) => state.selectedCategory);
  const setSelectedCategory = useVaultStore((state) => state.setSelectedCategory);
  const selectedTag = useVaultStore((state) => state.selectedTag);
  const setSelectedTag = useVaultStore((state) => state.setSelectedTag);
  const createDocument = useVaultStore((state) => state.createDocument);
  const importMarkdownDoc = useVaultStore((state) => state.importMarkdownDoc);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<VaultCategory>('lore');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract all unique tags across all documents
  const allTags = Array.from(new Set(documents.flatMap((d) => d.tags)));

  const filteredDocs = documents.filter((doc) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query) ||
      doc.tags.some((t) => t.toLowerCase().includes(query));

    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesTag = !selectedTag || doc.tags.includes(selectedTag);

    return matchesSearch && matchesCat && matchesTag;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createDocument(newTitle.trim(), newCategory);
    setNewTitle('');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        await importMarkdownDoc(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-80 border-r border-border-subtle bg-bg-secondary flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            Vault de Conhecimento
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{documents.length} docs</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-3.5 h-3.5" />}
              title="Importar arquivo Markdown (.md) com Frontmatter"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.markdown"
              className="hidden"
              onChange={handleFileImport}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar notas, tags, texto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-tertiary border border-border-default rounded pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
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
          {(['lore', 'npc', 'location', 'item', 'rule', 'quest', 'session'] as VaultCategory[]).map(
            (cat) => (
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
            )
          )}
        </div>

        {/* Tags horizontal list */}
        {allTags.length > 0 && (
          <div className="flex gap-1 overflow-x-auto text-[10px] text-text-muted pt-1">
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-1.5 py-0.5 rounded bg-status-danger/20 text-status-danger hover:underline"
              >
                Limpar tag ×
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-accent/40 text-accent font-semibold'
                    : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Document Inline Form */}
      <form onSubmit={handleCreate} className="p-3 border-b border-border-subtle flex gap-1.5">
        <input
          placeholder="Nova nota..."
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
          <option value="session">Sessão</option>
        </select>
        <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
          Add
        </Button>
      </form>

      {/* Document List */}
      <div className="p-3 overflow-y-auto flex-1 space-y-1.5">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-muted">
            Nenhuma anotação encontrada.
          </div>
        ) : (
          filteredDocs.map((doc) => {
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
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded bg-bg-primary shrink-0">
                    {CATEGORY_ICONS[doc.category]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-text-primary truncate">{doc.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted capitalize">
                      <span>{doc.category}</span>
                      <span>•</span>
                      <span>{doc.links.length} conexões</span>
                      {doc.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate text-accent">#{doc.tags[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
