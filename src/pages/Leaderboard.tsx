import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  display_name: string | null;
  xp: number;
  level: number;
  rank: string;
  completed_labs: number;
}

const rankIcon = (position: number) => {
  if (position === 1) return <Trophy className="h-5 w-5 text-cyber-yellow" />;
  if (position === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (position === 3) return <Award className="h-5 w-5 text-cyber-orange" />;
  return <span className="text-sm font-mono text-muted-foreground w-5 text-center">{position}</span>;
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('user_id, username, display_name, xp, level, rank, completed_labs')
      .order('xp', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEntries((data || []) as LeaderboardEntry[]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leader<span className="text-gradient-cyber">board</span></h1>
          <p className="text-muted-foreground mt-1">Top hackers on CyberForge</p>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider w-16">Rank</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">Hacker</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Title</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">Level</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">XP</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Labs</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const position = i + 1;
                const isCurrentUser = user?.id === entry.user_id;
                return (
                  <tr
                    key={entry.user_id}
                    className={`border-b border-border/50 transition-colors ${
                      isCurrentUser ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="p-4">{rankIcon(position)}</td>
                    <td className="p-4">
                      <Link
                        to={`/user/${entry.user_id}`}
                        className={`font-mono font-medium hover:underline ${isCurrentUser ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                      >
                        {entry.display_name || entry.username || 'Anonymous'}
                      </Link>
                      {isCurrentUser && <span className="ml-2 text-xs text-primary">(you)</span>}
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-accent hidden sm:table-cell">{entry.rank}</td>
                    <td className="p-4 text-right font-mono text-sm text-cyber-cyan">{entry.level}</td>
                    <td className="p-4 text-right font-mono text-sm text-primary">{(entry.xp || 0).toLocaleString()}</td>
                    <td className="p-4 text-right font-mono text-sm text-muted-foreground hidden sm:table-cell">{entry.completed_labs || 0}</td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No users yet. Be the first!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
