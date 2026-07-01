'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  ChevronRight, ChevronLeft, Upload, Camera, X, CheckCircle,
  Loader2, Brain, Zap, FileText, AlertTriangle, Shield
} from 'lucide-react';
import { inspectionApi, adminApi } from '@/lib/api';
import Topbar from '@/components/Topbar';
import CameraCapture from '@/components/CameraCapture';

const RETURN_REASONS = [
  'Customer Complaint - Cosmetic Damage',
  'Assembly Line Rejection - Dimensional',
  'Warranty Claim - Premature Failure',
  'Incoming Quality Control Rejection',
  'Transport Damage Claim',
  'Wrong Part Delivered',
  'Batch Recall',
  'End of Life Return',
  'Quality Audit Finding',
  'Customer Change of Mind',
];

const VEHICLE_MODELS = [
  'BMW 5 Series 2023', 'Mercedes C-Class 2024', 'Audi A4 2023',
  'Toyota Camry 2024', 'Ford F-150 2023', 'Honda Accord 2024',
  'Volkswagen Golf 2023', 'Hyundai Sonata 2024', 'Kia EV6 2023',
  'Tesla Model 3 2024', 'Volvo XC90 2023', 'BMW iX 2024',
];

const STEPS = ['Part Details', 'Capture Images', 'AI Analysis'];

export default function NewInspectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [duplicate, setDuplicate] = useState<any>(null);
  const [cameraMode, setCameraMode] = useState(false);

  const handleCapture = (file: File) => {
    const newFiles = [...uploadedFiles, file].slice(0, 10);
    setUploadedFiles(newFiles);
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
  };

  const [form, setForm] = useState({
    partNumber: '', oemId: '', supplierId: '', vehicleModel: '',
    batchNumber: '', returnReason: '',
  });

  const { data: oemsData } = useQuery({ queryKey: ['oems'], queryFn: () => adminApi.getOems().then(r => r.data.oems) });
  const { data: suppliersData } = useQuery({ queryKey: ['suppliers'], queryFn: () => adminApi.getSuppliers().then(r => r.data.suppliers) });

  const oems = oemsData ?? [];
  const suppliers = suppliersData ?? [];

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = [...uploadedFiles, ...accepted].slice(0, 10);
    setUploadedFiles(newFiles);
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    toast.success(`${accepted.length} image(s) added`);
  }, [uploadedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: true, maxSize: 10 * 1024 * 1024,
  });

  const removeImage = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  // Step 1: Create inspection
  const handleCreateInspection = async () => {
    if (!form.partNumber || !form.oemId || !form.supplierId || !form.vehicleModel || !form.batchNumber || !form.returnReason) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await inspectionApi.create(form);
      setInspectionId(res.data.inspection.id);
      if (res.data.duplicate) {
        setDuplicate(res.data.duplicate);
        toast('⚠️ Similar inspection found recently!', { icon: '⚠️' });
      }
      setStep(1);
      toast.success('Inspection created');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to create inspection');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload images
  const handleUploadImages = async () => {
    if (!uploadedFiles.length) { toast.error('Please upload at least one image'); return; }
    if (!inspectionId) return;
    setLoading(true);
    try {
      await inspectionApi.uploadImages(inspectionId, uploadedFiles);
      setStep(2);
      // Auto-start analysis
      startAnalysis();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: AI Analysis
  const startAnalysis = async () => {
    if (!inspectionId) return;
    setAnalyzing(true);
    setAnalysisProgress(0);

    // Progress animation
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.random() * 12;
      });
    }, 200);

    try {
      const res = await inspectionApi.analyze(inspectionId);
      clearInterval(interval);
      setAnalysisProgress(100);
      setAnalysisResult(res.data);
      toast.success('AI analysis complete!');
    } catch (err: any) {
      clearInterval(interval);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (rec: string) => {
    if (rec === 'ACCEPT') return '#00E676';
    if (rec === 'REJECT') return '#FF4B6B';
    if (rec === 'CONDITIONAL_ACCEPT') return '#FFB300';
    return '#00D4FF';
  };

  const getSeverityColor = (s: string) => {
    if (s === 'MINOR') return '#00E676';
    if (s === 'MODERATE') return '#FFB300';
    if (s === 'MAJOR') return '#FF7043';
    return '#FF4B6B';
  };

  return (
    <div>
      <Topbar title="New Inspection" subtitle="AI-powered defect analysis in 3 steps" />
      <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div className={`step-circle ${i < step ? 'step-completed' : i === step ? 'step-active' : 'step-inactive'}`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: i === step ? 'var(--text-primary)' : i < step ? 'var(--success)' : 'var(--text-muted)' }}>{s}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step {i + 1}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 16px', background: i < step ? 'linear-gradient(90deg, var(--success), var(--primary))' : 'var(--glass-border)', borderRadius: 1, transition: 'background 0.5s' }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 0: Part Details ── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Part Information</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Enter the details about the returned automotive part.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label className="label">Part Number *</label>
                    <input className="input" placeholder="e.g. ENG-45678-A" value={form.partNumber}
                      onChange={e => setForm({ ...form, partNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Batch Number *</label>
                    <input className="input" placeholder="e.g. BATCH-2024-0001" value={form.batchNumber}
                      onChange={e => setForm({ ...form, batchNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">OEM *</label>
                    <select className="select" value={form.oemId} onChange={e => setForm({ ...form, oemId: e.target.value })}>
                      <option value="">Select OEM...</option>
                      {oems.map((o: any) => <option key={o.id} value={o.id}>{o.name} ({o.country})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Supplier *</label>
                    <select className="select" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                      <option value="">Select Supplier...</option>
                      {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name} (⭐ {s.rating})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Vehicle Model *</label>
                    <select className="select" value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })}>
                      <option value="">Select Vehicle...</option>
                      {VEHICLE_MODELS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Return Reason *</label>
                    <select className="select" value={form.returnReason} onChange={e => setForm({ ...form, returnReason: e.target.value })}>
                      <option value="">Select reason...</option>
                      {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {duplicate && (
                  <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--warning-bg)', border: '1px solid rgba(255,179,0,0.3)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--warning)' }}>⚠️ A similar inspection for this part was recorded {new Date(duplicate.createdAt).toLocaleDateString()}. Please confirm this is a new return.</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
                  <button onClick={handleCreateInspection} disabled={loading} className="btn-primary" style={{ padding: '11px 24px' }}>
                    {loading ? <Loader2 size={16} className="animate-spin-slow" /> : <ChevronRight size={16} />}
                    {loading ? 'Creating...' : 'Next: Upload Images'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Capture Images ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Capture Images</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Upload multiple high-resolution images for best AI analysis results. Max 10 images, 10MB each.</p>

                {/* Upload Method Tabs */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <button 
                    onClick={() => setCameraMode(false)}
                    type="button"
                    className={`btn-ghost ${!cameraMode ? 'active' : ''}`}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 8,
                      background: !cameraMode ? 'rgba(0, 102, 204, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: !cameraMode ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                      color: !cameraMode ? 'var(--primary-light)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={16} /> File Upload
                  </button>
                  <button 
                    onClick={() => setCameraMode(true)}
                    type="button"
                    className={`btn-ghost ${cameraMode ? 'active' : ''}`}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 8,
                      background: cameraMode ? 'rgba(0, 102, 204, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: cameraMode ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                      color: cameraMode ? 'var(--primary-light)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={16} /> Live Camera (OpenCV)
                  </button>
                </div>

                {cameraMode ? (
                  <div style={{ marginBottom: 24 }}>
                    <CameraCapture 
                      onCapture={handleCapture}
                      onClose={() => setCameraMode(false)}
                    />
                  </div>
                ) : (
                  /* Drag Zone */
                  <div {...getRootProps()} className={`drag-zone ${isDragActive ? 'drag-over' : ''}`} style={{ marginBottom: 24 }}>
                    <input {...getInputProps()} />
                    <Upload size={36} style={{ color: isDragActive ? 'var(--primary-light)' : 'var(--text-muted)', marginBottom: 12 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: isDragActive ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                      {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse files</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                      {['JPG', 'PNG', 'WEBP', 'HEIC'].map(f => (
                        <span key={f} style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 6, color: 'var(--text-muted)', fontWeight: 600 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Quality Tips */}
                <div style={{ padding: '12px 16px', background: 'rgba(0,102,204,0.06)', borderRadius: 10, border: '1px solid rgba(0,102,204,0.15)', marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-light)', marginBottom: 8 }}>📸 Photo Quality Tips for Best AI Results</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      '✅ Good lighting, no shadows', '✅ Multiple angles', '✅ Damage area in center', '✅ Clear focus, no blur',
                      '❌ Avoid strong reflections', '❌ Avoid extreme angles', '❌ No dark/dim images', '❌ No obstructions',
                    ].map((t, i) => <span key={i} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t}</span>)}
                  </div>
                </div>

                {/* Image Grid */}
                {previewUrls.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                    {previewUrls.map((url, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <img src={url} alt={`Image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeImage(i)}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} color="white" />
                        </button>
                        <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px', color: 'white' }}>#{i + 1}</div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => setStep(0)} className="btn-secondary">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button onClick={handleUploadImages} disabled={loading || !uploadedFiles.length} className="btn-primary" style={{ padding: '11px 24px' }}>
                    {loading ? <Loader2 size={16} className="animate-spin-slow" /> : <Brain size={16} />}
                    {loading ? `Uploading ${uploadedFiles.length} image(s)...` : `Analyze with AI (${uploadedFiles.length} images)`}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: AI Analysis ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {analyzing ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#0066CC', borderRightColor: '#00D4FF', margin: '0 auto 24px' }} />
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>AI Analysis in Progress</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                    Scanning {uploadedFiles.length} image(s) for defects...
                  </p>
                  <div style={{ maxWidth: 400, margin: '0 auto' }}>
                    <div className="progress-bar" style={{ height: 8, marginBottom: 12 }}>
                      <motion.div className="progress-fill" style={{ background: 'linear-gradient(90deg, #0066CC, #00D4FF)', width: `${analysisProgress}%` }} />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{Math.round(analysisProgress)}% complete</p>
                  </div>
                  <div style={{ marginTop: 32, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['Pattern Recognition', 'Defect Detection', 'Severity Assessment', 'Cost Estimation'].map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: analysisProgress > i * 25 ? 1 : 0.3 }}
                        style={{ fontSize: 12, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {analysisProgress > i * 25 + 15 ? <CheckCircle size={12} style={{ color: 'var(--success)' }} /> : <Loader2 size={12} className="animate-spin-slow" />}
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : analysisResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Verdict Screen Banner */}
                  {(() => {
                    const isAcceptable = analysisResult.aiAnalysis?.recommendation === 'ACCEPT' || analysisResult.aiAnalysis?.recommendation === 'CONDITIONAL_ACCEPT';
                    const verdictText = isAcceptable ? 'ACCEPT' : 'REJECT';
                    const verdictColor = isAcceptable ? '#00E676' : '#FF4B6B';
                    const verdictBg = isAcceptable ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 75, 107, 0.08)';
                    const verdictBorder = isAcceptable ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 75, 107, 0.25)';
                    
                    return (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        style={{
                          background: verdictBg,
                          border: `2px solid ${verdictBorder}`,
                          borderRadius: '16px',
                          padding: '36px',
                          textAlign: 'center',
                          boxShadow: `0 8px 32px ${isAcceptable ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 75, 107, 0.15)'}`,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Glow effect */}
                        <div style={{
                          position: 'absolute',
                          top: '-50%',
                          left: '-50%',
                          right: '-50%',
                          bottom: '-50%',
                          background: `radial-gradient(circle, ${verdictColor}15 0%, transparent 70%)`,
                          pointerEvents: 'none',
                          zIndex: 0
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            background: isAcceptable ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 75, 107, 0.15)',
                            borderRadius: '50px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            color: verdictColor,
                            marginBottom: '16px',
                            border: `1px solid ${verdictColor}30`,
                            textTransform: 'uppercase'
                          }}>
                            AI DECISION VERDICT
                          </span>
                          
                          <h1 style={{
                            fontSize: '64px',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            margin: '0 0 12px 0',
                            color: verdictColor,
                            textShadow: `0 0 20px ${verdictColor}40`,
                            lineHeight: 1
                          }}>
                            {verdictText}
                          </h1>
                          
                          <p style={{
                            fontSize: '15px',
                            color: 'var(--text-primary)',
                            fontWeight: 500,
                            maxWidth: '600px',
                            margin: '0 auto 24px',
                            lineHeight: 1.6
                          }}>
                            {analysisResult.aiAnalysis?.summaryText}
                          </p>

                          {/* Key Metrics */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
                            {[
                              { label: 'Damage Type', value: analysisResult.aiAnalysis?.damageType?.replace(/_/g, ' ') },
                              { label: 'AI Confidence', value: `${analysisResult.aiAnalysis?.confidence}%` },
                              { label: 'Severity', value: analysisResult.aiAnalysis?.severity, color: getSeverityColor(analysisResult.aiAnalysis?.severity) },
                              { label: 'Risk Score', value: analysisResult.aiAnalysis?.riskScore },
                            ].map((m, i) => (
                              <div key={i} style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 10, border: '1px solid var(--glass-border)', backdropFilter: 'blur(4px)' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: m.color ?? 'var(--text-primary)' }}>{m.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Confidence Gauge */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* AI Reasoning */}
                    <div className="glass-card" style={{ padding: 24 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Brain size={16} style={{ color: 'var(--primary-light)' }} /> AI Reasoning
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{analysisResult.aiAnalysis?.reasoning}</p>
                      <div style={{ padding: '10px 14px', background: 'rgba(255,179,0,0.08)', borderRadius: 8, border: '1px solid rgba(255,179,0,0.2)' }}>
                        <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, marginBottom: 4 }}>⚠️ AI Limitations</div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{analysisResult.aiAnalysis?.limitations}</p>
                      </div>
                    </div>

                    {/* Cost Estimator */}
                    <div className="glass-card" style={{ padding: 24 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} style={{ color: 'var(--accent)' }} /> Cost Estimates
                      </h3>
                      {[
                        { label: 'Repair Cost', value: analysisResult.aiAnalysis?.repairCost, color: '#00E676' },
                        { label: 'Replacement Cost', value: analysisResult.aiAnalysis?.replacementCost, color: '#FF4B6B' },
                        { label: 'Labor Cost', value: analysisResult.aiAnalysis?.laborCost, color: '#FFB300' },
                        { label: 'Downtime Impact', value: analysisResult.aiAnalysis?.downtimeCost, color: '#00D4FF' },
                        { label: 'Warranty Impact', value: analysisResult.aiAnalysis?.warrantyImpact, color: '#BB86FC' },
                      ].map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--glass-border)' : 'none' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: c.color }}>${c.value?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Negotiation Points */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Shield size={16} style={{ color: 'var(--success)' }} /> Negotiation Talking Points
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{analysisResult.aiAnalysis?.negotiationSummary}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(analysisResult.aiAnalysis?.talkingPoints ?? []).map((tp: string, i: number) => (
                        <div key={i} style={{ padding: '10px 14px', background: 'rgba(0,102,204,0.06)', borderRadius: 8, border: '1px solid rgba(0,102,204,0.15)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          • {tp}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => router.push('/inspection/history')} className="btn-secondary">
                      <FileText size={16} /> View History
                    </button>
                    {inspectionId && (
                      <button onClick={() => router.push(`/inspection/${inspectionId}`)} className="btn-primary" style={{ padding: '11px 24px' }}>
                        <FileText size={16} /> Full Report
                      </button>
                    )}
                    <button onClick={() => {
                      setStep(0); setInspectionId(null); setUploadedFiles([]); setPreviewUrls([]);
                      setAnalysisResult(null); setAnalysisProgress(0);
                      setForm({ partNumber: '', oemId: '', supplierId: '', vehicleModel: '', batchNumber: '', returnReason: '' });
                    }} className="btn-secondary">
                      New Inspection
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
