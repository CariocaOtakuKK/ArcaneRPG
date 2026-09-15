import type { VaultDocument, VaultCategory } from '@/types';

/**
 * Extracts wikilink targets from markdown text: [[Target]] or [[Target|Alias]]
 */
export function extractWikilinks(text: string): string[] {
  if (!text) return [];
  const regex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const rawTarget = m[1].trim();
    if (rawTarget && !matches.includes(rawTarget)) {
      matches.push(rawTarget);
    }
  }
  return matches;
}

/**
 * Parses markdown text containing optional Obsidian-style YAML frontmatter
 */
export function parseMarkdownWithFrontmatter(raw: string): {
  frontmatter: Record<string, string | number | boolean | string[]>;
  content: string;
  title?: string;
  category?: VaultCategory;
  tags?: string[];
} {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, content: raw };
  }

  const endIdx = trimmed.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { frontmatter: {}, content: raw };
  }

  const fmBlock = trimmed.slice(4, endIdx);
  const content = trimmed.slice(endIdx + 4).replace(/^\r?\n/, '');

  const frontmatter: Record<string, string | number | boolean | string[]> = {};
  const lines = fmBlock.split('\n');

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    let val = line.slice(colonIdx + 1).trim();

    if (!val) continue;

    // Handle YAML arrays [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      const items = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      frontmatter[key] = items;
    } else {
      // Remove quotes
      val = val.replace(/^["']|["']$/g, '');
      if (val === 'true') frontmatter[key] = true;
      else if (val === 'false') frontmatter[key] = false;
      else if (!isNaN(Number(val)) && val !== '') frontmatter[key] = Number(val);
      else frontmatter[key] = val;
    }
  }

  const title = typeof frontmatter.title === 'string' ? frontmatter.title : undefined;
  const category = (
    typeof frontmatter.category === 'string' &&
    ['lore', 'npc', 'location', 'item', 'rule', 'quest', 'session'].includes(frontmatter.category)
      ? frontmatter.category
      : undefined
  ) as VaultCategory | undefined;

  let tags: string[] | undefined;
  if (Array.isArray(frontmatter.tags)) {
    tags = frontmatter.tags.map(String);
  } else if (typeof frontmatter.tags === 'string') {
    tags = frontmatter.tags.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return { frontmatter, content, title, category, tags };
}

/**
 * Serializes a VaultDocument into standard Obsidian Markdown with YAML frontmatter
 */
export function exportDocumentAsMarkdown(doc: VaultDocument): string {
  const tagsStr = doc.tags.length > 0 ? `[${doc.tags.map((t) => `"${t}"`).join(', ')}]` : '[]';
  const frontmatter = [
    '---',
    `title: "${doc.title.replace(/"/g, '\\"')}"`,
    `category: ${doc.category}`,
    `tags: ${tagsStr}`,
    `createdAt: ${new Date(doc.createdAt).toISOString()}`,
    `updatedAt: ${new Date(doc.updatedAt).toISOString()}`,
    '---',
    '',
    doc.content,
  ].join('\n');

  return frontmatter;
}

export interface UnlinkedMention {
  sourceDocId: string;
  sourceDocTitle: string;
  snippet: string;
}

/**
 * Scans other documents for occurrences of activeDoc.title that are NOT already in [[...]]
 */
export function findUnlinkedMentions(
  activeDoc: VaultDocument,
  allDocs: VaultDocument[]
): UnlinkedMention[] {
  if (!activeDoc.title || activeDoc.title.trim().length < 3) return [];
  const targetTitle = activeDoc.title.trim();
  const lowerTitle = targetTitle.toLowerCase();
  const results: UnlinkedMention[] = [];

  for (const doc of allDocs) {
    if (doc.id === activeDoc.id) continue;

    // Check if doc references activeDoc in explicit links
    // If not, inspect text
    const text = doc.content;
    const lowerText = text.toLowerCase();

    let searchStart = 0;
    while (searchStart < lowerText.length) {
      const matchIdx = lowerText.indexOf(lowerTitle, searchStart);
      if (matchIdx === -1) break;

      // Check if it's already wrapped in [[ ... ]]
      const before = text.slice(Math.max(0, matchIdx - 2), matchIdx);
      const after = text.slice(
        matchIdx + lowerTitle.length,
        matchIdx + lowerTitle.length + 2
      );

      const isInsideBrackets = before === '[[' || after === ']]';

      if (!isInsideBrackets) {
        // Extract a snippet (approx 30 chars before and 30 chars after)
        const start = Math.max(0, matchIdx - 35);
        const end = Math.min(text.length, matchIdx + lowerTitle.length + 35);
        let snippet = text.slice(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        results.push({
          sourceDocId: doc.id,
          sourceDocTitle: doc.title,
          snippet,
        });
        break; // One snippet per document is sufficient
      }

      searchStart = matchIdx + lowerTitle.length;
    }
  }

  return results;
}

/**
 * Replaces plain occurrences of targetTitle with [[targetTitle]] in content
 */
export function convertMentionToWikilink(content: string, targetTitle: string): string {
  // Replace case-insensitively when not preceded by [[ and followed by ]]
  const escaped = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?<!\\[\\[)(${escaped})(?!\\]\\])`, 'gi');
  return content.replace(regex, `[[$1]]`);
}

/**
 * Worldbuilding and RPG Campaign Templates
 */
export interface VaultTemplate {
  id: string;
  label: string;
  category: VaultCategory;
  defaultTitle: string;
  content: string;
}

export const VAULT_TEMPLATES: VaultTemplate[] = [
  {
    id: 'npc',
    label: 'Personagem do Mestre (PNJ)',
    category: 'npc',
    defaultTitle: 'Novo PNJ',
    content: `## 🎭 Identidade & Conceito
- **Ocupação / Papel:** 
- **Facção / Lealdade:** 
- **Localização Habitual:** 

## 👁️ Aparência & Modos
- **Físico e Vestimentas:** 
- **Tique / Maneirismo Marcante:** 
- **Voz / Tom:** 

## 💡 Motivações & Segredos
- **Objetivo Imediato:** 
- **Segredo Obscuro:** 
- **O que precisa dos Jogadores:** 

## 🔗 Conexões
- Aliado de: 
- Rival de: 
`,
  },
  {
    id: 'location',
    label: 'Localidade ou Masmorra',
    category: 'location',
    defaultTitle: 'Nova Localidade',
    content: `## 🗺️ Visão Geral & Atmosfera
- **Tipo:** (Cidade, Masmorra, Ermos, Ruínas)
- **Clima / Sensações:** (Sons, cheiros, iluminação)
- **Governante / Ocupante Atual:** 

## ⚠️ Perigos & Encontros
1. **Armadilha / Risco Ambiental:** 
2. **Patrulha Inimiga:** 

## 💎 Pontos de Interesse & Tesouros
- **Ponto Chave 1:** 
- **Ponto Chave 2:** 
- **Tesouro / Recompensa Escondida:** 
`,
  },
  {
    id: 'faction',
    label: 'Facção / Organização',
    category: 'lore',
    defaultTitle: 'Nova Facção',
    content: `## ⚔️ A Organização
- **Símbolo / Brasão:** 
- **Lema:** 
- **Líder Atual:** 

## 🎯 Planos & Conflitos
- **Objetivo Público:** 
- **Agenda Oculta:** 
- **Aliados:** 
- **Inimigos Declarados:** 

## 🏰 Recursos & Força Militar
- **Base Operacional:** 
- **Número de Membros:** 
`,
  },
  {
    id: 'magic_item',
    label: 'Item Mágico ou Artefato',
    category: 'item',
    defaultTitle: 'Novo Item',
    content: `## 🗡️ Descrição & Raridade
- **Tipo de Item:** 
- **Raridade:** (Comum, Raro, Lendário, Artefato)
- **Sintonização / Requisito:** 

## ✨ Propriedades & Habilidades
- **Efeito Passivo:** 
- **Poder Ativo (Cargas):** 
- **Maldição / Preço a Pagar:** 

## 📜 História & Lenda
- **Criador:** 
- **Último Portador Conhecido:** 
`,
  },
  {
    id: 'session_notes',
    label: 'Anotações de Sessão',
    category: 'session',
    defaultTitle: 'Sessão 00',
    content: `## 📅 Dados da Sessão
- **Data do Jogo:** 
- **Personagens Presentes:** 
- **Local no Início:** 

## 📜 Resumo dos Acontecimentos
1. 
2. 
3. 

## 💰 Recompensas & XP
- **XP Distribuído:** 
- **Tesouros Conquistados:** 

## 🪝 Ganchos para a Próxima Sessão
- [ ] 
- [ ] 
`,
  },
];
