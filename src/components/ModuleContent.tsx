import React from 'react';

export default function ModuleContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';
  let inTable = false;
  let tableRows: string[][] = [];
  let listBuffer: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let key = 0;

  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.*?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={`b-${match.index}`} className="text-foreground font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(
          <code key={`c-${match.index}`} className="inline-code">{match[3]}</code>
        );
      } else if (match[4] && match[5]) {
        parts.push(
          <a key={`a-${match.index}`} href={match[5]} target="_blank" rel="noopener noreferrer"
            className="text-accent hover:text-primary underline underline-offset-2 transition-colors">{match[4]}</a>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return <>{parts}</>;
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag key={key++} className={`my-4 space-y-2 pl-2 ${listType === 'ol' ? 'list-none' : 'list-none'}`}>
        {listBuffer}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  const flushTable = () => {
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const body = tableRows.slice(2);
    elements.push(
      <div key={key++} className="overflow-x-auto my-6 rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {headers.map((h, i) => (
                <th key={i} className="text-left px-4 py-3 font-mono text-xs font-semibold text-primary uppercase tracking-wider">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 text-muted-foreground">{renderInline(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={key++} className="my-5 rounded-lg overflow-hidden border border-border bg-background">
            {codeLang && (
              <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
                <span className="text-xs font-mono text-primary uppercase tracking-wider">{codeLang}</span>
                <span className="text-xs font-mono text-muted-foreground">code</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono text-foreground leading-relaxed">{codeContent.trim()}</code>
            </pre>
          </div>
        );
        codeContent = '';
        codeLang = '';
        inCodeBlock = false;
      } else {
        flushList();
        if (inTable) flushTable();
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) { codeContent += line + '\n'; continue; }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      flushList();
      const cells = line.split('|').filter(c => c.trim() !== '' || false).map(c => c.trim()).filter(Boolean);
      if (!inTable) inTable = true;
      tableRows.push(cells);
      if (i + 1 >= lines.length || !lines[i + 1].includes('|')) flushTable();
      continue;
    }

    if (inTable) flushTable();

    // Headings
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-lg font-bold text-foreground mt-8 mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-accent inline-block" />
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-xl font-bold mt-10 mb-4 text-gradient-cyber flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-cyber inline-block" />
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={key++} className="text-2xl font-bold text-foreground mt-10 mb-4">{line.slice(2)}</h1>
      );
    }
    // Unordered list
    else if (line.match(/^- /)) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listBuffer.push(
        <li key={key++} className="flex items-start gap-3 text-muted-foreground">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed">{renderInline(line.slice(2))}</span>
        </li>
      );
    }
    // Ordered list
    else if (line.match(/^(\d+)\. /)) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      const num = line.match(/^(\d+)\./)?.[1];
      listBuffer.push(
        <li key={key++} className="flex items-start gap-3 text-muted-foreground">
          <span className="mt-0.5 w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center shrink-0">{num}</span>
          <span className="leading-relaxed">{renderInline(line.replace(/^\d+\. /, ''))}</span>
        </li>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={key++} className="my-4 pl-4 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg py-3 pr-4 text-muted-foreground italic">
          {renderInline(line.slice(2))}
        </blockquote>
      );
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      flushList();
      elements.push(<hr key={key++} className="my-6 border-border/50" />);
    }
    // Empty line
    else if (line.trim() === '') {
      flushList();
    }
    // Paragraph
    else {
      flushList();
      elements.push(
        <p key={key++} className="text-muted-foreground mb-4 leading-7">{renderInline(line)}</p>
      );
    }
  }

  flushList();
  if (inTable) flushTable();

  return <div className="module-content">{elements}</div>;
}
