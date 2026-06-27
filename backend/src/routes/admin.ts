import { Router, Request, Response } from 'express';
import { db } from '../data/store';
import { authenticate, requireRole } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const router = Router();
const adminOrSupervisor = requireRole('ADMIN', 'SUPERVISOR');

// ─── Users ─────────────────────────────────────────────────────────────────
router.get('/users', authenticate, adminOrSupervisor, (_req: Request, res: Response) => {
  const users = db.users.map(({ passwordHash: _, ...u }) => u);
  return res.json({ success: true, users });
});

router.post('/users', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ success: false, message: 'All fields required' });
  if (db.findUserByEmail(email)) return res.status(409).json({ success: false, message: 'Email taken' });
  const user = {
    id: uuidv4(), name, email, passwordHash: await bcrypt.hash(password, 10),
    role, department: department ?? 'General',
    totalInspections: 0, averageTime: 0, accuracyScore: 0,
    badges: [role.toUpperCase()], createdAt: new Date(), updatedAt: new Date(), isActive: true,
  };
  db.users.push(user as any);
  const { passwordHash: _, ...safe } = user;
  return res.status(201).json({ success: true, user: safe });
});

router.put('/users/:id', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  const user = db.findUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });
  const { name, role, department, isActive } = req.body;
  if (name) user.name = name;
  if (role) user.role = role;
  if (department) user.department = department;
  if (isActive !== undefined) user.isActive = isActive;
  user.updatedAt = new Date();
  const { passwordHash: _, ...safe } = user;
  return res.json({ success: true, user: safe });
});

router.delete('/users/:id', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db.users[idx].isActive = false;
  return res.json({ success: true, message: 'User deactivated' });
});

// ─── OEMs ──────────────────────────────────────────────────────────────────
router.get('/oems', authenticate, (_req: Request, res: Response) => {
  return res.json({ success: true, oems: db.oems });
});

router.post('/oems', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  const { name, country, contactEmail } = req.body;
  const oem = { id: uuidv4(), name, country, contactEmail, partnerSince: new Date().getFullYear(), totalParts: 0 };
  db.oems.push(oem);
  return res.status(201).json({ success: true, oem });
});

router.put('/oems/:id', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  const oem = db.oems.find(o => o.id === req.params.id);
  if (!oem) return res.status(404).json({ success: false, message: 'Not found' });
  Object.assign(oem, req.body);
  return res.json({ success: true, oem });
});

router.delete('/oems/:id', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  db.oems = db.oems.filter(o => o.id !== req.params.id);
  return res.json({ success: true, message: 'OEM deleted' });
});

// ─── Suppliers ─────────────────────────────────────────────────────────────
router.get('/suppliers', authenticate, (_req: Request, res: Response) => {
  return res.json({ success: true, suppliers: db.suppliers });
});

router.post('/suppliers', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  const { name, country, contactEmail, rating } = req.body;
  const supplier = { id: uuidv4(), name, country, contactEmail, rating: rating ?? 4.0, totalDeliveries: 0, defectRate: 0 };
  db.suppliers.push(supplier);
  return res.status(201).json({ success: true, supplier });
});

router.put('/suppliers/:id', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  const supplier = db.suppliers.find(s => s.id === req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Not found' });
  Object.assign(supplier, req.body);
  return res.json({ success: true, supplier });
});

router.delete('/suppliers/:id', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  db.suppliers = db.suppliers.filter(s => s.id !== req.params.id);
  return res.json({ success: true, message: 'Supplier deleted' });
});

// ─── Audit Logs ────────────────────────────────────────────────────────────
router.get('/audit-logs', authenticate, adminOrSupervisor, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const logs = db.auditLogs.slice((page - 1) * limit, page * limit).map(log => ({
    ...log,
    user: (() => { const u = db.findUserById(log.userId); if (!u) return null; const { passwordHash: _, ...safe } = u; return safe; })(),
  }));
  return res.json({ success: true, logs, total: db.auditLogs.length });
});

// ─── System Health ─────────────────────────────────────────────────────────
router.get('/health', authenticate, adminOrSupervisor, (_req: Request, res: Response) => {
  return res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    dataStore: {
      users: db.users.length,
      inspections: db.inspections.length,
      oems: db.oems.length,
      suppliers: db.suppliers.length,
      auditLogs: db.auditLogs.length,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Inspector Leaderboard ─────────────────────────────────────────────────
router.get('/leaderboard', authenticate, (_req: Request, res: Response) => {
  const inspectors = db.users
    .filter(u => u.role === 'INSPECTOR' && u.isActive)
    .map(({ passwordHash: _, ...u }) => u)
    .sort((a, b) => b.totalInspections - a.totalInspections)
    .slice(0, 10);
  return res.json({ success: true, leaderboard: inspectors });
});

export default router;
