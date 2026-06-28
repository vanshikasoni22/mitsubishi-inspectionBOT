'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, PlusCircle, BarChart3,
  Users, Settings, LogOut, Shield, Eye, Bell, Zap,
  ChevronRight, Award, Cpu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'INSPECTOR', 'SUPERVISOR'] },
  { label: 'New Inspection', href: '/inspection/new', icon: PlusCircle, roles: ['ADMIN', 'INSPECTOR', 'SUPERVISOR'], highlight: true },
  { label: 'History', href: '/inspection/history', icon: ClipboardList, roles: ['ADMIN', 'INSPECTOR', 'SUPERVISOR'] },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['ADMIN', 'SUPERVISOR'] },
  { label: 'Supervisor Panel', href: '/supervisor', icon: Eye, roles: ['ADMIN', 'SUPERVISOR'] },
  { label: 'Admin Panel', href: '/admin', icon: Shield, roles: ['ADMIN'] },
  { label: 'Profile', href: '/profile', icon: Award, roles: ['ADMIN', 'INSPECTOR', 'SUPERVISOR'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'INSPECTOR', 'SUPERVISOR'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--glass-border)' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="34" height="30" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="50,46 64.4,21 50,0 35.6,21" fill="#E60012" />
              <polygon points="46.5,50 17.7,50 3.3,75 32.1,75" fill="#E60012" />
              <polygon points="53.5,50 67.9,75 96.7,75 82.3,50" fill="#E60012" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              MITSUBISHI
            </div>
            <div style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              ELECTRIC
            </div>
          </div>
        </Link>
      </div>

      {/* User Card */}
      {user && (
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{
            padding: '12px', borderRadius: '12px',
            background: 'rgba(0, 102, 204, 0.08)',
            border: '1px solid rgba(0, 102, 204, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0066CC, #00D4FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {user.name[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--primary-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        <div style={{ padding: '4px 16px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Navigation
        </div>
        {visibleItems.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Link
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={item.highlight && !isActive ? {
                  background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.15) 0%, rgba(0, 212, 255, 0.08) 100%)',
                  border: '1px solid rgba(0, 102, 204, 0.2)',
                  color: 'var(--accent)',
                } : {}}
              >
                <Icon size={18} className="nav-icon" />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.highlight && !isActive && <Zap size={12} style={{ color: 'var(--accent)' }} />}
                {isActive && <ChevronRight size={14} style={{ color: 'var(--primary-light)' }} />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 230, 118, 0.06)',
          borderRadius: '10px',
          border: '1px solid rgba(0, 230, 118, 0.15)',
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '12px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0, boxShadow: '0 0 8px var(--success)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>All Systems Operational</span>
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
