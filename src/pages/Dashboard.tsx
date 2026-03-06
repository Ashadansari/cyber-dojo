import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Shield, Zap, Target, Award, Flame, TrendingUp, Loader2, BookOpen, FlaskConical, CheckCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildHeatmapData() {
  // Build a full year: from Jan 1 of current year to today
  const today = new Date();
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  
  // Adjust start to nearest Monday before Jan 1 (ISO week style: Mon=0)
  const jan1Dow = jan1.getDay(); // 0=Sun
  const isoDay = jan1Dow === 0 ? 6 : jan1Dow - 1; // Convert to Mon=0 format
  const startDate = new Date(jan1);
  startDate.setDate(jan1.getDate() - isoDay);

  const days: { date: string; dow: number; weekIdx: number }[] = [];
  const current = new Date(startDate);
  let weekIdx = 0;

  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0];
    const jsDay = current.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1; // Mon=0, Sun=6
    days.push({ date: dateStr, dow, weekIdx });
    
    current.setDate(current.getDate() + 1);
    if (current.getDay() === 1 && current <= today) weekIdx++; // new week on Monday
  }

  // Extract month labels positioned at first Monday of each month
  const months: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  days.forEach((d) => {
    const m = new Date(d.date).getMonth();
    if (m !== lastMonth && d.dow === 0) { // dow 0 = Monday
      months.push({ label: MONTH_NAMES[m], weekIdx: d.weekIdx });
      lastMonth = m;
    }
  });

  return { days, months, totalWeeks: weekIdx + 1 };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paths, setPaths] = useState<PathProgress[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const heatmap = useMemo(() => buildHeatmapData(), []);

  const rebuildMap = useCallback((acts: Activity[]) => {
    const map = new Map<string, number>();
    acts.forEach((a) => {
      const day = new Date(a.created_at).toISOString().split('T')[0];
      map.set(day, (map.get(day) || 0) + 1);
    });
    setActivityMap(map);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('xp, level, rank, streak_days, completed_labs, badges_earned').eq('user_id', user.id).single(),
      supabase.from('user_path_progress').select('completed_modules, learning_path:learning_paths(id, title, total_modules)').eq('user_id', user.id),
      supabase.from('user_activity').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]).then(([profileRes, pathsRes, activityRes]) => {
      if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
      if (pathsRes.data) setPaths(pathsRes.data as unknown as PathProgress[]);
      const actData = (activityRes.data || []) as Activity[];
      setActivities(actData);
      rebuildMap(actData);
      setLoading(false);
    });
  }, [user, rebuildMap]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_activity',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newAct = payload.new as Activity;
          setActivities((prev) => {
            const updated = [newAct, ...prev].slice(0, 50);
            rebuildMap(updated);
            return updated;
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        setProfile({
          xp: updated.xp ?? 0,
          level: updated.level ?? 1,
          rank: updated.rank ?? 'Script Kiddie',
          streak_days: updated.streak_days ?? 0,
          completed_labs: updated.completed_labs ?? 0,
          badges_earned: updated.badges_earned ?? 0,
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, rebuildMap]);

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

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    if (count === 1) return 'bg-primary/25';
    if (count <= 3) return 'bg-primary/50';
    if (count <= 6) return 'bg-primary/75';
    return 'bg-primary';
  };

  const totalActivities = activities.length;

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

  // Build grid columns for GitHub-style layout
  const columns: { date: string; dow: number }[][] = [];
  heatmap.days.forEach((d) => {
    if (!columns[d.weekIdx]) columns[d.weekIdx] = [];
    columns[d.weekIdx].push(d);
  });

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

        {/* GitHub-style Activity Heatmap */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-[hsl(var(--cyber-orange))]" />
              {totalActivities} contributions in {new Date().getFullYear()}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-[3px] bg-muted/50" />
              <div className="w-2.5 h-2.5 rounded-[3px] bg-primary/25" />
              <div className="w-2.5 h-2.5 rounded-[3px] bg-primary/50" />
              <div className="w-2.5 h-2.5 rounded-[3px] bg-primary/75" />
              <div className="w-2.5 h-2.5 rounded-[3px] bg-primary" />
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <TooltipProvider delayDuration={100}>
              <div className="inline-flex gap-[3px]">
                <div className="flex flex-col gap-[3px] mr-2 pt-0">
                  {DAY_LABELS.map((label, i) => (
                    <div key={label} className="h-[13px] flex items-center justify-end">
                      {i % 2 === 0 ? (
                        <span className="text-[10px] text-muted-foreground font-mono leading-none">{label}</span>
                      ) : <span className="text-[10px] invisible font-mono leading-none">Mon</span>}
                    </div>
                  ))}
                </div>
                {/* Weeks */}
                {columns.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }, (_, dow) => {
                      const cell = week.find((d) => d.dow === dow);
                      if (!cell) return <div key={dow} className="w-[13px] h-[13px]" />;
                      const count = activityMap.get(cell.date) || 0;
                      return (
                        <Tooltip key={dow}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-[13px] h-[13px] rounded-[3px] ${getHeatColor(count)} transition-colors hover:ring-1 hover:ring-foreground/20 cursor-default`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-mono bg-popover border-border">
                            <strong>{count} {count === 1 ? 'contribution' : 'contributions'}</strong> on {new Date(cell.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>

            {/* Month labels */}
            <div className="relative h-4 ml-[38px]" style={{ width: `${heatmap.totalWeeks * 16}px` }}>
              {heatmap.months.map((m, i) => (
                <span
                  key={i}
                  className="absolute text-[10px] text-muted-foreground font-mono"
                  style={{ left: `${m.weekIdx * 16}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
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

          {/* Recent Activity Feed - Realtime */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Recent Activity
              <span className="ml-auto flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">Live</span>
              </span>
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
      </div>
    </DashboardLayout>
  );
}
