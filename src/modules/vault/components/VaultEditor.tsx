import React, { useState, useRef } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Link2,
  Trash2,
  Tag,
  Eye,
  Edit3,
  Download,
  FileText,
  Bold,
  Italic,
  Heading1,
  Heading2,
  ListOrdered,
  Quote,
  CheckSquare,
  Sparkles,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { VaultMarkdownRenderer } from './VaultMarkdownRenderer';
import {
  exportDocumentAsMarkdown,
  findUnlinkedMentions,
  VAULT_TEMPLATES,
} from '../utils/vaultUtils';
import type { VaultCategory } from '@/types';

export const VaultEditor: React.FC = () => {
  const documents = useVaultStore((state) => state.documents);
  const activeDocumentId = useVaultStore((state) => state.activeDocumentId);
  const selectDocument = useVaultStore((state) => state.selectDocument);
  const updateDocument = useVaultStore((state) => state.updateDocument);
  const deleteDocument = useVaultStore((state) => state.deleteDocument);
  const linkDocuments = useVaultStore((state) => state.linkDocuments);
  const unlinkDocuments = useVaultStore((state) => state.unlinkDocuments);
  const convertMention = useVaultStore((state) => state.convertMention);

  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [targetLinkId, setTargetLinkId] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const doc = documents.find((d) => d.id === activeDocumentId);
  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-text-muted">
        <FileText className="w-12 h-12 mb-3 opacity-30 text-accent" />
        <p className="text-sm">Selecione uma nota no menu lateral ou crie uma nova para começar.</p>
      </div>
    );
  }

  // Backlinks: documents that have doc.id in their links or mention [[doc.title]]
  const backlinks = documents.filter(
    (d) =>
      d.id !== doc.id &&
      (d.links.includes(doc.id) ||
        d.content.toLowerCase().includes(`[[${doc.title.toLowerCase()}]]`))
  );

  // Unlinked mentions: documents containing doc.title without [[doc.title]]
  const unlinkedMentions = findUnlinkedMentions(doc, documents);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || doc.tags.includes(newTag.trim())) return;
    updateDocument(doc.id, { tags: [...doc.tags, newTag.trim()] });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateDocument(doc.id, { tags: doc.tags.filter((t) => t !== tagToRemove) });
  };

  const handleLinkDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLinkId) return;
    linkDocuments(doc.id, targetLinkId);
    setTargetLinkId('');
  };

  // Insert markdown snippet at cursor
  const insertSnippet = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = doc.content;
    const selected = current.substring(start, end);

    const replacement = `${prefix}${selected || 'texto'}${suffix}`;
    const nextContent = current.substring(0, start) + replacement + current.substring(end);

    updateDocument(doc.id, { content: nextContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 5));
    }, 10);
  };

  // Export current note as Obsidian .md
  const handleExportMarkdown = () => {
    const md = exportDocumentAsMarkdown(doc);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyTemplate = (templateId: string) => {
    const tmpl = VAULT_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    if (
      doc.content.length > 50 &&
      !confirm('Deseja anexar o template ao final deste documento?')
    ) {
      return;
    }

    const nextContent = doc.content ? `${doc.content}\n\n${tmpl.content}` : tmpl.content;
    updateDocument(doc.id, { content: nextContent, category: tmpl.category });
    setShowTemplatesModal(false);
  };

  const availableDocsToLink = documents.filter(
    (d) => d.id !== doc.id && !doc.links.includes(d.id)
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-bg-primary overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-3 border-b border-border-subtle bg-bg-secondary flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            value={doc.title}
            onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
            className="text-lg font-bold bg-transparent border-none text-text-primary focus:outline-none focus:ring-0 w-80 truncate"
            placeholder="Título do Documento"
          />

          <select
            value={doc.category}
            onChange={(e) => updateDocument(doc.id, { category: e.target.value as VaultCategory })}
            className="text-xs font-semibold px-2.5 py-1 rounded bg-bg-tertiary border border-border-default text-text-secondary capitalize focus:outline-none"
          >
            <option value="lore">Lore</option>
            <option value="location">Lugar</option>
            <option value="npc">NPC</option>
            <option value="item">Item</option>
            <option value="quest">Missão</option>
            <option value="rule">Regra</option>
            <option value="session">Sessão</option>
          </select>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTemplatesModal(true)}
            icon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
            title="Inserir Template RPG"
          >
            Templates
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleExportMarkdown}
            icon={<Download className="w-3.5 h-3.5" />}
            title="Exportar Markdown (Compatível com Obsidian)"
          >
            Exportar .md
          </Button>

          <Button
            size="sm"
            variant={previewMode ? 'primary' : 'ghost'}
            onClick={() => setPreviewMode(!previewMode)}
            icon={previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          >
            {previewMode ? 'Editor' : 'Preview'}
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm(`Tem certeza que deseja apagar "${doc.title}"?`)) {
                deleteDocument(doc.id);
              }
            }}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            title="Excluir Nota"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor / Preview Main Column */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle overflow-y-auto">
          {/* Quick Markdown Formatting Toolbar (Only in Edit Mode) */}
          {!previewMode && (
            <div className="px-6 py-2 border-b border-border-subtle bg-bg-tertiary/40 flex items-center gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => insertSnippet('**', '**')}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary"
                title="Negrito (**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertSnippet('*', '*')}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary"
                title="Itálico (*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-border-subtle mx-1" />
              <button
                onClick={() => insertSnippet('# ')}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary"
                title="Título 1 (#)"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertSnippet('## ')}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary"
                title="Título 2 (##)"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-border-subtle mx-1" />
              <button
                onClick={() => insertSnippet('- [ ] ')}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary"
                title="Checklist (- [ ])"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertSnippet('> ')}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary"
                title="Citação (>)"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertSnippet('1. ')}
                className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary"
                title="Lista Numerada"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-border-subtle mx-1" />
              <button
                onClick={() => insertSnippet('[[', ']]')}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-accent/20 text-accent hover:bg-accent/30 border border-accent/40"
                title="Inserir Wikilink [[Nome]]"
              >
                [[wikilink]]
              </button>
            </div>
          )}

          {/* Body Textarea or Markdown View */}
          <div className="flex-1 p-6 overflow-y-auto">
            {previewMode ? (
              <VaultMarkdownRenderer content={doc.content} />
            ) : (
              <textarea
                ref={textareaRef}
                value={doc.content}
                onChange={(e) => updateDocument(doc.id, { content: e.target.value })}
                className="w-full h-full min-h-[450px] bg-transparent text-text-primary font-mono text-xs leading-relaxed resize-none focus:outline-none border-none placeholder-text-muted"
                placeholder="Escreva sua anotação em Markdown... Use [[Nome da Nota]] para conectar a outros documentos do Vault."
              />
            )}
          </div>
        </div>

        {/* Right Knowledge Inspector (Tags, Links, Backlinks, Mentions) */}
        <div className="w-80 p-4 space-y-5 overflow-y-auto bg-bg-secondary/60">
          {/* Tags Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wide">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>Tags</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              {doc.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  title="Clique para remover tag"
                  className="inline-flex"
                >
                  <Badge
                    variant="neutral"
                    className="text-[10px] hover:bg-status-danger/20 hover:text-status-danger transition-colors cursor-pointer"
                  >
                    #{t} ×
                  </Badge>
                </button>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-1.5 pt-1">
              <input
                placeholder="Adicionar tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary placeholder-text-muted focus:outline-none"
              />
              <Button type="submit" size="sm" variant="ghost">
                +
              </Button>
            </form>
          </div>

          {/* Outgoing Explicit Links */}
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <h4 className="text-xs font-bold text-text-primary flex items-center justify-between uppercase tracking-wide">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-accent" />
                <span>Conexões ({doc.links.length})</span>
              </div>
            </h4>

            {doc.links.length > 0 ? (
              <div className="space-y-1">
                {doc.links.map((targetId) => {
                  const targetDoc = documents.find((d) => d.id === targetId);
                  if (!targetDoc) return null;
                  return (
                    <div
                      key={targetId}
                      className="flex items-center justify-between p-1.5 rounded bg-bg-tertiary text-xs hover:bg-bg-elevated transition-colors"
                    >
                      <button
                        onClick={() => selectDocument(targetDoc.id)}
                        className="truncate text-left text-text-primary hover:text-accent font-medium flex-1 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 opacity-60" />
                        <span className="truncate">{targetDoc.title}</span>
                      </button>
                      <button
                        onClick={() => unlinkDocuments(doc.id, targetId)}
                        className="text-text-muted hover:text-status-danger ml-2 text-xs"
                        title="Desvincular"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-text-muted">
                Nenhum link ativo. Digite <code className="text-accent">[[Nome]]</code> no texto.
              </p>
            )}

            {availableDocsToLink.length > 0 && (
              <form onSubmit={handleLinkDoc} className="flex gap-1 pt-1">
                <select
                  value={targetLinkId}
                  onChange={(e) => setTargetLinkId(e.target.value)}
                  className="flex-1 bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                >
                  <option value="">Conectar manualmente...</option>
                  {availableDocsToLink.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.category})
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="ghost" disabled={!targetLinkId}>
                  +
                </Button>
              </form>
            )}
          </div>

          {/* Backlinks (Incoming References) */}
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <h4 className="text-xs font-bold text-text-primary flex items-center justify-between uppercase tracking-wide">
              <span>Backlinks ({backlinks.length})</span>
            </h4>

            {backlinks.length > 0 ? (
              <div className="space-y-1">
                {backlinks.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectDocument(b.id)}
                    className="w-full text-left p-1.5 rounded bg-bg-tertiary/70 hover:bg-bg-elevated text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Badge variant="neutral" className="text-[9px] uppercase">
                      {b.category}
                    </Badge>
                    <span className="truncate font-medium text-text-primary hover:text-accent">
                      {b.title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-text-muted">Nenhum documento aponta para esta nota ainda.</p>
            )}
          </div>

          {/* Unlinked Mentions (Obsidian-Style 1-Click Linking) */}
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <h4 className="text-xs font-bold text-text-primary flex items-center justify-between uppercase tracking-wide">
              <span>Menções não-linkadas ({unlinkedMentions.length})</span>
            </h4>

            {unlinkedMentions.length > 0 ? (
              <div className="space-y-2">
                {unlinkedMentions.map((mention) => (
                  <Card
                    key={mention.sourceDocId}
                    className="p-2 bg-bg-tertiary/60 border border-border-subtle space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {mention.sourceDocTitle}
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => convertMention(mention.sourceDocId, doc.title)}
                        className="text-[10px] py-0 px-1.5 h-6"
                      >
                        + Linkar
                      </Button>
                    </div>
                    <p className="text-[11px] text-text-muted italic line-clamp-2">
                      {mention.snippet}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-text-muted">
                Nenhuma menção não-linkada encontrada no Vault.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-bg-secondary border border-border-default shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Modelos de Criação de RPG</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowTemplatesModal(false)}>
                ✕
              </Button>
            </div>

            <p className="text-xs text-text-muted">
              Selecione um template para preencher a estrutura da sua anotação com campos essenciais de worldbuilding:
            </p>

            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {VAULT_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl.id)}
                  className="p-3 rounded bg-bg-tertiary border border-border-default hover:border-accent cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-text-primary">{tmpl.label}</h5>
                    <span className="text-[10px] text-text-muted capitalize">
                      Categoria: {tmpl.category}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" icon={<Plus className="w-3.5 h-3.5" />}>
                    Usar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
