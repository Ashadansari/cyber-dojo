import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Terminal, Bug, Crosshair, Zap, Users, Award, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const categories = [
  { icon: Terminal, title: 'Penetration Testing', desc: 'Master offensive security techniques', color: 'text-cyber-green' },
  { icon: Bug, title: 'Bug Bounty', desc: 'Find vulnerabilities in real targets', color: 'text-cyber-cyan' },
  { icon: Shield, title: 'Web Exploitation', desc: 'SQL injection, XSS, CSRF & more', color: 'text-cyber-purple' },
  { icon: Crosshair, title: 'Network Security', desc: 'Sniffing, scanning, and exploitation', color: 'text-cyber-red' },
  { icon: Zap, title: 'Reverse Engineering', desc: 'Analyze binaries and malware', color: 'text-cyber-orange' },
  { icon: Award, title: 'CTF Challenges', desc: 'Compete and sharpen your skills', color: 'text-cyber-yellow' },
];

const stats = [
  { value: '500+', label: 'Labs & Challenges' },
  { value: '50+', label: 'Learning Paths' },
  { value: '100K+', label: 'Active Hackers' },
  { value: '24/7', label: 'Live Environments' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-gradient-cyber font-mono">CyberForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/paths" className="text-sm text-muted-foreground hover:text-primary transition-colors">Learning Paths</Link>
            <Link to="/labs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Labs</Link>
            <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Leaderboard</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Log In</Link></Button>
            <Button variant="cyber" asChild><Link to="/signup">Join Free</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_72%_45%/0.08),transparent_60%)]" />
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-mono mb-8">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>
            Platform is live — Start hacking now
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="text-foreground">Learn to </span>
            <span className="text-gradient-cyber">Hack.</span>
            <br />
            <span className="text-foreground">Think like an </span>
            <span className="text-gradient-royal">Attacker.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Master cybersecurity through hands-on labs, real-world challenges, and guided learning paths. From beginner to expert.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="cyber" size="xl" asChild>
              <Link to="/signup">
                Start Hacking <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/paths">Explore Paths</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/30">
        <div className="container py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-gradient-cyber font-mono">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Every Domain. <span className="text-gradient-cyber">Covered.</span></h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">From web exploitation to reverse engineering — master every sector of cybersecurity.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.title} className="glass-card rounded-lg p-6 hover:border-primary/30 transition-all group cursor-pointer">
                <cat.icon className={`h-10 w-10 ${cat.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-lg font-semibold text-foreground mb-2">{cat.title}</h3>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container text-center">
          <div className="glass-card rounded-2xl p-12 max-w-3xl mx-auto shadow-glow">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Ready to start your <span className="text-gradient-cyber">journey</span>?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of hackers learning and growing on CyberForge.</p>
            <Button variant="cyber" size="xl" asChild>
              <Link to="/signup">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <span className="font-mono font-bold text-gradient-cyber">CyberForge</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Contact Us</h4>
              <a href="mailto:webashad12@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors block">webashad12@gmail.com</a>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Phone</h4>
              <a href="tel:+919162592334" className="text-sm text-muted-foreground hover:text-primary transition-colors block">+91 9162592334</a>
              <a href="tel:+9779829336233" className="text-sm text-muted-foreground hover:text-primary transition-colors block">+977 9829336233</a>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">© 2026 CyberForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
