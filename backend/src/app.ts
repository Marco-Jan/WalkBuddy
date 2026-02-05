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

export function createApp() {
  const app = express();

  app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
  }));

  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

  app.use('/auth', authRoutes);
  app.use('/status', statusRoutes);
  app.use('/messages', messageRoutes);
  app.use('/blocks', blockRoutes);
  app.use('/admin', adminRoutes);

  return app;
}
