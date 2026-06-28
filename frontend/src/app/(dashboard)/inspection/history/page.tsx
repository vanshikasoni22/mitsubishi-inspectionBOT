'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight,
  Eye, SortAsc, SortDesc, RefreshCw, FileText
} from 'lucide-react';
import { inspectionApi, adminApi } from '@/lib/api';
import Topbar from '@/components/Topbar';
import { formatDistanceToNow, format } from 'date-fns';

const STATUS_OPTIONS = ['', 'ACCEPTED', 'REJECTED', 'MANUAL_REVIEW', 'PENDING', 'IN_PROGRESS'];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACCEPTED: 'badge-accepted', REJECTED: 'badge-rejected',
    MANUAL_REVIEW: 'badge-manual', PENDING: 'badge-pending', IN_PROGRESS: 'badge-pending',
  };
  return <span className={`badge ${map[status] ?? 'badge-pending'}`}>{status.replace(/_/g, ' ')}</span>;
}

function SeverityChip({ severity }: { severity?: string }) {
  if (!severity) return null;
  const colors: Record<string, string> = { MINOR: '#00E676', MODERATE: '#FFB300', MAJOR: '#FF7043', CRITICAL: '#FF4B6B' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: colors[severity] ?? 'var(--text-muted)', background: `${colors[severity] ?? '#888'}18`, padding: '2px 8px', borderRadius: 8 }}>
      {severity}
    </span>
  );
}

export default function InspectionHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [oemId, setOemId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inspection-history', page, search, status, oemId, supplierId, sortBy, sortOrder],
    queryFn: () => inspectionApi.getHistory({ page, limit: 12, search, status, oemId, supplierId, sortBy, sortOrder }).then(r => r.data),
    keepPreviousData: true,
  } as any);

  const { data: oemsData } = useQuery({ queryKey: ['oems'], queryFn: () => adminApi.getOems().then(r => r.data.oems) });
  const { data: suppliersData } = useQuery({ queryKey: ['suppliers'], queryFn: () => adminApi.getSuppliers().then(r => r.data.suppliers) });

  const items = (data as any)?.items ?? [];
  const pagination = (data as any)?.pagination ?? { page: 1, pages: 1, total: 0 };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('desc'); }
  };

  const exportCSV = () => {
    const headers = ['Batch Number', 'Part Number', 'OEM', 'Supplier', 'Vehicle', 'Status', 'Damage', 'Confidence', 'Date'];
    const rows = items.map((i: any) => [
      i.batchNumber, i.partNumber, i.oem?.name, i.supplier?.name, i.vehicleModel,
      i.status, i.aiAnalysis?.damageType ?? 'N/A', i.aiAnalysis?.confidence ?? 'N/A',
      format(new Date(i.createdAt), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inspections.csv'; a.click();
  };

  return (
    <div>
      <Topbar title="Inspection History" subtitle={`${pagination.total} total records`} />
      <div style={{ padding: '24px' }}>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search part number or batch..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="select" style={{ flex: 1, minWidth: 140 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select className="select" style={{ flex: 1, minWidth: 140 }} value={oemId} onChange={e => { setOemId(e.target.value); setPage(1); }}>
            <option value="">All OEMs</option>
            {(oemsData ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select className="select" style={{ flex: 1, minWidth: 140 }} value={supplierId} onChange={e => { setSupplierId(e.target.value); setPage(1); }}>
            <option value="">All Suppliers</option>
            {(suppliersData ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => refetch()} className="btn-ghost" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={exportCSV} className="btn-secondary" style={{ gap: 8 }}>
            <Download size={15} /> Export CSV
          </button>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {[
                      { label: 'Batch No.', col: 'batchNumber' },
                      { label: 'Part Number', col: 'partNumber' },
                      { label: 'OEM', col: null },
                      { label: 'Vehicle', col: null },
                      { label: 'Status', col: 'status' },
                      { label: 'Damage', col: null },
                      { label: 'Confidence', col: null },
                      { label: 'Inspector', col: null },
                      { label: 'Date', col: 'createdAt' },
                      { label: '', col: null },
                    ].map(({ label, col }) => (
                      <th key={label} onClick={col ? () => toggleSort(col) : undefined}
                        style={{ cursor: col ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {label}
                          {col && sortBy === col && (sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No inspections found matching your filters.</td></tr>
                  ) : items.map((item: any, i: number) => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      style={{ cursor: 'pointer' }} onClick={() => router.push(`/inspection/${item.id}`)}>
                      <td><span className="font-mono" style={{ fontSize: 12, color: 'var(--primary-light)' }}>{item.batchNumber}</span></td>
                      <td style={{ fontWeight: 600 }}>{item.partNumber}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{item.oem?.name ?? '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.vehicleModel}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {item.aiAnalysis?.damageType?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td>
                        {item.aiAnalysis ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="progress-bar" style={{ width: 50 }}>
                              <div className="progress-fill" style={{
                                width: `${item.aiAnalysis.confidence}%`,
                                background: item.aiAnalysis.confidence >= 90 ? '#00E676' : item.aiAnalysis.confidence >= 75 ? '#FFB300' : '#FF4B6B'
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.aiAnalysis.confidence}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.inspector?.name ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </td>
                      <td>
                        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={e => { e.stopPropagation(); router.push(`/inspection/${item.id}`); }}>
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary" style={{ padding: '8px 14px' }}>
              <ChevronLeft size={15} />
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: page === p ? 'linear-gradient(135deg, #0066CC, #00D4FF)' : 'rgba(255,255,255,0.05)',
                      color: page === p ? 'white' : 'var(--text-secondary)',
                    }}>
                    {p}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-secondary" style={{ padding: '8px 14px' }}>
              <ChevronRight size={15} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Page {page} of {pagination.pages} · {pagination.total} records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
