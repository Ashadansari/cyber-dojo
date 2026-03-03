import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Play, Loader2 } from 'lucide-react';

interface Lab {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  tags: string[];
}

const diffColor: Record<string, string> = {
  easy: 'bg-cyber-green/20 text-cyber-green',
  medium: 'bg-cyber-orange/20 text-cyber-orange',
  hard: 'bg-cyber-red/20 text-cyber-red',
};

export default function Labs() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('labs').select('*').eq('is_active', true).then(({ data }) => {
      setLabs(data || []);
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
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Labs & <span className="text-gradient-cyber">Challenges</span></h1>
          <p className="text-muted-foreground mt-1">Hands-on hacking environments</p>
        </div>

        <div className="space-y-3">
          {labs.map((lab) => (
            <div key={lab.id} className="glass-card rounded-lg p-4 flex items-center justify-between hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                  {lab.points}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">{lab.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{lab.category}</span>
                    {(lab.tags || []).map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge className={`${diffColor[lab.difficulty] || ''} border-0 text-xs font-mono capitalize`}>{lab.difficulty}</Badge>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Play className="h-3.5 w-3.5" /> Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
