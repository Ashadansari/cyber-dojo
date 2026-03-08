import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Send } from 'lucide-react';

interface Props {
  challengeId: string;
  correctFlag: string;
  isCompleted: boolean;
  onComplete: () => void;
}

export default function FlagChallenge({ correctFlag, isCompleted, onComplete }: Props) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = () => {
    if (!input.trim() || isCompleted) return;
    setAttempts(a => a + 1);
    if (input.trim() === correctFlag) {
      setStatus('correct');
      onComplete();
    } else {
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-primary font-mono">Flag accepted! Challenge complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter flag (e.g., CTF{...})"
          className="font-mono bg-muted/50 border-border"
        />
        <Button onClick={handleSubmit} disabled={!input.trim()} className="gap-1.5 shrink-0">
          <Send className="h-4 w-4" /> Submit
        </Button>
      </div>
      {status === 'wrong' && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4" /> Incorrect flag. Try again. ({attempts} attempts)
        </div>
      )}
      {status === 'correct' && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Correct! 🎉
        </div>
      )}
      {attempts > 0 && status === 'idle' && (
        <p className="text-xs text-muted-foreground">{attempts} attempt{attempts > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
