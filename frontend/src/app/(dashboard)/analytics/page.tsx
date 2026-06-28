'use client';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Award, AlertTriangle, Zap } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import Topbar from '@/components/Topbar';

const COLORS = ['#0066CC', '#00D4FF', '#00E676', '#FFB300', '#FF4B6B', '#BB86FC', '#FF7043', '#26C6DA'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-700)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '12px 16px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color ?? 'var(--text-primary)', fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => dashboardApi.getAnalytics().then(r => r.data),
  });

  if (isLoading) return (
    <div>
      <Topbar title="Analytics" subtitle="Interactive inspection performance metrics" />
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  const analytics = data as any;

  return (
    <div>
      <Topbar title="Analytics" subtitle="Interactive inspection performance metrics" />
      <div style={{ padding: '24px', maxWidth: 1400 }}>

        {/* KPI Strip */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: BarChart3, label: 'Total Inspections', value: analytics?.kpis?.totalInspections ?? 0, color: '#0066CC' },
            { icon: Award, label: 'Avg AI Confidence', value: `${analytics?.kpis?.avgConfidence ?? 0}%`, color: '#00E676' },
            { icon: Zap, label: 'Avg Repair Cost', value: `$${analytics?.kpis?.avgRepairCost?.toLocaleString() ?? 0}`, color: '#FFB300' },
          ].map(({ icon: Ic, label, value, color }, i) => (
            <motion.div key={i} className="kpi-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic size={18} color={color} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color }}>{value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Row 1: Trend + Damage Categories */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>30-Day Inspection Trend</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Daily accepted vs rejected breakdown</p>
              </div>
              <TrendingUp size={18} style={{ color: 'var(--primary-light)' }} />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics?.trend ?? []}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4B6B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF4B6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={d => d.split('-').slice(1).join('/')} interval={6} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="accepted" stroke="#00E676" fill="url(#aGrad)" strokeWidth={2} name="Accepted" />
                <Area type="monotone" dataKey="rejected" stroke="#FF4B6B" fill="url(#rGrad)" strokeWidth={2} name="Rejected" />
                <Area type="monotone" dataKey="total" stroke="#0066CC" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="Total" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Damage Categories</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Most frequent defect types</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(analytics?.damageCategories ?? []).slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Count">
                  {(analytics?.damageCategories ?? []).slice(0, 7).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Row 2: Monthly + Supplier + OEM */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Monthly Trend */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Monthly Performance</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Last 6 months comparison</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="accepted" fill="#00E676" radius={[4, 4, 0, 0]} name="Accepted" />
                <Bar dataKey="rejected" fill="#FF4B6B" radius={[4, 4, 0, 0]} name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Supplier Table */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Supplier Comparison</h3>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {(analytics?.supplierStats ?? []).slice(0, 8).map((s: any, i: number) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{s.name}</span>
                    <span style={{ color: s.defectRate > 2 ? '#FF4B6B' : '#00E676', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{s.defectRate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${s.defectRate * 10}%`, background: s.defectRate > 2 ? '#FF4B6B' : '#00E676' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.total} inspections · ⭐ {s.rating}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* OEM Table */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>OEM Comparison</h3>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {(analytics?.oemStats ?? []).slice(0, 8).map((o: any, i: number) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{o.name}</span>
                    <span style={{ color: '#00E676', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{o.acceptRate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${o.acceptRate}%`, background: `linear-gradient(90deg, #0066CC, #00D4FF)` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{o.total} parts total</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Row 3: Top Parts + Monthly AI Confidence */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Most Inspected Parts</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>By inspection frequency</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(analytics?.topParts ?? []).slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="part" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0066CC" radius={[4, 4, 0, 0]} name="Inspections" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Monthly AI Confidence</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Average confidence score trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} domain={[60, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avgConfidence" stroke="#00D4FF" strokeWidth={3} dot={{ fill: '#00D4FF', r: 5 }} name="Avg Confidence %" activeDot={{ r: 7, fill: '#0066CC' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
