import { describe, it, expect } from 'vitest';
import {
  extractWikilinks,
  parseMarkdownWithFrontmatter,
  exportDocumentAsMarkdown,
  findUnlinkedMentions,
  convertMentionToWikilink,
} from '../utils/vaultUtils';
import type { VaultDocument } from '@/types';

describe('Vault Utilities & Obsidian Compatibility', () => {
  it('extracts unique wikilinks with or without alias', () => {
    const text = `
    O lorde de [[Castelo de Ravenloft]] observa [[Barovia|Vila de Barovia]].
    Mais tarde, ele retorna a [[Castelo de Ravenloft]] para descansar.
    `;
    const links = extractWikilinks(text);
    expect(links).toEqual(['Castelo de Ravenloft', 'Barovia']);
  });

  it('parses Obsidian markdown with YAML frontmatter', () => {
    const raw = `---
title: Fortaleza das Sombras
category: location
tags: [dungeon, perigo, magia]
---

# A Fortaleza
Este é um local antigo.
`;
    const parsed = parseMarkdownWithFrontmatter(raw);
    expect(parsed.title).toBe('Fortaleza das Sombras');
    expect(parsed.category).toBe('location');
    expect(parsed.tags).toEqual(['dungeon', 'perigo', 'magia']);
    expect(parsed.content.trim()).toBe('# A Fortaleza\nEste é um local antigo.');
  });

  it('exports VaultDocument to Obsidian compatible Markdown', () => {
    const doc: VaultDocument = {
      id: 'doc-1',
      title: 'Espada do Dragão',
      category: 'item',
      tags: ['lendário', 'fogo'],
      content: 'Uma lâmina forjada no sopro de um dragão vermelho.',
      links: [],
      createdAt: 1773532800000,
      updatedAt: 1773532800000,
    };

    const exported = exportDocumentAsMarkdown(doc);
    expect(exported).toContain('title: "Espada do Dragão"');
    expect(exported).toContain('category: item');
    expect(exported).toContain('tags: ["lendário", "fogo"]');
    expect(exported).toContain('Uma lâmina forjada no sopro');
  });

  it('finds unlinked mentions in other documents', () => {
    const targetDoc: VaultDocument = {
      id: 'doc-target',
      title: 'Strahd von Zarovich',
      category: 'npc',
      tags: [],
      content: 'O senhor supremo dos domínios do medo.',
      links: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const otherDoc1: VaultDocument = {
      id: 'doc-other-1',
      title: 'Vila de Barovia',
      category: 'location',
      tags: [],
      content: 'Os aldeões temem a ira de Strahd von Zarovich ao anoitecer.',
      links: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const otherDoc2: VaultDocument = {
      id: 'doc-other-2',
      title: 'Igreja Local',
      category: 'location',
      tags: [],
      content: 'O padre reza para se proteger de [[Strahd von Zarovich]].',
      links: ['doc-target'],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const mentions = findUnlinkedMentions(targetDoc, [targetDoc, otherDoc1, otherDoc2]);
    expect(mentions.length).toBe(1);
    expect(mentions[0].sourceDocId).toBe('doc-other-1');
    expect(mentions[0].sourceDocTitle).toBe('Vila de Barovia');
  });

  it('converts plain unlinked text mention to wikilink', () => {
    const content = 'Os aldeões temem Strahd von Zarovich hoje.';
    const converted = convertMentionToWikilink(content, 'Strahd von Zarovich');
    expect(converted).toBe('Os aldeões temem [[Strahd von Zarovich]] hoje.');
  });
});
