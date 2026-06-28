'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Moon, Sun, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dashboardApi.getNotifications().then(r => r.data.notifications),
    refetchInterval: 30000,
  });

  const notifications = notifData ?? [];
  const unread = notifications.filter((n: any) => !n.read).length;

  return (
    <div style={{
      height: '64px',
      background: '#FFFFFF',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="18" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,46 64.4,21 50,0 35.6,21" fill="#E60012" />
            <polygon points="46.5,50 17.7,50 3.3,75 32.1,75" fill="#E60012" />
            <polygon points="53.5,50 67.9,75 96.7,75 82.3,50" fill="#E60012" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.2 }}>
            Mitsubishi Electric
          </h1>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            AI Automotive Parts Return Inspection System
          </p>
        </div>
        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 12px' }} />
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              width: 38, height: 38, borderRadius: '6px',
              background: '#F3F4F6',
              border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <Bell size={16} color="var(--text-secondary)" />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--primary)',
                boxShadow: '0 0 4px var(--primary)',
              }} />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 340, background: '#FFFFFF',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px', overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Notifications</span>
                  {unread > 0 && <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{unread} new</span>}
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No notifications</div>
                  ) : notifications.slice(0, 8).map((n: any) => (
                    <div key={n.id} style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid var(--glass-border)',
                      background: !n.read ? 'var(--error-bg)' : 'transparent',
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                        background: !n.read ? 'var(--primary)' : 'var(--text-muted)',
                      }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px 6px 6px',
              background: '#F3F4F6',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white',
            }}>
              {user?.name?.[0] ?? 'U'}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={14} color="var(--text-secondary)" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 200, background: '#FFFFFF',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px', overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  zIndex: 1000,
                }}
              >
                {[
                  { label: 'My Profile', href: '/profile' },
                  { label: 'Settings', href: '/settings' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)} style={{
                    display: 'block', padding: '10px 16px',
                    color: 'var(--text-secondary)', textDecoration: 'none',
                    fontSize: '13px', transition: 'all 0.2s',
                  }}
                  className="btn-ghost"
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close */}
      {(notifOpen || userMenuOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => { setNotifOpen(false); setUserMenuOpen(false); }} />
      )}
    </div>
  );
}
