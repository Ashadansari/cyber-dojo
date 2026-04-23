import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the current user's display name from the profiles table.
 * Subscribes to realtime updates so changes from Settings are reflected immediately.
 */
export function useProfileName() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDisplayName('');
      setUsername('');
      setAvatarUrl(null);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setDisplayName(data.display_name || '');
      setUsername(data.username || '');
      setAvatarUrl(data.avatar_url || null);
    };

    fetchProfile();

    const channel = supabase
      .channel(`profile-name-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { display_name?: string | null; username?: string | null; avatar_url?: string | null };
          setDisplayName(row.display_name || '');
          setUsername(row.username || '');
          setAvatarUrl(row.avatar_url || null);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const name = displayName || username || (user?.user_metadata?.username as string) || 'Hacker';
  return { name, displayName, username, avatarUrl };
}
