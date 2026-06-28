'use client';
import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Download, Share2, Brain, Shield, Zap,
  MapPin, Clock, User, Building, FileText,
  CheckCircle, XCircle, AlertTriangle, MessageSquare,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  Printer, Eye, Loader2, Send
} from 'lucide-react';
import { inspectionApi, adminApi } from '@/lib/api';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// ── Confidence Gauge ─────────────────────────────────────────────────────────
function ConfidenceGauge({ value }: { value: number }) {
  const color = value >= 90 ? '#00E676' : value >= 75 ? '#FFB300' : '#FF4B6B';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div style={{ textAlign: 'center', position: 'relative', width: 140, margin: '0 auto' }}>
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
        <motion.path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.5}`}
          initial={{ strokeDashoffset: circumference * 0.5 }}
          animate={{ strokeDashoffset: circumference * 0.5 - (value / 100) * (circumference * 0.5) }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}%</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confidence</div>
      </div>
    </div>
  );
}

// ── Severity Bar ─────────────────────────────────────────────────────────────
function SeverityBar({ severity }: { severity: string }) {
  const levels = ['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'];
  const idx = levels.indexOf(severity);
  const colors = ['#00E676', '#FFB300', '#FF7043', '#FF4B6B'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {levels.map((l, i) => (
          <motion.div key={l}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.1, duration: 0.4 }}
            style={{
              flex: 1, height: 8, borderRadius: 4,
              background: i <= idx ? colors[idx] : 'rgba(255,255,255,0.06)',
              transformOrigin: 'bottom',
            }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {levels.map((l, i) => (
          <span key={l} style={{ fontSize: 10, color: i === idx ? colors[idx] : 'var(--text-muted)', fontWeight: i === idx ? 700 : 400 }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ── Image Viewer ─────────────────────────────────────────────────────────────
function ImageViewer({ images, boundingBoxes }: { images: any[]; boundingBoxes: any[] }) {
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);

  if (!images.length) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No images uploaded</p>
      </div>
    );
  }

  const img = images[current];
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  return (
    <div>
      {/* Main Image */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9', marginBottom: 12 }}
        onClick={() => setFullscreen(true)}>
        <img
          src={`${API_URL}${img.url}`}
          alt={`Inspection image ${current + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${zoom})`, transition: 'transform 0.3s', cursor: 'zoom-in' }}
          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/800x450/0a0d13/0066CC?text=Part+Image+${current + 1}`; }}
        />
        {/* Bounding Boxes Overlay */}
        {showBoxes && boundingBoxes.map((box: any, i: number) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${box.x}%`, top: `${box.y}%`,
            width: `${box.width}%`, height: `${box.height}%`,
            border: '2px solid #FF4B6B',
            borderRadius: 4,
          }}>
            <span style={{
              position: 'absolute', top: -22, left: 0,
              background: '#FF4B6B', color: 'white',
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: '4px 4px 4px 0',
              whiteSpace: 'nowrap',
            }}>
              {box.label} ({box.confidence}%)
            </span>
          </div>
        ))}
        {/* Controls overlay */}
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
          {[
            { icon: ZoomOut, action: () => setZoom(z => Math.max(1, z - 0.3)) },
            { icon: ZoomIn, action: () => setZoom(z => Math.min(3, z + 0.3)) },
            { icon: Maximize2, action: () => setFullscreen(true) },
          ].map(({ icon: Ic, action }, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); action(); }}
              style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic size={14} color="white" />
            </button>
          ))}
        </div>
        {/* Bbox toggle */}
        {boundingBoxes.length > 0 && (
          <button onClick={e => { e.stopPropagation(); setShowBoxes(b => !b); }}
            style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11, padding: '4px 10px', borderRadius: 8, background: showBoxes ? 'rgba(255,75,107,0.8)' : 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
            {showBoxes ? '🔲 Hide Boxes' : '🔲 Show Boxes'}
          </button>
        )}
      </div>

      {/* Thumbnails + Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-ghost" style={{ padding: '4px 8px' }}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ display: 'flex', gap: 8, flex: 1, overflow: 'auto' }}>
          {images.map((img: any, i: number) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{
                width: 60, height: 45, flexShrink: 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                border: `2px solid ${current === i ? 'var(--primary-light)' : 'transparent'}`,
                transition: 'border-color 0.2s',
              }}>
              <img src={`${API_URL}${img.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/60x45/0a0d13/0066CC?text=${i + 1}`; }} />
            </div>
          ))}
        </div>
        <button onClick={() => setCurrent(c => Math.min(images.length - 1, c + 1))} disabled={current === images.length - 1} className="btn-ghost" style={{ padding: '4px 8px' }}>
          <ChevronRight size={16} />
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{current + 1}/{images.length}</span>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="image-viewer-overlay" onClick={() => setFullscreen(false)}>
            <img src={`${API_URL}${img.url}`} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/800x600/000/333?text=Image`; }} />
            <button onClick={() => setFullscreen(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}>
              ✕ Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'negotiation' | 'checklist' | 'notes'>('analysis');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! I\'m the AutoInspect AI Assistant. I can answer questions about this inspection, explain the AI findings, or help with negotiation talking points. What would you like to know?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => inspectionApi.getById(id).then(r => r.data.inspection),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => inspectionApi.addNote(id, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inspection', id] }); setNoteText(''); toast.success('Note added'); },
    onError: () => toast.error('Failed to add note'),
  });

  const overrideMutation = useMutation({
    mutationFn: () => inspectionApi.override(id, overrideStatus, overrideNote),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inspection', id] }); toast.success('Status overridden'); setOverrideStatus(''); setOverrideNote(''); },
    onError: () => toast.error('Override failed'),
  });

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput;
    setChatMessages(m => [...m, { role: 'user', text: q }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await inspectionApi.chat(q, id);
      setChatMessages(m => [...m, { role: 'ai', text: res.data.answer }]);
    } catch { setChatMessages(m => [...m, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]); }
    finally { setChatLoading(false); }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      if (!reportRef.current) return;
      toast('Generating PDF...', { icon: '📄' });
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0a0d13', scale: 1.5 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`inspection-${inspection?.batchNumber ?? id}.pdf`);
      toast.success('PDF downloaded!');
    } catch (e) { toast.error('PDF generation failed'); }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Loader2 size={36} className="animate-spin-slow" style={{ color: 'var(--primary-light)' }} />
    </div>
  );

  const inspection = data as any;
  if (!inspection) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Inspection not found.</div>;

  const ai = inspection.aiAnalysis;
  const recColor = ai?.recommendation === 'ACCEPT' ? '#00E676' : ai?.recommendation === 'REJECT' ? '#FF4B6B' : ai?.recommendation === 'CONDITIONAL_ACCEPT' ? '#FFB300' : '#00D4FF';

  return (
    <div>
      <Topbar title={`Inspection: ${inspection.batchNumber}`} subtitle={`Part: ${inspection.partNumber} · ${inspection.vehicleModel}`} />
      <div style={{ padding: '24px' }} ref={reportRef}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => router.back()} className="btn-ghost">
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{
              padding: '6px 16px', borderRadius: 10,
              background: `${recColor}18`, border: `1px solid ${recColor}35`,
              color: recColor, fontSize: 13, fontWeight: 800,
            }}>
              {ai?.recommendation?.replace(/_/g, ' ') ?? inspection.status}
            </div>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setChatOpen(c => !c)} className="btn-secondary">
              <Brain size={15} /> AI Assistant
            </button>
            <button onClick={handlePrint} className="btn-secondary">
              <Printer size={15} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="btn-primary">
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>

        {/* Meta Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { icon: Building, label: 'OEM', value: inspection.oem?.name ?? '—', sub: inspection.oem?.country },
            { icon: User, label: 'Inspector', value: inspection.inspector?.name ?? '—', sub: inspection.inspector?.department },
            { icon: Clock, label: 'Duration', value: `${inspection.inspectionDuration ?? '—'} min`, sub: format(new Date(inspection.createdAt), 'MMM dd, yyyy HH:mm') },
            { icon: MapPin, label: 'GPS Location', value: inspection.gpsLocation ?? '—', sub: 'Tagged location' },
          ].map(({ icon: Ic, label, value, sub }, i) => (
            <div key={i} className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ic size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{value}</div>
              {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          {/* Left — Images + Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Image Viewer */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Inspection Images</h3>
              <ImageViewer images={inspection.images ?? []} boundingBoxes={ai?.boundingBoxes ?? []} />
            </div>

            {/* Tabs */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="tabs" style={{ marginBottom: 20 }}>
                {(['analysis', 'negotiation', 'checklist', 'notes'] as const).map(t => (
                  <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Analysis Tab */}
              {activeTab === 'analysis' && ai && (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Reasoning</div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{ai.reasoning}</p>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested Cause</div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{ai.suggestedCause}</p>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Action</div>
                    <p style={{ fontSize: 14, color: 'var(--primary-light)', lineHeight: 1.7, fontWeight: 600 }}>{ai.nextAction}</p>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'var(--warning-bg)', borderRadius: 10, border: '1px solid rgba(255,179,0,0.2)' }}>
                    <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 700, marginBottom: 4 }}>⚠️ AI Limitations</div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ai.limitations}</p>
                  </div>
                </div>
              )}

              {/* Negotiation Tab */}
              {activeTab === 'negotiation' && ai && (
                <div>
                  <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(0,102,204,0.08)', borderRadius: 12, border: '1px solid rgba(0,102,204,0.2)' }}>
                    <div style={{ fontSize: 12, color: 'var(--primary-light)', fontWeight: 700, marginBottom: 8 }}>NEGOTIATION SUMMARY</div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ai.negotiationSummary}</p>
                    <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>SUGGESTED AMOUNT</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#00E676' }}>${ai.suggestedNegotiationAmount?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Liability */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Liability Distribution</div>
                    {[
                      { label: 'OEM Liability', pct: ai.oemLiability, color: '#0066CC' },
                      { label: 'Customer Liability', pct: ai.customerLiability, color: '#FFB300' },
                      { label: 'Transport Liability', pct: ai.transportLiability, color: '#00D4FF' },
                    ].map((l, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
                          <span style={{ fontWeight: 700, color: l.color }}>{l.pct}%</span>
                        </div>
                        <div className="progress-bar">
                          <motion.div className="progress-fill" style={{ background: l.color }} initial={{ width: 0 }} animate={{ width: `${l.pct}%` }} transition={{ delay: i * 0.15, duration: 1 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Talking Points */}
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Talking Points</div>
                    {(ai.talkingPoints ?? []).map((tp: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < ai.talkingPoints.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                        <span style={{ color: 'var(--primary-light)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tp}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div style={{ marginTop: 20 }}>
                    <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }} placeholder="Add negotiation note..."
                      value={noteText} onChange={e => setNoteText(e.target.value)} />
                    <button onClick={() => addNoteMutation.mutate(noteText)} disabled={!noteText.trim() || addNoteMutation.isPending}
                      className="btn-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                      {addNoteMutation.isPending ? <Loader2 size={14} className="animate-spin-slow" /> : <MessageSquare size={14} />}
                      Add Note
                    </button>
                  </div>
                </div>
              )}

              {/* Checklist Tab */}
              {activeTab === 'checklist' && (
                <div>
                  {(inspection.checklist ?? []).map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < inspection.checklist.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                      {item.checked
                        ? <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        : <XCircle size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: 14, color: item.checked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.label}</span>
                      {item.checked && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Done</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div>
                  {(inspection.negotiationNotes ?? []).length === 0
                    ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No notes yet.</p>
                    : (inspection.negotiationNotes ?? []).map((note: any, i: number) => (
                      <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{note.content}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                      </div>
                    ))
                  }
                  <div style={{ marginTop: 16 }}>
                    <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }} placeholder="Add note..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                    <button onClick={() => addNoteMutation.mutate(noteText)} disabled={!noteText.trim()} className="btn-primary" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                      <MessageSquare size={14} /> Add Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Sidebar Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Confidence Gauge */}
            {ai && (
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>AI Confidence</h3>
                <ConfidenceGauge value={ai.confidence} />
                <div className="divider" />
                <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Severity Level</div>
                <SeverityBar severity={ai.severity} />
              </div>
            )}

            {/* Cost Summary */}
            {ai && (
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} style={{ color: 'var(--accent)' }} /> Cost Summary
                </h3>
                {[
                  { label: 'Repair', value: ai.repairCost, color: '#00E676' },
                  { label: 'Replacement', value: ai.replacementCost, color: '#FF4B6B' },
                  { label: 'Labor', value: ai.laborCost, color: '#FFB300' },
                  { label: 'Downtime', value: ai.downtimeCost, color: '#00D4FF' },
                  { label: 'Warranty', value: ai.warrantyImpact, color: '#BB86FC' },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--glass-border)' : 'none', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                    <span style={{ fontWeight: 700, color: c.color }}>${c.value?.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>Total Impact</span>
                  <span style={{ fontWeight: 900, color: '#FF4B6B' }}>
                    ${((ai.repairCost ?? 0) + (ai.downtimeCost ?? 0) + (ai.warrantyImpact ?? 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Supervisor Override */}
            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} style={{ color: 'var(--primary-light)' }} /> Override Status
                </h3>
                {inspection.supervisorNote && (
                  <div style={{ padding: '10px 14px', background: 'rgba(0,212,255,0.08)', borderRadius: 8, border: '1px solid rgba(0,212,255,0.2)', marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--info)', display: 'block', marginBottom: 4 }}>Current Note:</strong>
                    {inspection.supervisorNote}
                  </div>
                )}
                <select className="select" value={overrideStatus} onChange={e => setOverrideStatus(e.target.value)} style={{ marginBottom: 10 }}>
                  <option value="">Select new status...</option>
                  {['ACCEPTED', 'REJECTED', 'MANUAL_REVIEW'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <textarea className="input" style={{ resize: 'none', height: 72, marginBottom: 10 }} placeholder="Reason for override..."
                  value={overrideNote} onChange={e => setOverrideNote(e.target.value)} />
                <button onClick={() => overrideMutation.mutate()} disabled={!overrideStatus || overrideMutation.isPending}
                  className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {overrideMutation.isPending ? <Loader2 size={14} className="animate-spin-slow" /> : <Shield size={14} />}
                  Apply Override
                </button>
              </div>
            )}

            {/* Return Reason */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Return Reason</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{inspection.returnReason}</p>
              <div className="divider" />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SUPPLIER</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{inspection.supplier?.name ?? '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>⭐ {inspection.supplier?.rating} rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 20, right: 20, width: 360, height: 480,
              background: 'var(--bg-800)', border: '1px solid var(--glass-border)',
              borderRadius: 20, display: 'flex', flexDirection: 'column',
              zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
            {/* Chat header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,102,204,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={16} style={{ color: 'var(--primary-light)' }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>AI Assistant</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
              </div>
              <button onClick={() => setChatOpen(false)} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>{m.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex' }}>
                  <div className="chat-bubble-ai" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ delay: i * 0.2, repeat: Infinity, duration: 0.8 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-light)' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick questions */}
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
              {['Why rejected?', 'What caused this?', 'What to tell OEM?', 'Repair cost?'].map(q => (
                <button key={q} onClick={() => { setChatInput(q); }}
                  style={{ flexShrink: 0, fontSize: 11, padding: '4px 10px', borderRadius: 12, background: 'rgba(0,102,204,0.15)', border: '1px solid rgba(0,102,204,0.25)', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600 }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 8 }}>
              <input className="input" style={{ flex: 1, padding: '8px 12px' }} placeholder="Ask anything..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="btn-primary" style={{ padding: '8px 14px' }}>
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
