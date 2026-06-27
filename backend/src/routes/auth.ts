import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../data/store';
import { authenticate, generateToken, JWTPayload } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  const user = db.findUserByEmail(email);
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  const payload: JWTPayload = { userId: user.id, email: user.email, role: user.role };
  const token = generateToken(payload);
  db.addAuditLog({ userId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id, metadata: {}, ipAddress: req.ip ?? '0.0.0.0' });
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ success: true, token, user: safeUser });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role = 'INSPECTOR', department = 'General' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password required' });
  }
  if (db.findUserByEmail(email)) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    role: role as 'ADMIN' | 'INSPECTOR' | 'SUPERVISOR',
    department,
    totalInspections: 0,
    averageTime: 0,
    accuracyScore: 0,
    badges: [role.toUpperCase()],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };
  db.users.push(newUser);
  const payload: JWTPayload = { userId: newUser.id, email: newUser.email, role: newUser.role };
  const token = generateToken(payload);
  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({ success: true, token, user: safeUser });
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 */
router.get('/profile', authenticate, (req: Request, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update profile
 */
router.put('/profile', authenticate, (req: Request, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const { name, phone, department } = req.body;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (department) user.department = department;
  user.updatedAt = new Date();
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

export default router;
