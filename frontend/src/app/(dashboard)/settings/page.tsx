'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import Topbar from '@/components/Topbar';
import toast from 'react-hot-toast';
import {
  Settings, User, Bell, Palette, Globe,
  ShieldAlert, Save, Loader2, Sparkles
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    department: user?.department ?? '',
  });

  const [saving, setSaving] = useState(false);

  // Appearance & Notification mocks
  const [theme, setTheme] = useState('dark');
  const [plantBranding, setPlantBranding] = useState('AutoInspect Standard');
  const [notifications, setNotifications] = useState({
    emailOnComplete: true,
    emailOnOverride: true,
    pushOnManualReview: true,
    soundAlerts: false,
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(profileForm);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('System preferences stored');
  };

  return (
    <div>
      <Topbar title="Settings" subtitle="Manage your profile and manufacturing system defaults" />
      <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* User Profile Form */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} style={{ color: 'var(--primary-light)' }} /> Profile Management
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Update your profile information and department routing</p>

            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email Address (Read-only)</label>
                  <input className="input" type="email" value={user?.email ?? ''} disabled style={{ cursor: 'not-allowed', opacity: 0.6 }} />
                </div>
                <div>
                  <label className="label">Contact Phone</label>
                  <input className="input" type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Active Department</label>
                  <input className="input" type="text" value={profileForm.department} onChange={e => setProfileForm({ ...profileForm, department: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <Loader2 size={14} className="animate-spin-slow" /> : <Save size={14} />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </motion.div>

          {/* Plant & System Preferences */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={18} style={{ color: 'var(--accent)' }} /> Branding & System Appearance
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Configure plant software layout themes and labeling options</p>

            <form onSubmit={handleSaveSystem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label className="label">Active Theme</label>
                  <select className="select" value={theme} onChange={e => setTheme(e.target.value)}>
                    <option value="dark">Modern Industrial Dark (Recommended)</option>
                    <option value="light">Classic Plant Light</option>
                    <option value="system">Follow System Diagnostics</option>
                  </select>
                </div>
                <div>
                  <label className="label">Branding Preset</label>
                  <input className="input" type="text" value={plantBranding} onChange={e => setPlantBranding(e.target.value)} />
                </div>
              </div>

              <div className="divider" />

              {/* Notifications Setting */}
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={16} style={{ color: 'var(--warning)' }} /> Plant Notifications & Escalations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {[
                  { key: 'emailOnComplete', label: 'Email notifications on AI Analysis completion' },
                  { key: 'emailOnOverride', label: 'Notify on supervisor decisions or overrides' },
                  { key: 'pushOnManualReview', label: 'Trigger urgent push alerts for manual review cases' },
                  { key: 'soundAlerts', label: 'Play diagnostic completion chime/beeps on tablet' },
                ].map(opt => (
                  <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={(notifications as any)[opt.key]}
                      onChange={e => setNotifications({ ...notifications, [opt.key]: e.target.checked })}
                      style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{opt.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary">
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
