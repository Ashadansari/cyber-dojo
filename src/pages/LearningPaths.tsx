import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Terminal, Shield, Bug, Globe, Network, Lock, Server, Cpu, Loader2 } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  Terminal, Shield, Bug, Globe, Network, Lock, Server, Cpu,
};

const colorMap: Record<string, string> = {
  Fundamentals: 'text-cyber-green',
  'Web Security': 'text-cyber-cyan',
  'Bug Bounty': 'text-cyber-purple',
  Network: 'text-cyber-red',
  Pentesting: 'text-cyber-orange',
  Cryptography: 'text-cyber-yellow',
  RE: 'text-cyber-red',
  Cloud: 'text-cyber-cyan',
};

const difficultyColor: Record<string, string> = {
  beginner: 'bg-cyber-green/20 text-cyber-green',
  intermediate: 'bg-cyber-cyan/20 text-cyber-cyan',
  advanced: 'bg-cyber-red/20 text-cyber-red',
};

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  icon: string;
  total_modules: number;
  estimated_hours: number;
}

export default function LearningPaths() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('learning_paths').select('*').then(({ data }) => {
      setPaths(data || []);
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
          <h1 className="text-3xl font-bold text-foreground">Learning <span className="text-gradient-cyber">Paths</span></h1>
          <p className="text-muted-foreground mt-1">Structured courses to master cybersecurity</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {paths.map((path) => {
            const Icon = iconMap[path.icon || ''] || Terminal;
            const color = colorMap[path.category] || 'text-primary';
            return (
              <Link key={path.id} to={`/paths/${path.id}`} className="block">
                <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-4">
                    <Icon className={`h-8 w-8 ${color} group-hover:scale-110 transition-transform`} />
                    <Badge className={`${difficultyColor[path.difficulty] || ''} border-0 text-xs font-mono capitalize`}>
                      {path.difficulty}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{path.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{path.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                    <span>{path.total_modules} modules</span>
                    <span>~{path.estimated_hours}h</span>
                    <span className="text-primary/60">{path.category}</span>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-cyber rounded-full w-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
