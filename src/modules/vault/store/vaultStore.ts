import { create } from 'zustand';
import type { VaultDocument, VaultCategory, VaultGraphNode, VaultGraphEdge } from '@/types';
import { db, DEFAULT_VAULT_DOCS } from '@/core/db';
import { useAppStore } from '@/core/store/appStore';
import {
  extractWikilinks,
  parseMarkdownWithFrontmatter,
  convertMentionToWikilink,
} from '../utils/vaultUtils';

interface VaultState {
  documents: VaultDocument[];
  activeDocumentId: string | null;
  searchQuery: string;
  selectedCategory: VaultCategory | 'all';
  selectedTag: string | null;

  loadDocuments: () => Promise<void>;
  selectDocument: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: VaultCategory | 'all') => void;
  setSelectedTag: (tag: string | null) => void;

  createDocument: (
    title: string,
    category: VaultCategory,
    initialContent?: string,
    campaignId?: string
  ) => Promise<string>;
  updateDocument: (id: string, updates: Partial<VaultDocument>) => void;
  deleteDocument: (id: string) => Promise<void>;
  linkDocuments: (sourceId: string, targetId: string) => void;
  unlinkDocuments: (sourceId: string, targetId: string) => void;
  convertMention: (sourceDocId: string, targetTitle: string) => void;
  importMarkdownDoc: (rawMarkdown: string) => Promise<string>;

  // Graph calculation helpers for Native SVG/Canvas (No React Flow)
  getGraphData: () => { nodes: VaultGraphNode[]; edges: VaultGraphEdge[] };
}

export const useVaultStore = create<VaultState>((set, get) => ({
  documents: DEFAULT_VAULT_DOCS,
  activeDocumentId: DEFAULT_VAULT_DOCS[0]?.id || null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedTag: null,

  loadDocuments: async () => {
    try {
      const all = await db.vault.toArray();
      if (all.length > 0) {
        set({
          documents: all,
          activeDocumentId: get().activeDocumentId || all[0].id,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar vault';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Vault',
        message: msg,
      });
    }
  },

  selectDocument: (id) => set({ activeDocumentId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),

  createDocument: async (title, category, initialContent, campaignId) => {
    const newDoc: VaultDocument = {
      id: `vault-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      campaignId,
      title,
      category,
      content: initialContent || `# ${title}\n\nEscreva as notas ou detalhes aqui...`,
      tags: [],
      links: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Auto-resolve any wikilinks in initial content
    const wikilinkTitles = extractWikilinks(newDoc.content);
    const existing = get().documents;
    for (const linkTitle of wikilinkTitles) {
      const target = existing.find(
        (d) => d.title.trim().toLowerCase() === linkTitle.toLowerCase()
      );
      if (target && !newDoc.links.includes(target.id)) {
        newDoc.links.push(target.id);
      }
    }

    try {
      await db.vault.add(newDoc);
    } catch (err) {
      console.warn('Dexie add failed:', err);
    }

    set((state) => ({
      documents: [newDoc, ...state.documents],
      activeDocumentId: newDoc.id,
    }));

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Nota Criada',
      message: `Documento "${title}" adicionado ao Vault.`,
    });

    return newDoc.id;
  },

  updateDocument: (id, updates) => {
    const { documents } = get();
    const docIndex = documents.findIndex((d) => d.id === id);
    if (docIndex === -1) return;

    const currentDoc = documents[docIndex];
    let links = updates.links !== undefined ? updates.links : [...currentDoc.links];

    // If content was updated, extract wikilinks and auto-sync links
    if (updates.content !== undefined) {
      const wikilinkTitles = extractWikilinks(updates.content);
      const autoLinkIds: string[] = [];
      for (const linkTitle of wikilinkTitles) {
        const target = documents.find(
          (d) => d.id !== id && d.title.trim().toLowerCase() === linkTitle.toLowerCase()
        );
        if (target) {
          autoLinkIds.push(target.id);
        }
      }

      // Merge explicit links and wikilink targets
      for (const targetId of autoLinkIds) {
        if (!links.includes(targetId)) {
          links.push(targetId);
        }
      }
    }

    const updatedDoc: VaultDocument = {
      ...currentDoc,
      ...updates,
      links,
      updatedAt: Date.now(),
    };

    const newDocs = [...documents];
    newDocs[docIndex] = updatedDoc;
    set({ documents: newDocs });

    db.vault.put(updatedDoc).catch(console.error);
  },

  deleteDocument: async (id) => {
    try {
      await db.vault.delete(id);
      set((state) => {
        const nextList = state.documents.filter((d) => d.id !== id);
        return {
          documents: nextList,
          activeDocumentId: nextList.length > 0 ? nextList[0].id : null,
        };
      });
      useAppStore.getState().addToast({
        type: 'info',
        title: 'Documento Deletado',
        message: 'A anotação foi removida do Vault.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao deletar documento';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Erro no Vault',
        message: msg,
      });
    }
  },

  linkDocuments: (sourceId, targetId) => {
    if (sourceId === targetId) return;
    const { documents } = get();
    const sourceDoc = documents.find((d) => d.id === sourceId);
    if (!sourceDoc || sourceDoc.links.includes(targetId)) return;

    get().updateDocument(sourceId, {
      links: [...sourceDoc.links, targetId],
    });
  },

  unlinkDocuments: (sourceId, targetId) => {
    const { documents } = get();
    const sourceDoc = documents.find((d) => d.id === sourceId);
    if (!sourceDoc) return;

    get().updateDocument(sourceId, {
      links: sourceDoc.links.filter((l) => l !== targetId),
    });
  },

  convertMention: (sourceDocId, targetTitle) => {
    const { documents, updateDocument } = get();
    const source = documents.find((d) => d.id === sourceDocId);
    if (!source) return;

    const newContent = convertMentionToWikilink(source.content, targetTitle);
    updateDocument(sourceDocId, { content: newContent });

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Menção Convertida',
      message: `"${targetTitle}" agora é um wikilink em "${source.title}".`,
    });
  },

  importMarkdownDoc: async (rawMarkdown) => {
    const parsed = parseMarkdownWithFrontmatter(rawMarkdown);
    const title = parsed.title || 'Documento Importado';
    const category = parsed.category || 'lore';
    const docId = await get().createDocument(title, category, parsed.content);

    if (parsed.tags && parsed.tags.length > 0) {
      get().updateDocument(docId, { tags: parsed.tags });
    }

    return docId;
  },

  getGraphData: () => {
    const { documents } = get();
    const count = documents.length;
    const radius = Math.max(180, count * 36);
    const centerX = 450;
    const centerY = 350;

    // Distribute nodes circularly with organic jitter
    const nodes: VaultGraphNode[] = documents.map((doc, i) => {
      const angle = (i / (count || 1)) * 2 * Math.PI;
      const dist = radius * 0.75 + ((i * 37) % 70);
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      return {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        x,
        y,
      };
    });

    const edges: VaultGraphEdge[] = [];
    const edgeKeySet = new Set<string>();

    for (const doc of documents) {
      for (const targetId of doc.links) {
        if (documents.some((d) => d.id === targetId)) {
          const key = [doc.id, targetId].sort().join('---');
          if (!edgeKeySet.has(key)) {
            edgeKeySet.add(key);
            edges.push({ source: doc.id, target: targetId });
          }
        }
      }
    }

    return { nodes, edges };
  },
}));
