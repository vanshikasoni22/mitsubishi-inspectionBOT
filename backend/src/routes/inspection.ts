import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db, Inspection, ChecklistItem } from '../data/store';
import { authenticate, requireRole } from '../middleware/auth';
import { aiService } from '../services/AIService';

const router = Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

/**
 * @swagger
 * /api/inspection/create:
 *   post:
 *     summary: Create new inspection
 */
router.post('/create', authenticate, (req: Request, res: Response) => {
  const { partNumber, oemId, supplierId, vehicleModel, batchNumber, returnReason } = req.body;
  if (!partNumber || !oemId || !supplierId || !vehicleModel || !batchNumber || !returnReason) {
    return res.status(400).json({ success: false, message: 'All part fields are required' });
  }

  // Check for duplicate
  const existing = db.inspections.find(i =>
    i.partNumber === partNumber && i.batchNumber === batchNumber &&
    new Date().getTime() - i.createdAt.getTime() < 7 * 86400000
  );

  const inspection: Inspection = {
    id: uuidv4(),
    partNumber,
    oemId,
    supplierId,
    vehicleModel,
    batchNumber,
    returnReason,
    status: 'PENDING',
    inspectorId: req.user!.userId,
    images: [],
    negotiationNotes: [],
    checklist: [
      { id: uuidv4(), label: 'Part number verified', checked: false },
      { id: uuidv4(), label: 'Serial number recorded', checked: false },
      { id: uuidv4(), label: 'Packaging condition noted', checked: false },
      { id: uuidv4(), label: 'Multiple photos captured', checked: false },
      { id: uuidv4(), label: 'Barcode scanned', checked: false },
      { id: uuidv4(), label: 'OEM specification checked', checked: false },
      { id: uuidv4(), label: 'Damage area measured', checked: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.addInspection(inspection);
  db.addAuditLog({
    userId: req.user!.userId,
    action: 'INSPECTION_CREATED',
    entityType: 'Inspection',
    entityId: inspection.id,
    metadata: { partNumber, oemId, supplierId },
    ipAddress: req.ip ?? '0.0.0.0',
  });

  return res.status(201).json({
    success: true,
    inspection,
    duplicate: existing ? { id: existing.id, createdAt: existing.createdAt } : null,
  });
});

/**
 * @swagger
 * /api/inspection/{id}/upload:
 *   post:
 *     summary: Upload images for inspection
 */
router.post('/:id/upload', authenticate, upload.array('images', 10), (req: Request, res: Response) => {
  const inspection = db.findInspectionById(req.params.id);
  if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found' });

  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ success: false, message: 'No images uploaded' });

  const newImages = files.map((file, i) => ({
    id: uuidv4(),
    inspectionId: inspection.id,
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    order: inspection.images.length + i,
    uploadedAt: new Date(),
  }));

  inspection.images.push(...newImages);
  inspection.status = 'IN_PROGRESS';
  inspection.updatedAt = new Date();

  // Update checklist
  const photosItem = inspection.checklist.find(c => c.label.includes('photos'));
  if (photosItem) photosItem.checked = true;

  return res.json({ success: true, images: newImages, inspection });
});

/**
 * @swagger
 * /api/inspection/{id}/analyze:
 *   post:
 *     summary: Run AI analysis on inspection
 */
router.post('/:id/analyze', authenticate, async (req: Request, res: Response) => {
  const inspection = db.findInspectionById(req.params.id);
  if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found' });
  if (!inspection.images.length) {
    return res.status(400).json({ success: false, message: 'Upload at least one image before analyzing' });
  }

  try {
    const imageUrls = inspection.images.map(img => img.url);
    const result = await aiService.analyzeImages(imageUrls, inspection.partNumber, inspection.returnReason);

    const aiAnalysis = {
      id: uuidv4(),
      inspectionId: inspection.id,
      ...result,
      analyzedAt: new Date(),
    };

    inspection.aiAnalysis = aiAnalysis;
    inspection.status =
      result.recommendation === 'ACCEPT' ? 'ACCEPTED' :
      result.recommendation === 'REJECT' ? 'REJECTED' :
      result.recommendation === 'CONDITIONAL_ACCEPT' ? 'ACCEPTED' :
      'MANUAL_REVIEW';
    inspection.completedAt = new Date();
    inspection.inspectionDuration = Math.round((inspection.completedAt.getTime() - inspection.createdAt.getTime()) / 60000);
    inspection.updatedAt = new Date();

    // Update inspector stats
    const inspector = db.findUserById(inspection.inspectorId);
    if (inspector) {
      inspector.totalInspections += 1;
      inspector.averageTime = Math.round((inspector.averageTime * (inspector.totalInspections - 1) + (inspection.inspectionDuration ?? 20)) / inspector.totalInspections);
    }

    db.addAuditLog({
      userId: req.user!.userId,
      action: 'INSPECTION_ANALYZED',
      entityType: 'Inspection',
      entityId: inspection.id,
      metadata: { damageType: result.damageType, confidence: result.confidence, recommendation: result.recommendation },
      ipAddress: req.ip ?? '0.0.0.0',
    });

    db.addNotification({
      userId: inspection.inspectorId,
      type: 'INSPECTION_COMPLETED',
      title: 'Analysis Complete',
      message: `Inspection ${inspection.batchNumber} analyzed. Recommendation: ${result.recommendation}`,
      read: false,
    });

    return res.json({ success: true, inspection, aiAnalysis });
  } catch (err) {
    console.error('AI analysis failed:', err);
    return res.status(500).json({ success: false, message: 'AI analysis failed. Please try again.' });
  }
});

/**
 * @swagger
 * /api/inspection/history:
 *   get:
 *     summary: Get inspection history (paginated)
 */
router.get('/history', authenticate, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string)?.toLowerCase() ?? '';
  const status = req.query.status as string;
  const oemId = req.query.oemId as string;
  const supplierId = req.query.supplierId as string;
  const sortBy = (req.query.sortBy as string) ?? 'createdAt';
  const sortOrder = (req.query.sortOrder as string) ?? 'desc';

  let filtered = db.inspections.filter(i => {
    if (req.user!.role === 'INSPECTOR' && i.inspectorId !== req.user!.userId) return false;
    if (search && !i.partNumber.toLowerCase().includes(search) && !i.batchNumber.toLowerCase().includes(search)) return false;
    if (status && i.status !== status) return false;
    if (oemId && i.oemId !== oemId) return false;
    if (supplierId && i.supplierId !== supplierId) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Inspection];
    const bVal = b[sortBy as keyof Inspection];
    const cmp = aVal instanceof Date ? aVal.getTime() - (bVal as Date).getTime() : String(aVal).localeCompare(String(bVal));
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const total = filtered.length;
  const items = filtered.slice((page - 1) * limit, page * limit).map(i => ({
    ...i,
    oem: db.oems.find(o => o.id === i.oemId),
    supplier: db.suppliers.find(s => s.id === i.supplierId),
    inspector: (() => { const u = db.findUserById(i.inspectorId); if (!u) return null; const { passwordHash: _, ...safe } = u; return safe; })(),
  }));

  return res.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/**
 * @swagger
 * /api/inspection/{id}:
 *   get:
 *     summary: Get inspection by ID
 */
router.get('/:id', authenticate, (req: Request, res: Response) => {
  const inspection = db.findInspectionById(req.params.id);
  if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found' });

  const oem = db.oems.find(o => o.id === inspection.oemId);
  const supplier = db.suppliers.find(s => s.id === inspection.supplierId);
  const inspector = (() => { const u = db.findUserById(inspection.inspectorId); if (!u) return null; const { passwordHash: _, ...safe } = u; return safe; })();
  const supervisor = inspection.supervisorId ? (() => { const u = db.findUserById(inspection.supervisorId!); if (!u) return null; const { passwordHash: _, ...safe } = u; return safe; })() : null;

  return res.json({ success: true, inspection: { ...inspection, oem, supplier, inspector, supervisor } });
});

/**
 * @swagger
 * /api/inspection/{id}/checklist:
 *   put:
 *     summary: Update inspection checklist
 */
router.put('/:id/checklist', authenticate, (req: Request, res: Response) => {
  const inspection = db.findInspectionById(req.params.id);
  if (!inspection) return res.status(404).json({ success: false, message: 'Not found' });
  const { checklist } = req.body as { checklist: ChecklistItem[] };
  inspection.checklist = checklist;
  inspection.updatedAt = new Date();
  return res.json({ success: true, inspection });
});

/**
 * @swagger
 * /api/inspection/{id}/note:
 *   post:
 *     summary: Add negotiation note
 */
router.post('/:id/note', authenticate, (req: Request, res: Response) => {
  const inspection = db.findInspectionById(req.params.id);
  if (!inspection) return res.status(404).json({ success: false, message: 'Not found' });
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: 'Content required' });
  const note = {
    id: uuidv4(),
    inspectionId: inspection.id,
    content,
    authorId: req.user!.userId,
    createdAt: new Date(),
  };
  inspection.negotiationNotes.push(note);
  inspection.updatedAt = new Date();
  return res.json({ success: true, note });
});

/**
 * @swagger
 * /api/inspection/{id}/override:
 *   post:
 *     summary: Supervisor override recommendation
 */
router.post('/:id/override', authenticate, requireRole('ADMIN', 'SUPERVISOR'), (req: Request, res: Response) => {
  const inspection = db.findInspectionById(req.params.id);
  if (!inspection) return res.status(404).json({ success: false, message: 'Not found' });
  const { status, note } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Status required' });
  inspection.status = status;
  inspection.supervisorId = req.user!.userId;
  inspection.supervisorNote = note;
  inspection.updatedAt = new Date();
  db.addAuditLog({
    userId: req.user!.userId,
    action: 'STATUS_OVERRIDE',
    entityType: 'Inspection',
    entityId: inspection.id,
    metadata: { newStatus: status, note },
    ipAddress: req.ip ?? '0.0.0.0',
  });
  db.addNotification({
    userId: inspection.inspectorId,
    type: 'ADMIN_OVERRIDE',
    title: 'Recommendation Overridden',
    message: `Inspection ${inspection.batchNumber} status changed to ${status} by supervisor.`,
    read: false,
  });
  return res.json({ success: true, inspection });
});

/**
 * @swagger
 * /api/inspection/ai/chat:
 *   post:
 *     summary: AI chat assistant
 */
router.post('/ai/chat', authenticate, async (req: Request, res: Response) => {
  const { question, inspectionId } = req.body;
  if (!question) return res.status(400).json({ success: false, message: 'Question required' });
  const answer = await aiService.chat(question, inspectionId);
  return res.json({ success: true, answer });
});

export default router;
