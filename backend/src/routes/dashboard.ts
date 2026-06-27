import { Router, Request, Response } from 'express';
import { db } from '../data/store';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard KPI statistics
 */
router.get('/stats', authenticate, (_req: Request, res: Response) => {
  const stats = db.getDashboardStats();
  return res.json({ success: true, ...stats });
});

/**
 * @swagger
 * /api/dashboard/charts:
 *   get:
 *     summary: Get chart data
 */
router.get('/charts', authenticate, (_req: Request, res: Response) => {
  const charts = db.getChartData();
  return res.json({ success: true, ...charts });
});

/**
 * @swagger
 * /api/dashboard/activity:
 *   get:
 *     summary: Get recent activity
 */
router.get('/activity', authenticate, (_req: Request, res: Response) => {
  const recentLogs = db.auditLogs.slice(0, 20).map(log => {
    const user = db.findUserById(log.userId);
    return { ...log, userName: user?.name ?? 'Unknown', userRole: user?.role };
  });
  return res.json({ success: true, activity: recentLogs });
});

/**
 * @swagger
 * /api/dashboard/notifications:
 *   get:
 *     summary: Get user notifications
 */
router.get('/notifications', authenticate, (req: Request, res: Response) => {
  const notifications = db.notifications.filter(n => n.userId === req.user!.userId);
  return res.json({ success: true, notifications });
});

/**
 * @swagger
 * /api/dashboard/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 */
router.put('/notifications/:id/read', authenticate, (req: Request, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) notif.read = true;
  return res.json({ success: true });
});

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get analytics data
 */
router.get('/analytics', authenticate, (_req: Request, res: Response) => {
  const inspections = db.inspections;

  // Top damaged parts
  const partCounts: Record<string, number> = {};
  inspections.forEach(i => {
    partCounts[i.partNumber] = (partCounts[i.partNumber] ?? 0) + 1;
  });
  const topParts = Object.entries(partCounts)
    .map(([part, count]) => ({ part, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Supplier comparison
  const supplierStats = db.suppliers.map(s => {
    const sInspections = inspections.filter(i => i.supplierId === s.id);
    const rejected = sInspections.filter(i => i.status === 'REJECTED').length;
    return {
      name: s.name,
      total: sInspections.length,
      rejected,
      defectRate: sInspections.length > 0 ? Math.round((rejected / sInspections.length) * 100) : 0,
      rating: s.rating,
    };
  }).sort((a, b) => b.total - a.total);

  // OEM comparison
  const oemStats = db.oems.map(o => {
    const oInspections = inspections.filter(i => i.oemId === o.id);
    const accepted = oInspections.filter(i => i.status === 'ACCEPTED').length;
    return {
      name: o.name,
      total: oInspections.length,
      accepted,
      acceptRate: oInspections.length > 0 ? Math.round((accepted / oInspections.length) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total);

  // Monthly stats (last 6 months)
  const monthly = [];
  for (let m = 5; m >= 0; m--) {
    const date = new Date();
    date.setMonth(date.getMonth() - m);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthInspections = inspections.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    monthly.push({
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      total: monthInspections.length,
      accepted: monthInspections.filter(i => i.status === 'ACCEPTED').length,
      rejected: monthInspections.filter(i => i.status === 'REJECTED').length,
      avgConfidence: monthInspections.length > 0
        ? Math.round(monthInspections.reduce((sum, i) => sum + (i.aiAnalysis?.confidence ?? 0), 0) / monthInspections.length)
        : 0,
    });
  }

  // KPIs
  const withAI = inspections.filter(i => i.aiAnalysis);
  const avgConfidence = withAI.length > 0
    ? Math.round(withAI.reduce((sum, i) => sum + (i.aiAnalysis!.confidence), 0) / withAI.length)
    : 0;
  const avgRepairCost = withAI.length > 0
    ? Math.round(withAI.reduce((sum, i) => sum + (i.aiAnalysis!.repairCost), 0) / withAI.length)
    : 0;

  return res.json({
    success: true,
    topParts,
    supplierStats,
    oemStats,
    monthly,
    kpis: { avgConfidence, avgRepairCost, totalInspections: inspections.length },
    ...db.getChartData(),
  });
});

export default router;
