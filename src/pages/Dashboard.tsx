import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Shield, Zap, Target, Award, Flame, TrendingUp, Loader2 } from 'lucide-react';

interface Profile {
  xp: number;
  level: number;
  rank: string;
  streak_days: number;
  completed_labs: number;
  badges_earned: number;
}

interface PathProgress {
  completed_modules: number;
  learning_path: {
    id: string;
    title: string;
    total_modules: number;
  };
}

interface ActivityDay {
  date: string;
  count: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paths, setPaths] = useState<PathProgress[]>([]);
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from('profiles').select('xp, level, rank, streak_days, completed_labs, badges_earned').eq('user_id', user.id).single(),
      supabase.from('user_path_progress').select('completed_modules, learning_path:learning_paths(id, title, total_modules)').eq('user_id', user.id),
      supabase.from('user_activity').select('created_at').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 49 * 86400000).toISOString()),
    ]).then(([profileRes, pathsRes, activityRes]) => {
      if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
      if (pathsRes.data) setPaths(pathsRes.data as unknown as PathProgress[]);
      
      // Build activity heatmap
      const map = new Map<string, number>();
      (activityRes.data || []).forEach((a: any) => {
        const day = new Date(a.created_at).toISOString().split('T')[0];
        map.set(day, (map.get(day) || 0) + 1);
      });
      setActivityMap(map);
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

  const p = profile || { xp: 0, level: 1, rank: 'Script Kiddie', streak_days: 0, completed_labs: 0, badges_earned: 0 };

  const statCards = [
    { icon: Shield, label: 'Level', value: String(p.level), color: 'text-cyber-green', bg: 'bg-cyber-green/10' },
    { icon: Zap, label: 'Total XP', value: p.xp.toLocaleString(), color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
    { icon: Target, label: 'Labs Completed', value: String(p.completed_labs), color: 'text-cyber-purple', bg: 'bg-cyber-purple/10' },
    { icon: Flame, label: 'Day Streak', value: String(p.streak_days), color: 'text-cyber-orange', bg: 'bg-cyber-orange/10' },
    { icon: Award, label: 'Badges', value: String(p.badges_earned), color: 'text-cyber-yellow', bg: 'bg-cyber-yellow/10' },
    { icon: TrendingUp, label: 'Rank', value: p.rank, color: 'text-cyber-red', bg: 'bg-cyber-red/10' },
  ];

  // Generate last 49 days for heatmap
  const heatmapDays: string[] = [];
  for (let i = 48; i >= 0; i--) {
    heatmapDays.push(new Date(Date.now() - i * 86400000).toISOString().split('T')[0]);
  }

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/20';
    if (count <= 3) return 'bg-primary/40';
    return 'bg-primary/70';
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, <span className="text-gradient-cyber">{user?.user_metadata?.username || 'Hacker'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Continue your cybersecurity training</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card rounded-lg p-4 text-center">
              <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold text-foreground font-mono">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Active Learning Paths */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            {paths.length > 0 ? 'Your Learning Paths' : 'Recommended Paths'}
          </h2>
          {paths.length > 0 ? (
            <div className="space-y-4">
              {paths.map((pp) => {
                const total = pp.learning_path?.total_modules || 1;
                const completed = pp.completed_modules || 0;
                const pct = total > 0 ? (completed / total) * 100 : 0;
                return (
                  <Link
                    key={pp.learning_path?.id}
                    to={`/paths/${pp.learning_path?.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border hover:border-primary/20 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-foreground">{pp.learning_path?.title}</h3>
                      <p className="text-sm text-muted-foreground">{completed}/{total} modules</p>
                    </div>
                    <div className="w-32">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-gradient-cyber rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Start a <Link to="/paths" className="text-primary hover:underline">learning path</Link> to track your progress here.
            </p>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Activity</h2>
          <div className="grid grid-cols-7 gap-1">
            {heatmapDays.map((day) => (
              <div
                key={day}
                title={`${day}: ${activityMap.get(day) || 0} activities`}
                className={`aspect-square rounded-sm ${getHeatColor(activityMap.get(day) || 0)} transition-colors`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-mono">Last 7 weeks</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
