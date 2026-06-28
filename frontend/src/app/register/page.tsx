'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Cpu, Eye, EyeOff, Loader2, Lock, Mail, User, Building } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const roles = [
  { value: 'INSPECTOR', label: 'Inspector', desc: 'Perform inspections and upload images' },
  { value: 'SUPERVISOR', label: 'Supervisor', desc: 'Review and override AI recommendations' },
  { value: 'ADMIN', label: 'Admin', desc: 'Full platform access and user management' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'INSPECTOR', department: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authApi.register(form);
      await login(form.email, form.password);
      toast.success('Account created! Welcome to AutoInspect AI.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-900)', padding: 24 }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 1000, gap: 48, alignItems: 'flex-start' }}>
        {/* Left Info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ flex: 1, paddingTop: 40 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0066CC, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={22} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800 }}>AutoInspect AI</span>
          </Link>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Join the future of<br /><span className="gradient-text">automotive inspection</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
            Create your account and start leveraging AI-powered inspection analysis today.
          </p>

          <div className="glass-card" style={{ padding: 20, marginTop: 32 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Available Roles</p>
            {roles.map(r => (
              <div key={r.value} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                <span className={`badge badge-${r.value.toLowerCase()}`} style={{ flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ flex: '0 0 420px', padding: '36px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Create Account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Fill in your details to get started</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input" style={{ paddingLeft: 36 }} placeholder="Sarah Mitchell"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="input" style={{ paddingLeft: 36 }} placeholder="you@company.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Department</label>
              <div style={{ position: 'relative' }}>
                <Building size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input" style={{ paddingLeft: 36 }} placeholder="Quality Control"
                  value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Role</label>
              <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPw ? 'text' : 'password'} className="input" style={{ paddingLeft: 36, paddingRight: 40 }} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? <Loader2 size={16} className="animate-spin-slow" /> : null}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
