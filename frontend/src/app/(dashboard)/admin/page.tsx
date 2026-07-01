'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Building, Truck, Activity, Heart,
  PlusCircle, Trash2, Edit2, Loader2, RefreshCw, Key,
  Eye, CheckCircle, XCircle, AlertTriangle, UserCheck
} from 'lucide-react';
import { adminApi, inspectionApi } from '@/lib/api';
import Topbar from '@/components/Topbar';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPanelPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'oems' | 'suppliers' | 'logs' | 'health' | 'approvals'>('users');

  // Approvals State
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNote, setOverrideNote] = useState('');

  // Modals / forms state
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'INSPECTOR', department: '' });

  const [oemFormOpen, setOemFormOpen] = useState(false);
  const [oemForm, setOemForm] = useState({ name: '', country: '', contactEmail: '' });

  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', country: '', contactEmail: '', rating: 4.5 });

  // Queries
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers().then(r => r.data.users),
    enabled: activeTab === 'users',
  });

  const { data: oemsData, isLoading: loadingOems } = useQuery({
    queryKey: ['admin-oems'],
    queryFn: () => adminApi.getOems().then(r => r.data.oems),
    enabled: activeTab === 'oems',
  });

  const { data: suppliersData, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => adminApi.getSuppliers().then(r => r.data.suppliers),
    enabled: activeTab === 'suppliers',
  });

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => adminApi.getAuditLogs().then(r => r.data),
    enabled: activeTab === 'logs',
  });

  const { data: healthData, isLoading: loadingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => adminApi.getHealth().then(r => r.data),
    enabled: activeTab === 'health',
  });

  const { data: approvalsData, isLoading: loadingApprovals, refetch: refetchApprovals } = useQuery({
    queryKey: ['admin-approvals'],
    queryFn: () => inspectionApi.getHistory({ page: 1, limit: 50, status: 'MANUAL_REVIEW' }).then(r => r.data),
    enabled: activeTab === 'approvals',
  });
  const pendingApprovals = approvalsData?.items ?? [];

  const overrideMutation = useMutation({
    mutationFn: () => inspectionApi.override(selectedApproval.id, overrideStatus, overrideNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-approvals'] });
      toast.success('Inspection decision submitted successfully');
      setSelectedApproval(null);
      setOverrideStatus('');
      setOverrideNote('');
    },
    onError: () => {
      toast.error('Failed to submit decision');
    }
  });

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideStatus) {
      toast.error('Please select a status');
      return;
    }
    overrideMutation.mutate();
  };

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: () => adminApi.createUser(userForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created successfully');
      setUserFormOpen(false);
      setUserForm({ name: '', email: '', password: '', role: 'INSPECTOR', department: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create user')
  });

  const createOemMutation = useMutation({
    mutationFn: () => adminApi.createOem(oemForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-oems'] });
      toast.success('OEM added successfully');
      setOemFormOpen(false);
      setOemForm({ name: '', country: '', contactEmail: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to add OEM')
  });

  const createSupplierMutation = useMutation({
    mutationFn: () => adminApi.createSupplier(supplierForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success('Supplier added successfully');
      setSupplierFormOpen(false);
      setSupplierForm({ name: '', country: '', contactEmail: '', rating: 4.5 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to add supplier')
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deactivated');
    }
  });

  return (
    <div>
      <Topbar title="Admin Panel" subtitle="Configure system rules, manage partners, and view health metrics" />
      <div style={{ padding: '24px', maxWidth: 1400 }}>

        {/* Tab Headers */}
        <div className="tabs" style={{ marginBottom: 24, width: 'fit-content' }}>
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'oems', label: 'OEM Partners', icon: Building },
            { id: 'suppliers', label: 'Suppliers', icon: Truck },
            { id: 'approvals', label: 'Inspection Approvals', icon: Shield },
            { id: 'logs', label: 'Audit Logs', icon: Activity },
            { id: 'health', label: 'System Health', icon: Heart },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id as any)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="glass-card" style={{ padding: 24 }}>
          {/* USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Users</h3>
                <button onClick={() => setUserFormOpen(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                  <PlusCircle size={14} /> Add User
                </button>
              </div>

              {loadingUsers ? <Loader2 size={24} className="animate-spin-slow" /> : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Total Inspections</th>
                        <th>Accuracy</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usersData ?? []).map((u: any) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.department}</td>
                          <td>{u.totalInspections}</td>
                          <td>{u.accuracyScore}%</td>
                          <td>
                            <span className={`badge ${u.isActive ? 'badge-accepted' : 'badge-rejected'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {u.isActive && (
                              <button onClick={() => deleteUserMutation.mutate(u.id)} className="btn-ghost" style={{ color: 'var(--error)', padding: 4 }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* OEM PARTNERS */}
          {activeTab === 'oems' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>OEM Partners</h3>
                <button onClick={() => setOemFormOpen(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                  <PlusCircle size={14} /> Add OEM
                </button>
              </div>

              {loadingOems ? <Loader2 size={24} className="animate-spin-slow" /> : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Country</th>
                        <th>Contact Email</th>
                        <th>Partner Since</th>
                        <th>Total Parts Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(oemsData ?? []).map((o: any) => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 600 }}>{o.name}</td>
                          <td>{o.country}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{o.contactEmail}</td>
                          <td>{o.partnerSince}</td>
                          <td>{o.totalParts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Suppliers</h3>
                <button onClick={() => setSupplierFormOpen(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                  <PlusCircle size={14} /> Add Supplier
                </button>
              </div>

              {loadingSuppliers ? <Loader2 size={24} className="animate-spin-slow" /> : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Country</th>
                        <th>Contact Email</th>
                        <th>Deliveries</th>
                        <th>Defect Rate</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(suppliersData ?? []).map((s: any) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.country}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{s.contactEmail}</td>
                          <td>{s.totalDeliveries}</td>
                          <td style={{ color: s.defectRate > 2 ? 'var(--error)' : 'var(--success)' }}>{s.defectRate}%</td>
                          <td>⭐ {s.rating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>System Audit Logs</h3>
              {loadingLogs ? <Loader2 size={24} className="animate-spin-slow" /> : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity Type</th>
                        <th>Date</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(logsData?.logs ?? []).map((log: any) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600 }}>{log.user?.name ?? 'System'}</td>
                          <td><code style={{ color: 'var(--primary-light)' }}>{log.action}</code></td>
                          <td><span className="badge badge-manual" style={{ fontSize: 10 }}>{log.entityType}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{log.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SYSTEM HEALTH */}
          {activeTab === 'health' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>System Telemetry & Health</h3>
                <button onClick={() => refetchHealth()} className="btn-ghost" title="Refresh Health">
                  <RefreshCw size={15} />
                </button>
              </div>

              {loadingHealth ? <Loader2 size={24} className="animate-spin-slow" /> : healthData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  <div style={{ padding: 18, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>{healthData.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                      Uptime: {Math.round(healthData.uptime / 3600)} hours
                    </div>
                  </div>

                  <div style={{ padding: 18, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memory Usage</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>
                      {Math.round(healthData.memoryUsage?.rss / 1024 / 1024)} MB
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      Heap: {Math.round(healthData.memoryUsage?.heapUsed / 1024 / 1024)} MB used
                    </div>
                  </div>

                  <div style={{ padding: 18, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Objects</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div>Inspections: <strong>{healthData.dataStore?.inspections}</strong></div>
                      <div>Users: <strong>{healthData.dataStore?.users}</strong></div>
                      <div>OEM Partners: <strong>{healthData.dataStore?.oems}</strong></div>
                      <div>Suppliers: <strong>{healthData.dataStore?.suppliers}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INSPECTION APPROVALS */}
          {activeTab === 'approvals' && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedApproval ? '1fr 400px' : '1fr', gap: 20 }}>
              {/* Approvals Table */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={18} style={{ color: 'var(--primary-light)' }} /> Pending Inspection Approvals ({pendingApprovals.length})
                  </h3>
                  <button onClick={() => refetchApprovals()} className="btn-ghost" title="Refresh Approvals">
                    <RefreshCw size={15} />
                  </button>
                </div>

                {loadingApprovals ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle size={36} style={{ color: 'var(--success)', marginBottom: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                    <p style={{ fontSize: 15, fontWeight: 600 }}>All Clear!</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>No inspection requests are currently pending admin approval.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Batch No.</th>
                          <th>Part Number</th>
                          <th>OEM</th>
                          <th>Reason</th>
                          <th>AI Confidence</th>
                          <th>Inspector</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApprovals.map((item: any) => (
                          <tr key={item.id} style={{
                            background: selectedApproval?.id === item.id ? 'rgba(0, 102, 204, 0.08)' : 'transparent',
                            cursor: 'pointer'
                          }} onClick={() => setSelectedApproval(item)}>
                            <td><span className="font-mono" style={{ fontSize: 12, color: 'var(--primary-light)' }}>{item.batchNumber}</span></td>
                            <td style={{ fontWeight: 600 }}>{item.partNumber}</td>
                            <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.oem?.name}</td>
                            <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.returnReason}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="progress-bar" style={{ width: 50 }}>
                                  <div className="progress-fill" style={{ width: `${item.aiAnalysis?.confidence}%`, background: '#FFB300' }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)' }}>{item.aiAnalysis?.confidence}%</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.inspector?.name}</td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); router.push(`/inspection/${item.id}`) }}>
                                  <Eye size={13} /> View
                                </button>
                                <button className="btn-primary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setSelectedApproval(item); }}>
                                  Review
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Side decision drawer */}
              {selectedApproval && (
                <div className="glass-card" style={{ padding: 20, height: 'fit-content', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Review Approval</h3>
                    <button onClick={() => setSelectedApproval(null)} className="btn-ghost" style={{ padding: 4 }}>✕</button>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Part & Model</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{selectedApproval.partNumber}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedApproval.vehicleModel}</div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Findings</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className="badge badge-manual" style={{ fontSize: 10 }}>MANUAL REVIEW</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Confidence: {selectedApproval.aiAnalysis?.confidence}%</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                      {selectedApproval.aiAnalysis?.reasoning}
                    </p>
                  </div>

                  <div style={{ height: 1, background: 'var(--glass-border)', margin: '14px 0' }} />

                  <form onSubmit={handleApplyOverride}>
                    <div style={{ marginBottom: 14 }}>
                      <label className="label" style={{ fontSize: 11 }}>Decision</label>
                      <select className="select" value={overrideStatus} onChange={e => setOverrideStatus(e.target.value)} style={{ padding: 8, fontSize: 13 }}>
                        <option value="">Select decision...</option>
                        <option value="ACCEPTED">APPROVE (ACCEPT RETURN)</option>
                        <option value="REJECTED">REJECT RETURN</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label className="label" style={{ fontSize: 11 }}>Justification Note</label>
                      <textarea className="input" style={{ minHeight: 60, resize: 'none', padding: 8, fontSize: 13 }} placeholder="Provide reasoning for admin decision..."
                        value={overrideNote} onChange={e => setOverrideNote(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => router.push(`/inspection/${selectedApproval.id}`)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 8, fontSize: 12 }}>
                        Full Report
                      </button>
                      <button type="submit" disabled={overrideMutation.isPending} className="btn-primary" style={{ flex: 1.5, justifyContent: 'center', padding: 8, fontSize: 12 }}>
                        {overrideMutation.isPending ? <Loader2 size={12} className="animate-spin-slow" /> : <UserCheck size={12} />}
                        Submit Decision
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- MODAL DIALOGS (PLAIN HTML/CSS FLOATING BOXES) --- */}
        {userFormOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-card" style={{ width: 400, padding: 24, position: 'relative' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create User</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="label">Name</label>
                  <input className="input" type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="select" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                    <option value="INSPECTOR">INSPECTOR</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" type="text" value={userForm.department} onChange={e => setUserForm({ ...userForm, department: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={() => setUserFormOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => createUserMutation.mutate()} className="btn-primary">
                  {createUserMutation.isPending && <Loader2 size={14} className="animate-spin-slow" />} Save
                </button>
              </div>
            </div>
          </div>
        )}

        {oemFormOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-card" style={{ width: 400, padding: 24, position: 'relative' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create OEM Partner</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="label">OEM Name</label>
                  <input className="input" type="text" value={oemForm.name} onChange={e => setOemForm({ ...oemForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input className="input" type="text" value={oemForm.country} onChange={e => setOemForm({ ...oemForm, country: e.target.value })} />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input className="input" type="email" value={oemForm.contactEmail} onChange={e => setOemForm({ ...oemForm, contactEmail: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={() => setOemFormOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => createOemMutation.mutate()} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        )}

        {supplierFormOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-card" style={{ width: 400, padding: 24, position: 'relative' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create Supplier</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="label">Supplier Name</label>
                  <input className="input" type="text" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input className="input" type="text" value={supplierForm.country} onChange={e => setSupplierForm({ ...supplierForm, country: e.target.value })} />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input className="input" type="email" value={supplierForm.contactEmail} onChange={e => setSupplierForm({ ...supplierForm, contactEmail: e.target.value })} />
                </div>
                <div>
                  <label className="label">Supplier Rating (1.0 - 5.0)</label>
                  <input className="input" type="number" step="0.1" value={supplierForm.rating} onChange={e => setSupplierForm({ ...supplierForm, rating: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={() => setSupplierFormOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => createSupplierMutation.mutate()} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
