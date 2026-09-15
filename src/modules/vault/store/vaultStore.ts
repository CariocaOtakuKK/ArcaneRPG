import { create } from 'zustand';
import type { VaultDocument, VaultCategory, VaultGraphNode, VaultGraphEdge } from '@/types';
import { db, DEFAULT_VAULT_DOCS } from '@/core/db';
import { useAppStore } from '@/core/store/appStore';

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

  createDocument: (title: string, category: VaultCategory, campaignId?: string) => Promise<string>;
  updateDocument: (id: string, updates: Partial<VaultDocument>) => void;
  deleteDocument: (id: string) => Promise<void>;
  linkDocuments: (sourceId: string, targetId: string) => void;
  unlinkDocuments: (sourceId: string, targetId: string) => void;

  // Graph calculation helpers for Native SVG/Canvas (No React Flow)
  getGraphData: () => { nodes: VaultGraphNode[]; edges: VaultGraphEdge[] };
}

export const useVaultStore = create<VaultState>((set, get) => ({
  documents: DEFAULT_VAULT_DOCS,
  activeDocumentId: DEFAULT_VAULT_DOCS[0].id,
  searchQuery: '',
  selectedCategory: 'all',
  selectedTag: null,

  loadDocuments: async () => {
    try {
      const all = await db.vault.toArray();
      if (all.length > 0) {
        set({ documents: all });
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

  createDocument: async (title, category, campaignId) => {
    const newDoc: VaultDocument = {
      id: `vault-${Date.now()}`,
      campaignId,
      title,
      category,
      content: `# ${title}\n\nEscreva as notas ou detalhes aqui...`,
      tags: [],
      links: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.vault.add(newDoc);
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

    const updatedDoc: VaultDocument = {
      ...documents[docIndex],
      ...updates,
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

  getGraphData: () => {
    const { documents } = get();
    const count = documents.length;
    const radius = Math.max(160, count * 35);
    const centerX = 400;
    const centerY = 300;

    // Distribute nodes circularly or in concentric arcs
    const nodes: VaultGraphNode[] = documents.map((doc, i) => {
      const angle = (i / (count || 1)) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * (radius * 0.75 + (i % 2) * 50);
      const y = centerY + Math.sin(angle) * (radius * 0.75 + (i % 2) * 50);
      return {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        x,
        y,
      };
    });

    const edges: VaultGraphEdge[] = [];
    for (const doc of documents) {
      for (const targetId of doc.links) {
        if (documents.some((d) => d.id === targetId)) {
          edges.push({ source: doc.id, target: targetId });
        }
      }
    }

    return { nodes, edges };
  },
}));
