import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModuleContent from '@/components/ModuleContent';

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
  total_modules: number;
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

    const currentModule = modules[activeModule];
    const xpEarned = currentModule?.xp_reward || 10;

    // Update path progress using actual module count
    await supabase.from('user_path_progress').upsert({
      user_id: user.id,
      learning_path_id: id,
      completed_modules: newCompleted.size,
      completed_at: newCompleted.size === modules.length ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,learning_path_id' });

    // Award XP to profile
    const { data: profileData } = await supabase.from('profiles').select('xp').eq('user_id', user.id).single();
    const currentXp = profileData?.xp || 0;
    await supabase.from('profiles').update({ xp: currentXp + xpEarned }).eq('user_id', user.id);

    // Log activity
    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: 'module_complete',
      description: `Completed "${currentModule?.title}" in ${path?.title}`,
      xp_earned: xpEarned,
    });

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
  // Use actual modules.length for progress calculation
  const progress = (completedModules.size / modules.length) * 100;

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
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="glass-card rounded-xl p-4 sticky top-20 max-h-[70vh] overflow-y-auto">
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
                  <Button onClick={markComplete} className="bg-gradient-cyber text-primary-foreground hover:opacity-90">
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
