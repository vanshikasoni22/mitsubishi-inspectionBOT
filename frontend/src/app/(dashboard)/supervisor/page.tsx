'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Eye,
  RefreshCw, MessageSquare, Loader2, UserCheck, Inbox
} from 'lucide-react';
import { inspectionApi, adminApi } from '@/lib/api';
import Topbar from '@/components/Topbar';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function SupervisorPanelPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNote, setOverrideNote] = useState('');

  // Fetch only MANUAL_REVIEW or PENDING inspections
  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['supervisor-pending'],
    queryFn: () => inspectionApi.getHistory({ page: 1, limit: 50, status: 'MANUAL_REVIEW' }).then(r => r.data),
  });

  const pendingInspections = historyData?.items ?? [];

  const overrideMutation = useMutation({
    mutationFn: () => inspectionApi.override(selectedInspection.id, overrideStatus, overrideNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supervisor-pending'] });
      toast.success('Recommendation overridden successfully');
      setSelectedInspection(null);
      setOverrideStatus('');
      setOverrideNote('');
    },
    onError: () => {
      toast.error('Failed to apply override');
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

  return (
    <div>
      <Topbar title="Supervisor Panel" subtitle="Review and override pending or escalated cases" />
      <div style={{ padding: '24px', maxWidth: 1400 }}>
        <div style={{ display: 'grid', gridTemplateColumns: selectedInspection ? '1fr 400px' : '1fr', gap: 20 }}>
          {/* Main List */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Inbox size={18} style={{ color: 'var(--primary-light)' }} /> Pending Manual Reviews ({pendingInspections.length})
              </h3>
              <button onClick={() => refetch()} className="btn-ghost" title="Refresh">
                <RefreshCw size={15} />
              </button>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
              </div>
            ) : pendingInspections.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={36} style={{ color: 'var(--success)', marginBottom: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                <p style={{ fontSize: 15, fontWeight: 600 }}>All Clear!</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>No inspections currently require supervisor review.</p>
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInspections.map((item: any) => (
                      <tr key={item.id} style={{
                        background: selectedInspection?.id === item.id ? 'rgba(0, 102, 204, 0.08)' : 'transparent',
                        cursor: 'pointer'
                      }} onClick={() => setSelectedInspection(item)}>
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
                            <button className="btn-primary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setSelectedInspection(item); }}>
                              Decide
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

          {/* Quick Review / Override Panel */}
          {selectedInspection && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: 24, height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Quick Review</h3>
                <button onClick={() => setSelectedInspection(null)} className="btn-ghost" style={{ padding: 4 }}>✕</button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Part Details</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedInspection.partNumber}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedInspection.vehicleModel}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Confidence & Findings</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span className="badge badge-manual">MANUAL REVIEW</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Confidence: {selectedInspection.aiAnalysis?.confidence}%</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                  {selectedInspection.aiAnalysis?.reasoning}
                </p>
              </div>

              <div className="divider" />

              <form onSubmit={handleApplyOverride}>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Override Decision</label>
                  <select className="select" value={overrideStatus} onChange={e => setOverrideStatus(e.target.value)}>
                    <option value="">Select final status...</option>
                    <option value="ACCEPTED">ACCEPT PART</option>
                    <option value="REJECTED">REJECT PART</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="label">Decision Note</label>
                  <textarea className="input" style={{ minHeight: 80, resize: 'none' }} placeholder="Provide justification for override..."
                    value={overrideNote} onChange={e => setOverrideNote(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => router.push(`/inspection/${selectedInspection.id}`)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Full Report
                  </button>
                  <button type="submit" disabled={overrideMutation.isPending} className="btn-primary" style={{ flex: 1.5, justifyContent: 'center' }}>
                    {overrideMutation.isPending ? <Loader2 size={14} className="animate-spin-slow" /> : <UserCheck size={14} />}
                    Submit Decision
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
