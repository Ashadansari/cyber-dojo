import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Trophy, CheckCircle2, Lock, Lightbulb, Flag, Code, HelpCircle } from 'lucide-react';
import FlagChallenge from '@/components/challenges/FlagChallenge';
import McqChallenge from '@/components/challenges/McqChallenge';
import CodeAnalysisChallenge from '@/components/challenges/CodeAnalysisChallenge';
import { toast } from 'sonner';

interface Lab {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  tags: string[];
}

interface Challenge {
  id: string;
  lab_id: string;
  type: string;
  title: string;
  description: string;
  hint: string;
  order_index: number;
  points: number;
  flag_answer: string | null;
  options: { id: string; text: string; is_correct: boolean }[] | null;
  code_snippet: string | null;
}

const diffColor: Record<string, string> = {
  easy: 'bg-cyber-green/20 text-cyber-green',
  medium: 'bg-cyber-orange/20 text-cyber-orange',
  hard: 'bg-cyber-red/20 text-cyber-red',
};

const typeIcon: Record<string, typeof Flag> = {
  flag: Flag,
  mcq: HelpCircle,
  code_analysis: Code,
};

export default function LabDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lab, setLab] = useState<Lab | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('labs').select('*').eq('id', id).single(),
      supabase.from('lab_challenges').select('*').eq('lab_id', id).order('order_index'),
      user
        ? supabase.from('user_challenge_completions').select('challenge_id').eq('lab_id', id).eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]).then(([labRes, chalRes, compRes]) => {
      setLab(labRes.data as Lab);
      setChallenges((chalRes.data || []) as unknown as Challenge[]);
      setCompletedIds(new Set((compRes.data || []).map((c: any) => c.challenge_id)));
      setLoading(false);
      if (chalRes.data && chalRes.data.length > 0) {
        setActiveChallenge(chalRes.data[0].id);
      }
    });
  }, [id, user]);

  const handleChallengeComplete = async (challengeId: string, xp: number) => {
    if (!user || completedIds.has(challengeId)) return;

    const { error } = await supabase.from('user_challenge_completions').insert({
      user_id: user.id,
      challenge_id: challengeId,
      lab_id: id!,
    });

    if (!error) {
      setCompletedIds(prev => new Set([...prev, challengeId]));

      // Award XP via user_activity
      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: 'challenge_completed',
        description: `Completed challenge in ${lab?.title}`,
        xp_earned: xp,
      });

      // Update profile XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, completed_labs')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const allCompleted = challenges.every(c => completedIds.has(c.id) || c.id === challengeId);
        await supabase.from('profiles').update({
          xp: (profile.xp || 0) + xp,
          completed_labs: allCompleted ? (profile.completed_labs || 0) + 1 : profile.completed_labs,
        }).eq('user_id', user.id);
      }

      toast.success(`+${xp} XP earned!`, { description: 'Challenge completed!' });

      // Auto-advance to next challenge
      const currentIdx = challenges.findIndex(c => c.id === challengeId);
      if (currentIdx < challenges.length - 1) {
        setActiveChallenge(challenges[currentIdx + 1].id);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lab) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Lab not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/labs')}>Back to Labs</Button>
        </div>
      </DashboardLayout>
    );
  }

  const progress = challenges.length > 0 ? (completedIds.size / challenges.length) * 100 : 0;
  const totalXp = challenges.reduce((sum, c) => sum + c.points, 0);
  const earnedXp = challenges.filter(c => completedIds.has(c.id)).reduce((sum, c) => sum + c.points, 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/labs')} className="mt-1 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{lab.title}</h1>
              <Badge className={`${diffColor[lab.difficulty] || ''} border-0 text-xs font-mono capitalize`}>{lab.difficulty}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{lab.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="font-mono">{earnedXp}/{totalXp} XP</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-mono">{completedIds.size}/{challenges.length} Challenges</span>
              </div>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
          </div>
        </div>

        {challenges.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Challenges Coming Soon</h3>
            <p className="text-muted-foreground mt-1">This lab's challenges are being prepared.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Challenge sidebar */}
            <div className="space-y-2">
              {challenges.map((ch, i) => {
                const Icon = typeIcon[ch.type] || Flag;
                const isCompleted = completedIds.has(ch.id);
                const isActive = activeChallenge === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChallenge(ch.id)}
                    className={`w-full text-left rounded-lg p-3 transition-all border ${
                      isActive
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border/50 bg-card hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 ${
                        isCompleted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isCompleted ? 'text-primary' : 'text-foreground'}`}>
                          {i + 1}. {ch.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono capitalize">{ch.type.replace('_', ' ')} • {ch.points} XP</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active challenge */}
            <div>
              {challenges.filter(c => c.id === activeChallenge).map(ch => (
                <div key={ch.id} className="glass-card rounded-xl p-6 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs capitalize">{ch.type.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className="font-mono text-xs">{ch.points} XP</Badge>
                      {completedIds.has(ch.id) && (
                        <Badge className="bg-primary/20 text-primary border-0 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{ch.title}</h2>
                    <p className="text-muted-foreground mt-1">{ch.description}</p>
                  </div>

                  {ch.hint && (
                    <details className="group">
                      <summary className="flex items-center gap-2 text-sm text-accent cursor-pointer hover:underline">
                        <Lightbulb className="h-4 w-4" /> Show Hint
                      </summary>
                      <p className="mt-2 text-sm text-muted-foreground bg-accent/5 border border-accent/20 rounded-lg p-3 font-mono">
                        {ch.hint}
                      </p>
                    </details>
                  )}

                  {ch.type === 'flag' && (
                    <FlagChallenge
                      challengeId={ch.id}
                      correctFlag={ch.flag_answer!}
                      isCompleted={completedIds.has(ch.id)}
                      onComplete={() => handleChallengeComplete(ch.id, ch.points)}
                    />
                  )}

                  {ch.type === 'mcq' && (
                    <McqChallenge
                      challengeId={ch.id}
                      options={ch.options!}
                      isCompleted={completedIds.has(ch.id)}
                      onComplete={() => handleChallengeComplete(ch.id, ch.points)}
                    />
                  )}

                  {ch.type === 'code_analysis' && (
                    <CodeAnalysisChallenge
                      challengeId={ch.id}
                      codeSnippet={ch.code_snippet!}
                      options={ch.options!}
                      isCompleted={completedIds.has(ch.id)}
                      onComplete={() => handleChallengeComplete(ch.id, ch.points)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
