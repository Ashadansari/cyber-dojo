import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Terminal, Eye, EyeOff, Shield, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Contains number', pass: /\d/.test(password) },
    { label: 'Passwords match', pass: confirmPassword.length > 0 && password === confirmPassword },
  ], [password, confirmPassword]);

  const allValid = passwordChecks.every(c => c.pass) && username.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast({ title: 'Check requirements', description: 'Please meet all the password requirements.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, username);
      toast({ title: 'Account created!', description: 'Check your email to verify your account before signing in.' });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Signup failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(142_72%_45%/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(185_70%_45%/0.08),transparent_60%)]" />
        <div className="absolute inset-0 border-r border-border" />
        
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 max-w-md px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Terminal className="h-8 w-8 text-primary" />
            </div>
            <span className="text-3xl font-bold text-gradient-cyber font-mono">CyberForge</span>
          </div>
          <h2 className="text-4xl font-bold text-foreground leading-tight mb-4">
            Begin your <span className="text-gradient-cyber">hacking</span> journey
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Join thousands of aspiring security professionals. Learn, practice, and prove your skills.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '500+', label: 'Labs' },
              { value: '50+', label: 'Paths' },
              { value: '100K+', label: 'Hackers' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gradient-cyber font-mono">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <Terminal className="h-7 w-7 text-primary" />
              <span className="text-2xl font-bold text-gradient-cyber font-mono">CyberForge</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-1">Start your cybersecurity training today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="l33t_hacker"
                className="h-11 bg-card border-border focus:border-primary/50 focus:ring-primary/20"
                required
                minLength={3}
              />
              {username.length > 0 && username.length < 3 && (
                <p className="text-xs text-destructive">Username must be at least 3 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 bg-card border-border focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 bg-card border-border focus:border-primary/50 focus:ring-primary/20 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-card border-border focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="p-3 rounded-lg bg-card/60 border border-border space-y-1.5">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    {check.pass ? (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={check.pass ? 'text-primary' : 'text-muted-foreground'}>{check.label}</span>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-cyber text-primary-foreground font-semibold shadow-neon hover:shadow-glow transition-all"
              disabled={loading || !allValid}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Secured with end-to-end encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
