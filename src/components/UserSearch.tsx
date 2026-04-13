import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  user_id: string;
  username: string | null;
  display_name: string | null;
  rank: string | null;
  level: number | null;
}

export function UserSearch({ collapsed }: { collapsed: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, rank, level')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8);
      setResults((data || []) as SearchResult[]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (collapsed) {
    return (
      <button
        onClick={() => {/* could expand sidebar */}}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full flex justify-center"
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative px-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 border border-border/50 focus-within:border-primary/50 transition-colors">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search users..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
          {results.map((r) => (
            <button
              key={r.user_id}
              onClick={() => {
                navigate(`/user/${r.user_id}`);
                setQuery('');
                setShowResults(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-cyber flex items-center justify-center text-xs font-bold text-primary-foreground font-mono shrink-0">
                {(r.username || 'U')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.display_name || r.username || 'Anonymous'}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{r.rank} · Lv.{r.level}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
