import McqChallenge from './McqChallenge';

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Props {
  challengeId: string;
  codeSnippet: string;
  options: Option[];
  isCompleted: boolean;
  onComplete: () => void;
}

export default function CodeAnalysisChallenge({ challengeId, codeSnippet, options, isCompleted, onComplete }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/80 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-cyber-orange/60" />
            <div className="w-3 h-3 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">vulnerable-code.js</span>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono text-foreground leading-relaxed">
          <code>{codeSnippet}</code>
        </pre>
      </div>

      <McqChallenge
        challengeId={challengeId}
        options={options}
        isCompleted={isCompleted}
        onComplete={onComplete}
      />
    </div>
  );
}
