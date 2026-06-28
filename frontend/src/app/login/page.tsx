'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Cpu, Eye, EyeOff, Loader2, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@autoinspect.ai', password: 'Admin@123', color: '#BB86FC' },
  { role: 'Supervisor', email: 'supervisor@autoinspect.ai', password: 'Supervisor@123', color: '#00D4FF' },
  { role: 'Inspector', email: 'inspector@autoinspect.ai', password: 'Inspector@123', color: '#00E676' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-900)',
    }}>
      {/* Left Panel */}
      <div style={{
        flex: '0 0 50%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a0d13 0%, #0f1420 50%, #0a1628 100%)',
        padding: '48px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'linear-gradient(rgba(0,102,204,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,204,0.8) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '-50px', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,204,0.12) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 60 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0066CC, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,102,204,0.5)' }}>
              <Cpu size={22} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>AutoInspect AI</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'white', marginBottom: 16 }}>
              Enterprise AI<br />Inspection Platform
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
              Used by quality control teams in Fortune 500 automotive manufacturers worldwide.
            </p>
          </motion.div>

          {/* Feature points */}
          {[
            { icon: '🧠', text: 'AI defect detection with 98.7% accuracy' },
            { icon: '📋', text: 'Professional PDF reports with QR codes' },
            { icon: '💬', text: 'OEM negotiation assistant & talking points' },
            { icon: '📊', text: 'Real-time analytics and supplier comparison' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{f.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Demo Accounts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Demo Accounts</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.role} onClick={() => fillDemo(acc)}
                style={{
                  flex: 1, padding: '8px 12px',
                  background: `${acc.color}15`,
                  border: `1px solid ${acc.color}30`,
                  borderRadius: 10, cursor: 'pointer',
                  color: acc.color, fontSize: 12, fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {acc.role}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 36 }}>Sign in to your AutoInspect account</p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input" style={{ paddingLeft: 38 }}
                  placeholder="you@autoinspect.ai" autoComplete="email" />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input" style={{ paddingLeft: 38, paddingRight: 40 }}
                  placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="login-btn" type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}>
              {loading ? <Loader2 size={18} className="animate-spin-slow" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '28px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: 'rgba(0,102,204,0.06)', borderRadius: 12, border: '1px solid rgba(0,102,204,0.15)', marginBottom: 24 }}>
            <Shield size={16} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Click a demo account button on the left to auto-fill credentials.</span>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
