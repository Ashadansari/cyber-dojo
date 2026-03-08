import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Props {
  challengeId: string;
  options: Option[];
  isCompleted: boolean;
  onComplete: () => void;
}

export default function McqChallenge({ options, isCompleted, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const handleSelect = (optionId: string) => {
    if (isCompleted || status === 'correct') return;
    setSelected(optionId);
    const option = options.find(o => o.id === optionId);
    if (option?.is_correct) {
      setStatus('correct');
      onComplete();
    } else {
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <div className="space-y-2">
      {options.map(opt => {
        const isSelected = selected === opt.id;
        const showCorrect = (isCompleted || status === 'correct') && opt.is_correct;
        const showWrong = isSelected && status === 'wrong';

        return (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            disabled={isCompleted || status === 'correct'}
            className={`w-full text-left rounded-lg p-3.5 border transition-all flex items-center gap-3 ${
              showCorrect
                ? 'border-primary/50 bg-primary/10 text-primary'
                : showWrong
                ? 'border-destructive/50 bg-destructive/10 text-destructive'
                : isCompleted
                ? 'border-border/30 bg-muted/30 text-muted-foreground cursor-default'
                : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 text-foreground cursor-pointer'
            }`}
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted/80 text-xs font-mono font-bold shrink-0 uppercase">
              {opt.id}
            </span>
            <span className="text-sm flex-1">{opt.text}</span>
            {showCorrect && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
            {showWrong && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
