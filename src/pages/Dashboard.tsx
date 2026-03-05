import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Shield, Zap, Target, Award, Flame, TrendingUp, Loader2, BookOpen, FlaskConical, CheckCircle, Clock } from 'lucide-react';

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

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  xp_earned: number;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paths, setPaths] = useState<PathProgress[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from('profiles').select('xp, level, rank, streak_days, completed_labs, badges_earned').eq('user_id', user.id).single(),
      supabase.from('user_path_progress').select('completed_modules, learning_path:learning_paths(id, title, total_modules)').eq('user_id', user.id),
      supabase.from('user_activity').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]).then(([profileRes, pathsRes, activityRes]) => {
      if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
      if (pathsRes.data) setPaths(pathsRes.data as unknown as PathProgress[]);
      
      const actData = (activityRes.data || []) as Activity[];
      setActivities(actData);

      // Build activity heatmap
      const map = new Map<string, number>();
      actData.forEach((a) => {
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
    { icon: Shield, label: 'Level', value: String(p.level), color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Zap, label: 'Total XP', value: p.xp.toLocaleString(), color: 'text-accent', bg: 'bg-accent/10' },
    { icon: Target, label: 'Labs Done', value: String(p.completed_labs), color: 'text-[hsl(var(--cyber-purple))]', bg: 'bg-[hsl(var(--cyber-purple))]/10' },
    { icon: Flame, label: 'Streak', value: `${p.streak_days}d`, color: 'text-[hsl(var(--cyber-orange))]', bg: 'bg-[hsl(var(--cyber-orange))]/10' },
    { icon: Award, label: 'Badges', value: String(p.badges_earned), color: 'text-[hsl(var(--cyber-yellow))]', bg: 'bg-[hsl(var(--cyber-yellow))]/10' },
    { icon: TrendingUp, label: 'Rank', value: p.rank, color: 'text-destructive', bg: 'bg-destructive/10' },
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'module_complete': return <BookOpen className="h-4 w-4 text-primary" />;
      case 'lab_complete': return <FlaskConical className="h-4 w-4 text-accent" />;
      case 'path_complete': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <Zap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Learning Paths */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {paths.length > 0 ? 'Your Learning Paths' : 'Get Started'}
            </h2>
            {paths.length > 0 ? (
              <div className="space-y-3">
                {paths.map((pp) => {
                  const total = pp.learning_path?.total_modules || 1;
                  const completed = pp.completed_modules || 0;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link
                      key={pp.learning_path?.id}
                      to={`/paths/${pp.learning_path?.id}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-all group"
                    >
                      <div className="min-w-0 flex-1 mr-4">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{pp.learning_path?.title}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{completed}/{total} modules • {pct}%</p>
                      </div>
                      <div className="w-24 shrink-0">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-gradient-cyber rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">No paths started yet</p>
                <Link to="/paths">
                  <Button variant="outline" size="sm">Explore Learning Paths</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Recent Activity
            </h2>
            {activities.length > 0 ? (
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {activities.slice(0, 10).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 shrink-0">{getActivityIcon(act.activity_type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground leading-snug truncate">{act.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(act.created_at)}</span>
                        {act.xp_earned > 0 && (
                          <span className="text-xs text-primary font-mono">+{act.xp_earned} XP</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Complete modules and labs to see activity here</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Activity Heatmap</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmapDays.map((day) => (
              <div
                key={day}
                title={`${day}: ${activityMap.get(day) || 0} activities`}
                className={`aspect-square rounded-sm ${getHeatColor(activityMap.get(day) || 0)} transition-colors hover:ring-1 hover:ring-primary/30`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground font-mono">Last 7 weeks</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              <div className="w-3 h-3 rounded-sm bg-primary/70" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
