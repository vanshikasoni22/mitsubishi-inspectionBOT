import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import inspectionRoutes from './routes/inspection';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Build the allowed-origins list from env + hardcoded defaults.
// CORS_ORIGINS (plural) accepts a comma-separated list, e.g.:
//   https://mitsubishi-inspection-bot.vercel.app,http://localhost:3000
const ALLOWED_ORIGINS: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://mitsubishi-inspection-bot.vercel.app',
  // Any extra origins injected at deploy time via env var
  ...(process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean),
];

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Allow server-to-server requests (no Origin header) and listed origins.
    if (!requestOrigin || ALLOWED_ORIGINS.includes(requestOrigin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${requestOrigin}`);
      callback(new Error(`CORS policy: origin "${requestOrigin}" is not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

// ─── Static Files ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Swagger Docs ───────────────────────────────────────────────────────────
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'AutoInspect AI API', version: '1.0.0', description: 'Enterprise AI Automotive Parts Inspection Platform' },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/inspection', inspectionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AutoInspect AI Backend', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message ?? 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║      AutoInspect AI Backend v1.0.0        ║
  ║   Enterprise Automotive Inspection API    ║
  ╠═══════════════════════════════════════════╣
  ║  Server:  http://localhost:${PORT}           ║
  ║  Docs:    http://localhost:${PORT}/api/docs  ║
  ║  Health:  http://localhost:${PORT}/health    ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
