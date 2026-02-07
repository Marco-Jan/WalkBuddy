// backend/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import statusRoutes from './routes/status';
import authRoutes from './routes/auth';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { initDb } from './db';
import messageRoutes from './routes/messages';
import blockRoutes from './routes/blocks';
import adminRoutes from './routes/admin';
import contactRoutes from './routes/contact';
import path from 'path';
import { authLimiter, messageLimiter, generalLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const SQLiteStore = connectSqlite3(session);

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  Kein SESSION_SECRET gesetzt – generiertes Secret wird bei Neustart ungültig. Setze SESSION_SECRET in .env!');
}

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

app.set('trust proxy', 1);


app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: './data',
    }) as unknown as session.Store,

    secret: SESSION_SECRET,
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
app.use('/contact', contactRoutes);





(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 Backend läuft auf http://localhost:${PORT}`);
  });
})();
