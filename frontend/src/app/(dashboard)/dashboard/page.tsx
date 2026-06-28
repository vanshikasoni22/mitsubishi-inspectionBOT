'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  ClipboardList, CheckCircle, XCircle, Clock, Brain,
  TrendingUp, Activity, PlusCircle, FileText, BarChart3,
  AlertTriangle, Zap
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from '@/components/Topbar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#00E676', '#FF4B6B', '#FFB300', '#00D4FF', '#BB86FC'];

function KpiCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: any; label: string; value: string | number; sub?: string; color: string; trend?: string;
}) {
  return (
    <motion.div className="kpi-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {trend && <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, background: 'var(--success-bg)', padding: '2px 8px', borderRadius: 10 }}>↑ {trend}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-700)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => dashboardApi.getStats().then(r => r.data) });
  const { data: charts } = useQuery({ queryKey: ['dashboard-charts'], queryFn: () => dashboardApi.getCharts().then(r => r.data) });
  const { data: activity } = useQuery({ queryKey: ['dashboard-activity'], queryFn: () => dashboardApi.getActivity().then(r => r.data.activity) });

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="animate-spin-slow" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent' }} /></div>;

  const pieData = [
    { name: 'Accepted', value: stats?.accepted ?? 0 },
    { name: 'Rejected', value: stats?.rejected ?? 0 },
    { name: 'Pending', value: stats?.pending ?? 0 },
    { name: 'Manual Review', value: stats?.manualReview ?? 0 },
  ].filter(d => d.value > 0);

  return (
    <div>
      <Topbar title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]} — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} />

      <div style={{ padding: '24px', maxWidth: 1400 }}>
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <Link href="/inspection/new" className="btn-primary">
            <PlusCircle size={16} /> New Inspection
          </Link>
          <Link href="/inspection/history" className="btn-secondary">
            <FileText size={16} /> View Reports
          </Link>
          <Link href="/analytics" className="btn-secondary">
            <BarChart3 size={16} /> Analytics
          </Link>
        </motion.div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
          <KpiCard icon={ClipboardList} label="Today's Inspections" value={stats?.todayInspections ?? 0} sub={`${stats?.totalInspections ?? 0} total`} color="#0066CC" trend="+3" />
          <KpiCard icon={CheckCircle} label="Accepted Parts" value={stats?.accepted ?? 0} color="#00E676" trend="+8" />
          <KpiCard icon={XCircle} label="Rejected Parts" value={stats?.rejected ?? 0} color="#FF4B6B" />
          <KpiCard icon={AlertTriangle} label="Pending Review" value={(stats?.pending ?? 0) + (stats?.manualReview ?? 0)} sub={`${stats?.manualReview ?? 0} manual review`} color="#FFB300" />
          <KpiCard icon={Brain} label="AI Confidence" value={`${stats?.avgConfidence ?? 0}%`} sub="Average across all inspections" color="#00D4FF" trend="+2%" />
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Trend Chart */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Inspection Trend</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 30 days</p>
              </div>
              <TrendingUp size={18} style={{ color: 'var(--primary-light)' }} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts?.trend ?? []}>
                <defs>
                  <linearGradient id="acceptedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rejectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4B6B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF4B6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={d => d.split('-').slice(1).join('/')} interval={6} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                <Area type="monotone" dataKey="accepted" stroke="#00E676" fill="url(#acceptedGrad)" strokeWidth={2} name="Accepted" />
                <Area type="monotone" dataKey="rejected" stroke="#FF4B6B" fill="url(#rejectedGrad)" strokeWidth={2} name="Rejected" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie Chart */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Accept/Reject Ratio</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>All time</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Damage Categories */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Top Damage Categories</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>By occurrence frequency</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(charts?.damageCategories ?? []).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0066CC" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Recent Activity</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>System audit trail</p>
              </div>
              <Activity size={16} style={{ color: 'var(--primary-light)' }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {(activity ?? []).slice(0, 10).map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 9 ? '1px solid var(--glass-border)' : 'none', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #0066CC, #00D4FF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'white',
                  }}>
                    {a.userName?.[0] ?? 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 1 }}>
                      {a.userName} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(0,102,204,0.1)', color: 'var(--primary-light)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {a.entityType}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Stats Bar */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>System Status:</span>
            <span style={{ fontSize: 13, color: 'var(--success)' }}>All Services Operational</span>
          </div>
          <div className="divider" style={{ width: 1, height: 20, margin: 0, background: 'var(--glass-border)' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Accept Rate: <span style={{ color: 'var(--success)', fontWeight: 700 }}>{stats?.acceptRate ?? 0}%</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Reject Rate: <span style={{ color: 'var(--error)', fontWeight: 700 }}>{stats?.rejectRate ?? 0}%</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Total Inspected: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{stats?.totalInspections ?? 0} parts</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Link href="/inspection/new" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
              <PlusCircle size={14} /> New Inspection
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
