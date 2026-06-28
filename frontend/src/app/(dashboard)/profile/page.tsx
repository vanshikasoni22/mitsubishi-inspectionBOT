'use client';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Award, TrendingUp, Clock, Target, Shield, User,
  Mail, Calendar, Briefcase, Phone, Zap, Loader2
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function InspectorProfilePage() {
  const { user } = useAuth();

  const { data: leaderboardData, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => adminApi.getLeaderboard().then(r => r.data.leaderboard),
  });

  const leaderboard = leaderboardData ?? [];

  return (
    <div>
      <Topbar title="Inspector Profile" subtitle="Track your stats, badges, and plant standing" />
      <div style={{ padding: '24px', maxWidth: 1200 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>

          {/* Left Column: User details, badges, and stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Main profile card */}
            {user && (
              <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0066CC, #00D4FF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: 800, color: 'white',
                    boxShadow: '0 8px 30px rgba(0, 102, 204, 0.4)',
                  }}>
                    {user.name[0]}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800 }}>{user.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>• {user.department}</span>
                    </div>
                  </div>
                </div>

                <div className="divider" style={{ margin: '24px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{user.department} Department</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{user.phone ?? 'No phone listed'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Joined: {format(new Date(user.createdAt), 'MMM yyyy')}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Performance Stats */}
            {user && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { icon: Target, label: 'Total Inspections', value: user.totalInspections, sub: 'All-time verified', color: '#0066CC' },
                  { icon: Clock, label: 'Avg Scan Time', value: `${user.averageTime} min`, sub: 'Per return package', color: '#00D4FF' },
                  { icon: TrendingUp, label: 'Accuracy Score', value: `${user.accuracyScore}%`, sub: 'Supervisor approved', color: '#00E676' },
                ].map(({ icon: Ic, label, value, sub, color }, i) => (
                  <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Ic size={16} color={color} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 2 }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sub}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Badges Panel */}
            {user && (
              <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Earned Badges</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {user.badges.map((badge: string) => {
                    const descriptions: Record<string, string> = {
                      INSPECTOR: 'Certified parts line quality inspector.',
                      SUPERVISOR: 'Authorized override & inspection supervisor.',
                      ADMIN: 'Full systems administrator.',
                      SPEED_DEMON: 'Maintained scan times under 15 minutes.',
                      PRECISION: 'Achieved average inspection accuracy above 95%.',
                      CENTURY_CLUB: 'Completed over 100 successful inspections.',
                      GOLD_STAR: 'Demonstrated outstanding attention to detail.',
                    };
                    return (
                      <div key={badge} style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        width: 'calc(50% - 6px)',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.2), rgba(0, 212, 255, 0.2))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(0, 102, 204, 0.3)', flexShrink: 0,
                        }}>
                          <Award size={16} style={{ color: 'var(--primary-light)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {badge.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                            {descriptions[badge] ?? 'Special plant performance milestone.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Plant Leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ padding: 24, height: '100%' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Inspector Leaderboard</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Top plant quality professionals ranked by total inspections</p>

              {loadingLeaderboard ? <Loader2 size={24} className="animate-spin-slow" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {leaderboard.map((item: any, i: number) => {
                    const isSelf = item.id === user?.id;
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 12,
                        background: isSelf ? 'rgba(0, 102, 204, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: isSelf ? '1px solid rgba(0, 102, 204, 0.2)' : '1px solid var(--glass-border)',
                      }}>
                        {/* Rank */}
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: i === 0 ? '#FFB300' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'transparent',
                          color: i < 3 ? 'white' : 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800,
                        }}>
                          {i + 1}
                        </div>
                        {/* Avatar initials */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0066CC, #00D4FF)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {item.name[0]}
                        </div>
                        {/* Details */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.name}
                            {isSelf && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--primary)', color: 'white' }}>YOU</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.department}</div>
                        </div>
                        {/* Stats */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-light)' }}>{item.totalInspections}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Inspections</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
