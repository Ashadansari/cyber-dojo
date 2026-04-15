import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Loader2, Users, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface FollowUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rank: string | null;
  level: number | null;
}

export default function FollowList() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'followers';
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      // Get profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('user_id', userId)
        .single();

      if (profile) setProfileName(profile.display_name || profile.username || 'User');

      let userIds: string[] = [];

      if (tab === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);
        userIds = (data || []).map(f => f.follower_id);
      } else {
        const { data } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        userIds = (data || []).map(f => f.following_id);
      }

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, rank, level')
          .in('user_id', userIds);
        setUsers((profiles || []) as FollowUser[]);
      } else {
        setUsers([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId, tab]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to={`/user/${userId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">{profileName}</h1>
            <div className="flex gap-4 mt-1">
              <Link
                to={`/user/${userId}/connections?tab=followers`}
                className={`text-sm font-medium ${tab === 'followers' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Followers
              </Link>
              <Link
                to={`/user/${userId}/connections?tab=following`}
                className={`text-sm font-medium ${tab === 'following' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Following
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {tab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <Link
                key={u.user_id}
                to={`/user/${u.user_id}`}
                className="glass-card rounded-lg p-4 flex items-center gap-4 hover:border-primary/30 transition-colors block"
              >
                <Avatar className="h-12 w-12">
                  {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.display_name || u.username || ''} />}
                  <AvatarFallback className="bg-gradient-cyber text-primary-foreground font-mono font-bold">
                    {(u.username || u.display_name || 'U')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground font-mono truncate">
                    {u.display_name || u.username || 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {u.rank} · Level {u.level}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
