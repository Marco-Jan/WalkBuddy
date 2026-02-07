// backend/src/app.ts  – Express-App ohne listen(), für Tests importierbar
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import statusRoutes from './routes/status';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import blockRoutes from './routes/blocks';
import adminRoutes from './routes/admin';
import path from 'path';
import { authLimiter, messageLimiter, generalLimiter } from './middleware/rateLimiter';
import { dbPromise } from './db';

// In-Memory Cache: userId -> letzter Update-Zeitpunkt (max alle 60s updaten)
const lastActiveCache = new Map<string, number>();
const LAST_ACTIVE_INTERVAL = 60_000; // 60 Sekunden

export function createApp() {

  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cors({
    origin: process.env.CORS_ORIGIN || (isProduction ? 'https://walk-buddy.app' : 'http://localhost:3001'),
    credentials: true,
  }));
  app.set('trust proxy', 1);


  app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

  // lastActiveAt Tracking (max alle 60s pro User)
  app.use(async (req, _res, next) => {
    const userId = req.session?.userId;
    if (userId) {
      const now = Date.now();
      const last = lastActiveCache.get(userId) || 0;
      if (now - last > LAST_ACTIVE_INTERVAL) {
        lastActiveCache.set(userId, now);
        try {
          const db = await dbPromise;
          await db.run(`UPDATE users SET lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);
        } catch { /* ignore */ }
      }
    }
    next();
  });

  app.use(generalLimiter);
  app.use('/auth/login', authLimiter);
  app.use('/auth/register', authLimiter);
  app.use('/auth/forgot-password', authLimiter);
  app.use('/auth/reset-password', authLimiter);
  app.use('/auth/resend-verification', authLimiter);
  app.use('/auth', authRoutes);
  app.use('/status', statusRoutes);
  app.use('/messages', messageLimiter, messageRoutes);
  app.use('/blocks', blockRoutes);
  app.use('/admin', adminRoutes);

  return app;
}
