import React from 'react';
import { useVaultStore } from '../store/vaultStore';
import { ExternalLink, PlusCircle } from 'lucide-react';

interface VaultMarkdownRendererProps {
  content: string;
}

export const VaultMarkdownRenderer: React.FC<VaultMarkdownRendererProps> = ({ content }) => {
  const documents = useVaultStore((state) => state.documents);
  const selectDocument = useVaultStore((state) => state.selectDocument);
  const createDocument = useVaultStore((state) => state.createDocument);

  // Helper to render inline tokens including [[wikilinks]], **bold**, *italic*, `code`
  const renderInline = (text: string, keyPrefix: string): React.ReactNode => {
    // Match [[wikilink]], `code`, **bold**, *italic*
    const parts: React.ReactNode[] = [];
    const regex = /(\[\[[^\n\]]+\]\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }

      const raw = match[0];

      if (raw.startsWith('[[') && raw.endsWith(']]')) {
        const inner = raw.slice(2, -2).trim();
        const [targetTitle, alias] = inner.split('|').map((s) => s.trim());
        const displayLabel = alias || targetTitle;

        const targetDoc = documents.find(
          (d) => d.title.trim().toLowerCase() === targetTitle.toLowerCase()
        );

        if (targetDoc) {
          parts.push(
            <button
              key={`${keyPrefix}-link-${matchIndex}`}
              type="button"
              onClick={() => selectDocument(targetDoc.id)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 border border-accent/40 transition-colors cursor-pointer"
              title={`Ir para ${targetDoc.title} (${targetDoc.category})`}
            >
              <span>{displayLabel}</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </button>
          );
        } else {
          // Unresolved ghost link: allow creating it on click!
          parts.push(
            <button
              key={`${keyPrefix}-ghost-${matchIndex}`}
              type="button"
              onClick={() => {
                if (
                  confirm(`A nota "${targetTitle}" ainda não existe. Deseja criá-la agora no Vault?`)
                ) {
                  createDocument(targetTitle, 'lore');
                }
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-muted hover:text-accent border border-dashed border-border-default hover:border-accent transition-colors cursor-pointer"
              title={`Criar nova nota: "${targetTitle}"`}
            >
              <span>{displayLabel}</span>
              <PlusCircle className="w-3 h-3 text-status-warning" />
            </button>
          );
        }
      } else if (raw.startsWith('`') && raw.endsWith('`')) {
        parts.push(
          <code
            key={`${keyPrefix}-code-${matchIndex}`}
            className="px-1.5 py-0.5 bg-bg-tertiary text-accent font-mono text-xs rounded border border-border-subtle"
          >
            {raw.slice(1, -1)}
          </code>
        );
      } else if (raw.startsWith('**') && raw.endsWith('**')) {
        parts.push(
          <strong key={`${keyPrefix}-bold-${matchIndex}`} className="font-bold text-text-primary">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith('*') && raw.endsWith('*')) {
        parts.push(
          <em key={`${keyPrefix}-em-${matchIndex}`} className="italic text-text-secondary">
            {raw.slice(1, -1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`codeblock-${i}`}
            className="p-3 my-2 rounded bg-bg-primary text-text-secondary font-mono text-xs border border-border-default overflow-x-auto"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-2xl font-bold text-text-primary mt-6 mb-3 border-b border-border-subtle pb-2"
        >
          {renderInline(line.slice(2), `h1-${i}`)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg font-bold text-text-primary mt-4 mb-2 flex items-center gap-2"
        >
          {renderInline(line.slice(3), `h2-${i}`)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-sm font-semibold text-text-primary mt-3 mb-1 uppercase tracking-wider text-accent"
        >
          {renderInline(line.slice(4), `h3-${i}`)}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="pl-3 border-l-2 border-accent text-text-secondary italic my-2 bg-bg-secondary/40 py-1 rounded-r"
        >
          {renderInline(line.slice(2), `quote-${i}`)}
        </blockquote>
      );
    } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      const checked = line.startsWith('- [x] ');
      const checkText = line.slice(6);
      elements.push(
        <div key={`check-${i}`} className="flex items-center gap-2 py-0.5 text-xs">
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="rounded border-border-default text-accent focus:ring-0"
          />
          <span className={checked ? 'line-through text-text-muted' : 'text-text-primary'}>
            {renderInline(checkText, `check-${i}`)}
          </span>
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={`li-${i}`} className="ml-5 list-disc text-xs text-text-secondary py-0.5">
          {renderInline(line.slice(2), `li-${i}`)}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.)\s(.*)$/);
      elements.push(
        <div key={`ol-${i}`} className="ml-5 text-xs text-text-secondary py-0.5 flex gap-1.5">
          <span className="font-semibold text-accent">{match?.[1]}</span>
          <span>{renderInline(match?.[2] || '', `ol-${i}`)}</span>
        </div>
      );
    } else if (line.trim() === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-border-subtle" />);
    } else if (line.trim() === '') {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-xs leading-relaxed text-text-secondary my-1">
          {renderInline(line, `p-${i}`)}
        </p>
      );
    }
  }

  return <div className="space-y-1 select-text">{elements}</div>;
};
