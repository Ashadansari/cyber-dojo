import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Shield, Zap, Target, Award, Flame, Calendar, Loader2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

interface Profile {
  username: string | null;
  display_name: string | null;
  xp: number;
  level: number;
  rank: string;
  streak_days: number;
  completed_labs: number;
  badges_earned: number;
  created_at: string;
  bio: string | null;
}

interface PathProgress {
  completed_modules: number;
  learning_path: {
    id: string;
    title: string;
    total_modules: number;
    category: string;
    difficulty: string;
  };
}

const LEVEL_XP = [0, 0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pathProgress, setPathProgress] = useState<PathProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_path_progress').select('completed_modules, learning_path:learning_paths(id, title, total_modules, category, difficulty)').eq('user_id', user.id),
    ]).then(([profileRes, progressRes]) => {
      if (profileRes.data) {
        setProfile(profileRes.data as unknown as Profile);
      }
      if (progressRes.data) {
        setPathProgress(progressRes.data as unknown as PathProgress[]);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const p = profile || { username: 'Hacker', display_name: 'Hacker', xp: 0, level: 1, rank: 'Script Kiddie', streak_days: 0, completed_labs: 0, badges_earned: 0, created_at: user?.created_at || '', bio: null };
  const currentLevelXp = LEVEL_XP[p.level] || 0;
  const nextLevelXp = LEVEL_XP[p.level + 1] || LEVEL_XP[LEVEL_XP.length - 1];
  const xpProgress = nextLevelXp > currentLevelXp ? ((p.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100 : 100;

  const stats = [
    { icon: Zap, label: 'Total XP', value: p.xp.toLocaleString(), color: 'text-cyber-cyan' },
    { icon: Target, label: 'Labs Done', value: String(p.completed_labs), color: 'text-cyber-purple' },
    { icon: Flame, label: 'Streak', value: `${p.streak_days} days`, color: 'text-cyber-orange' },
    { icon: Award, label: 'Badges', value: String(p.badges_earned), color: 'text-cyber-yellow' },
    { icon: Shield, label: 'Rank', value: p.rank, color: 'text-cyber-green' },
    { icon: Calendar, label: 'Joined', value: p.created_at ? new Date(p.created_at).toLocaleDateString() : '—', color: 'text-cyber-red' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="glass-card rounded-xl p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-cyber flex items-center justify-center text-3xl font-bold text-primary-foreground font-mono">
              {(p.username || 'H')[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground font-mono">{p.display_name || p.username}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <p className="text-primary text-sm font-mono mt-1">{p.rank} · Level {p.level}</p>
              {/* XP Progress to next level */}
              <div className="mt-3 max-w-xs">
                <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
                  <span>Level {p.level}</span>
                  <span>{p.xp} / {nextLevelXp} XP</span>
                  <span>Level {Math.min(p.level + 1, 10)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-cyber rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-lg p-4 text-center">
              <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
              <div className="text-lg font-bold text-foreground font-mono">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Learning Path Progress */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Learning Path Progress
          </h2>
          {pathProgress.length === 0 ? (
            <p className="text-muted-foreground text-sm">No paths started yet. <Link to="/paths" className="text-primary hover:underline">Browse learning paths</Link></p>
          ) : (
            <div className="space-y-4">
              {pathProgress.map((pp) => {
                const total = pp.learning_path?.total_modules || 1;
                const completed = pp.completed_modules || 0;
                const pct = Math.round((completed / total) * 100);
                return (
                  <Link
                    key={pp.learning_path?.id}
                    to={`/paths/${pp.learning_path?.id}`}
                    className="block p-4 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{pp.learning_path?.title}</h3>
                        <span className="text-xs text-muted-foreground font-mono">{completed}/{total} modules · {pp.learning_path?.difficulty}</span>
                      </div>
                      <span className="text-sm font-mono text-primary">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-cyber rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Badges</h2>
          <p className="text-muted-foreground text-sm">Complete labs and learning paths to earn badges.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
