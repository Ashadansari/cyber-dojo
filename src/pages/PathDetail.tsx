import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  xp_reward: number;
}

interface PathInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
}

export default function PathDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [path, setPath] = useState<PathInfo | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('learning_paths').select('*').eq('id', id).single(),
      supabase.from('modules').select('*').eq('learning_path_id', id).order('order_index'),
    ]).then(([pathRes, modulesRes]) => {
      setPath(pathRes.data);
      setModules(modulesRes.data || []);
      setLoading(false);
    });
  }, [id]);

  // Load progress
  useEffect(() => {
    if (!user || !id) return;
    supabase.from('user_path_progress').select('completed_modules').eq('user_id', user.id).eq('learning_path_id', id).single()
      .then(({ data }) => {
        if (data) {
          const completed = new Set<number>();
          for (let i = 0; i < data.completed_modules; i++) completed.add(i);
          setCompletedModules(completed);
        }
      });
  }, [user, id]);

  const markComplete = async () => {
    if (!user || !id) return;
    const newCompleted = new Set(completedModules);
    newCompleted.add(activeModule);
    setCompletedModules(newCompleted);

    await supabase.from('user_path_progress').upsert({
      user_id: user.id,
      learning_path_id: id,
      completed_modules: newCompleted.size,
      completed_at: newCompleted.size === modules.length ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,learning_path_id' });

    if (activeModule < modules.length - 1) {
      setActiveModule(activeModule + 1);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!path || modules.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Path not found or has no modules yet.</p>
          <Button variant="outline" asChild className="mt-4"><Link to="/paths">Back to Paths</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentModule = modules[activeModule];
  const progress = modules.length > 0 ? (completedModules.size / modules.length) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/paths"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{path.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground font-mono">{completedModules.size}/{modules.length} modules</span>
              <div className="flex-1 max-w-xs h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-cyber rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm text-primary font-mono">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Sidebar - Module List */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="glass-card rounded-xl p-4 sticky top-20">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">Modules</h3>
              <div className="space-y-1">
                {modules.map((mod, i) => (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(i)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-all",
                      i === activeModule
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {completedModules.has(i) ? (
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 opacity-40" />
                    )}
                    <span className="truncate">{mod.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="glass-card rounded-xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{currentModule.title}</h2>
                  <p className="text-sm text-muted-foreground">{currentModule.description}</p>
                </div>
                <span className="ml-auto text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                  +{currentModule.xp_reward} XP
                </span>
              </div>

              {/* Markdown-like content rendering */}
              <div className="prose-cyber">
                <ModuleContent content={currentModule.content || ''} />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setActiveModule(Math.max(0, activeModule - 1))}
                  disabled={activeModule === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>

                {completedModules.has(activeModule) ? (
                  <span className="text-sm text-primary font-mono flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Completed
                  </span>
                ) : (
                  <Button variant="cyber" onClick={markComplete}>
                    Mark Complete & Continue
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setActiveModule(Math.min(modules.length - 1, activeModule + 1))}
                  disabled={activeModule === modules.length - 1}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ModuleContent({ content }: { content: string }) {
  // Simple markdown-like renderer
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';
  let inTable = false;
  let tableRows: string[][] = [];
  let key = 0;

  const renderInline = (text: string) => {
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>');
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const flushTable = () => {
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const body = tableRows.slice(2); // skip separator row
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

    // Code blocks
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
        codeLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim() !== '' || false).map(c => c.trim()).filter(Boolean);
      if (!inTable) inTable = true;
      tableRows.push(cells);
      // Check if next line is not a table
      if (i + 1 >= lines.length || !lines[i + 1].includes('|')) {
        flushTable();
      }
      continue;
    }

    if (inTable) flushTable();

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-lg font-bold text-foreground mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-xl font-bold text-foreground mt-8 mb-3 text-gradient-cyber">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-2xl font-bold text-foreground mt-8 mb-3">{line.slice(2)}</h1>);
    }
    // List items
    else if (line.match(/^- \*\*/)) {
      elements.push(<li key={key++} className="text-muted-foreground ml-4 mb-1 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key++} className="text-muted-foreground ml-4 mb-1 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={key++} className="text-muted-foreground ml-4 mb-1 list-decimal">{renderInline(line.replace(/^\d+\. /, ''))}</li>);
    }
    // Empty line
    else if (line.trim() === '') {
      // skip
    }
    // Paragraph
    else {
      elements.push(<p key={key++} className="text-muted-foreground mb-3 leading-relaxed">{renderInline(line)}</p>);
    }
  }

  if (inTable) flushTable();

  return <div>{elements}</div>;
}
