import React from 'react';

export default function ModuleContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let inTable = false;
  let tableRows: string[][] = [];
  let key = 0;

  const renderInline = (text: string) => {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>');
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const flushTable = () => {
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const body = tableRows.slice(2);
    elements.push(
      <div key={key++} className="overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h, i) => (
                <th key={i} className="text-left p-2 font-mono text-primary text-xs uppercase">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="border-b border-border/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-2 text-muted-foreground">{renderInline(cell.trim())}</td>
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

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={key++} className="bg-background rounded-lg p-4 my-4 overflow-x-auto border border-border">
            <code className="text-sm font-mono text-foreground">{codeContent.trim()}</code>
          </pre>
        );
        codeContent = '';
        inCodeBlock = false;
      } else {
        if (inTable) flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) { codeContent += line + '\n'; continue; }

    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim() !== '' || false).map(c => c.trim()).filter(Boolean);
      if (!inTable) inTable = true;
      tableRows.push(cells);
      if (i + 1 >= lines.length || !lines[i + 1].includes('|')) flushTable();
      continue;
    }

    if (inTable) flushTable();

    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-lg font-bold text-foreground mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-xl font-bold text-foreground mt-8 mb-3 text-gradient-cyber">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-2xl font-bold text-foreground mt-8 mb-3">{line.slice(2)}</h1>);
    } else if (line.match(/^- \*\*/) || line.startsWith('- ')) {
      elements.push(<li key={key++} className="text-muted-foreground ml-4 mb-1 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={key++} className="text-muted-foreground ml-4 mb-1 list-decimal">{renderInline(line.replace(/^\d+\. /, ''))}</li>);
    } else if (line.trim() === '') {
      // skip
    } else {
      elements.push(<p key={key++} className="text-muted-foreground mb-3 leading-relaxed">{renderInline(line)}</p>);
    }
  }

  if (inTable) flushTable();
  return <div>{elements}</div>;
}
