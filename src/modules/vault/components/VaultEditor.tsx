import React, { useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { Link2, Trash2, Tag, Eye, Edit3 } from 'lucide-react';

export const VaultEditor: React.FC = () => {
  const documents = useVaultStore((state) => state.documents);
  const activeDocumentId = useVaultStore((state) => state.activeDocumentId);
  const updateDocument = useVaultStore((state) => state.updateDocument);
  const deleteDocument = useVaultStore((state) => state.deleteDocument);
  const linkDocuments = useVaultStore((state) => state.linkDocuments);
  const unlinkDocuments = useVaultStore((state) => state.unlinkDocuments);

  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [targetLinkId, setTargetLinkId] = useState('');

  const doc = documents.find((d) => d.id === activeDocumentId);
  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-text-muted">
        Selecione uma nota ou crie uma nova para visualizar e editar.
      </div>
    );
  }

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

  const availableDocsToLink = documents.filter(
    (d) => d.id !== doc.id && !doc.links.includes(d.id)
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <input
            value={doc.title}
            onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
            className="text-xl font-bold bg-transparent border-none text-text-primary focus:outline-none focus:ring-0 w-96"
            placeholder="Título do Documento"
          />
          <Badge variant="primary" className="capitalize">
            {doc.category}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPreviewMode(!previewMode)}
            icon={previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          >
            {previewMode ? 'Editar' : 'Visualizar'}
          </Button>

          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => {
              if (confirm(`Remover permanentemente "${doc.title}"?`)) {
                deleteDocument(doc.id);
              }
            }}
          >
            Deletar
          </Button>
        </div>
      </div>

      {/* Tags & Graph Connections Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tags */}
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tags
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {doc.tags.map((t) => (
              <span
                key={t}
                onClick={() => handleRemoveTag(t)}
                className="cursor-pointer text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary hover:text-status-danger border border-border-subtle"
              >
                #{t} ×
              </span>
            ))}
            <form onSubmit={handleAddTag} className="inline-block">
              <input
                placeholder="+ tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="bg-bg-tertiary text-xs px-2 py-0.5 rounded border border-border-subtle text-text-primary focus:outline-none w-20"
              />
            </form>
          </div>
        </Card>

        {/* Links to Other Notes */}
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Conexões no Grafo ({doc.links.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {doc.links.map((linkId) => {
              const target = documents.find((d) => d.id === linkId);
              return (
                <span
                  key={linkId}
                  onClick={() => unlinkDocuments(doc.id, linkId)}
                  className="cursor-pointer text-xs px-2 py-0.5 rounded bg-accent/20 text-accent hover:text-status-danger border border-accent/40"
                  title="Clique para desconectar"
                >
                  🔗 {target ? target.title : linkId} ×
                </span>
              );
            })}

            {availableDocsToLink.length > 0 && (
              <form onSubmit={handleLinkDoc} className="inline-flex gap-1">
                <select
                  value={targetLinkId}
                  onChange={(e) => setTargetLinkId(e.target.value)}
                  className="bg-bg-tertiary text-xs rounded border border-border-subtle px-1 py-0.5 text-text-primary focus:outline-none"
                >
                  <option value="">+ Conectar nota...</option>
                  {availableDocsToLink.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="secondary" disabled={!targetLinkId}>
                  Conectar
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>

      {/* Editor or Preview Mode */}
      <Card className="p-4 min-h-[400px]">
        {previewMode ? (
          <div className="prose prose-invert max-w-none text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
            {doc.content}
          </div>
        ) : (
          <Textarea
            rows={18}
            value={doc.content}
            onChange={(e) => updateDocument(doc.id, { content: e.target.value })}
            placeholder="Escreva conteúdo em Markdown, notas de sessão, regras ou descrições..."
            className="w-full h-full font-mono text-sm leading-relaxed"
          />
        )}
      </Card>
    </div>
  );
};
