'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Cpu, Shield, FileText, Zap, BarChart3, ArrowRight,
  CheckCircle, Star, ChevronRight, Activity, Eye, Brain
} from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Damage Detection', desc: 'Multi-defect detection with bounding boxes and confidence scoring powered by computer vision.', color: '#0066CC' },
  { icon: FileText, title: 'Inspection Reports', desc: 'Professional PDF reports with digital signatures, QR codes, and audit trails.', color: '#00D4FF' },
  { icon: Zap, title: 'OEM Negotiation', desc: 'AI-powered negotiation assistant with liability attribution and talking points.', color: '#00E676' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Real-time dashboards with supplier comparison, damage trends, and KPI tracking.', color: '#FFB300' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Granular permissions for Admins, Supervisors, and Inspectors with audit logging.', color: '#BB86FC' },
  { icon: Activity, title: 'Risk Scoring', desc: 'Business impact prediction with cost estimator and warranty impact analysis.', color: '#FF4B6B' },
];

const steps = [
  { num: '01', title: 'Select Part', desc: 'Enter part number, OEM, supplier, and return reason from the structured intake form.' },
  { num: '02', title: 'Capture Images', desc: 'Upload multiple high-resolution photos via drag-and-drop, camera, or file picker.' },
  { num: '03', title: 'AI Analysis', desc: 'AI engine scans images, detects defects, calculates severity, and generates recommendations.' },
  { num: '04', title: 'Report & Negotiate', desc: 'Download PDF report, view negotiation talking points, and close the case.' },
];

const stats = [
  { value: '98.7%', label: 'AI Accuracy' },
  { value: '14min', label: 'Avg Inspection Time' },
  { value: '$2.4M', label: 'Cost Savings/Year' },
  { value: '50+', label: 'OEM Partners' },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-900)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="36" height="32" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,46 64.4,21 50,0 35.6,21" fill="#E60012" />
            <polygon points="46.5,50 17.7,50 3.3,75 32.1,75" fill="#E60012" />
            <polygon points="53.5,50 67.9,75 96.7,75 82.3,50" fill="#E60012" />
          </svg>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>MITSUBISHI</div>
            <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>ELECTRIC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" style={{ fontSize: 14, color: '#4B5563', fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
          <Link href="/register" className="btn-primary">Get Started <ArrowRight size={14} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-bg" style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Animated background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'linear-gradient(rgba(0,102,204,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,204,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,204,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: 'rgba(0, 102, 204, 0.1)',
              border: '1px solid rgba(0, 102, 204, 0.25)',
              marginBottom: 32, fontSize: 12, fontWeight: 600,
              color: 'var(--primary-light)', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 8px var(--success)' }} />
            Enterprise AI Platform — v1.0 Now Available
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}
          >
            AI-Powered{' '}
            <span className="gradient-text">Automotive Parts</span>
            <br />Inspection Platform
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px' }}
          >
            Reduce return disputes by 85%. AI-powered defect detection, OEM negotiation assistance,
            and real-time analytics for Fortune 500 automotive manufacturers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/register" className="btn-primary" style={{ fontSize: 16, padding: '14px 28px' }}>
              Start Inspection <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
              View Dashboard <Eye size={16} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero visual — animated dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 20 }}
          transition={{ delay: 0.7, duration: 1 }}
          style={{ maxWidth: 900, margin: '60px auto 0', padding: '0 24px', position: 'relative', zIndex: 1 }}
          className="animate-float"
        >
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(0,102,204,0.3)' }}>
            {/* Window chrome */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF4B6B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFB300' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E676' }} />
              <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Mitsubishi Electric — AI Inspection Dashboard
              </div>
            </div>
            {/* Mock dashboard content */}
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: "Today's Inspections", value: '12', icon: '📋', color: '#0066CC', trend: '+3' },
                { label: 'Accepted', value: '8', icon: '✅', color: '#00E676', trend: '+2' },
                { label: 'Rejected', value: '3', icon: '❌', color: '#FF4B6B', trend: '+1' },
                { label: 'AI Confidence', value: '94%', icon: '🧠', color: '#00D4FF', trend: '+2%' },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 12, padding: '14px',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 4 }}>↑ {card.trend} today</div>
                </motion.div>
              ))}
            </div>
            {/* Animated chart placeholder */}
            <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', height: 120, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inspection Trend — 30 Days</div>
                <svg width="100%" height="70" style={{ position: 'absolute', bottom: 16, left: 0 }}>
                  <polyline points="0,60 40,45 80,50 120,30 160,35 200,20 240,25 280,15 320,10 360,18 400,8" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" />
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066CC" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0066CC" stopOpacity="0" />
                  </linearGradient>
                  <polygon points="0,70 0,60 40,45 80,50 120,30 160,35 200,20 240,25 280,15 320,10 360,18 400,8 400,70" fill="url(#lineGrad)" />
                </svg>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', height: 120 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                {[{ label: 'Accepted', pct: 64, color: '#00E676' }, { label: 'Rejected', pct: 24, color: '#FF4B6B' }, { label: 'Review', pct: 12, color: '#FFB300' }].map((s, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 9, color: 'var(--text-muted)' }}>
                      <span>{s.label}</span><span>{s.pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div className="progress-fill" style={{ background: s.color }} initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 1.2 + i * 0.1, duration: 1 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 48px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              style={{ textAlign: 'center' }}
            >
              <div className="gradient-text-blue" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Everything you need to <span className="gradient-text">inspect smarter</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
              A complete enterprise platform designed for automotive quality control teams.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  className="glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  style={{ padding: 28 }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${f.color}20`,
                    border: `1px solid ${f.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <Icon size={22} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              How the <span className="gradient-text">Mitsubishi Electric</span> AI System works
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', top: 28, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, var(--primary), var(--accent))', opacity: 0.3, zIndex: 0 }} />
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 24px rgba(0,102,204,0.4)',
                  fontSize: 16, fontWeight: 800, color: 'white',
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <motion.div
          className="glass-card-blue"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ maxWidth: 800, margin: '0 auto', padding: '60px 48px' }}
        >
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Ready to transform your<br /><span className="gradient-text">inspection process?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 36 }}>
            Trusted by leading automotive OEM manufacturers. Built to Mitsubishi Electric's precision engineering standards.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/register" className="btn-primary" style={{ fontSize: 16, padding: '14px 28px' }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
              Sign In <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {['No credit card required', 'SOC2 Compliant', 'GDPR Ready', '99.9% Uptime SLA'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} style={{ color: 'var(--success)' }} /> {t}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="24" height="21" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,46 64.4,21 50,0 35.6,21" fill="#E60012" />
            <polygon points="46.5,50 17.7,50 3.3,75 32.1,75" fill="#E60012" />
            <polygon points="53.5,50 67.9,75 96.7,75 82.3,50" fill="#E60012" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mitsubishi Electric</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          © 2024 Mitsubishi Electric. Quality Inspection &amp; Automotive Components Division.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'API Docs', 'Support'].map(l => (
            <a key={l} href="#" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
