import { Router } from 'express';
import { dbPromise } from '../db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein.';
  if (!/[a-z]/.test(pw)) return 'Passwort muss mindestens einen Kleinbuchstaben enthalten.';
  if (!/[A-Z]/.test(pw)) return 'Passwort muss mindestens einen Großbuchstaben enthalten.';
  if (!/[0-9]/.test(pw)) return 'Passwort muss mindestens eine Zahl enthalten.';
  if (!/[^a-zA-Z0-9]/.test(pw)) return 'Passwort muss mindestens ein Sonderzeichen enthalten.';
  return null;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: (Number(process.env.SMTP_PORT) || 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
const MAIL_FROM = process.env.SMTP_FROM || 'noreply@walkbuddy.de';
const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const router = Router();

// Multer config for profile pictures
const uploadDir = path.join(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien erlaubt'));
    }
  },
});

// Helfer: User ohne sensible Daten zurückgeben
function sanitizeUser(u: any) {
  const { password, encryptedPrivateKey, ...safe } = u;
  return safe;
}

// Register
router.post('/register', async (req, res) => {
  const {
    name,
    humanGender,
    gender,
    age,
    breed,
    dogName,
    email,
    password,
    accessible,
    status,
    need_his_time,
    city,
    area,
    postalCode,
    visibleToGender,
    publicKey,
    encryptedPrivateKey,
    aktiv,
    neutered,
    description,
  } = req.body;


  if (!name || !age || !humanGender || !dogName || !email || !password) {
    return res.status(400).json({ error: 'Alle Felder sind Pflicht' });
  }

  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ error: pwError });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const emailVerificationToken = crypto.randomUUID();
    const db = await dbPromise;

    await db.run(
      `INSERT INTO users (
        id, name, gender, humanGender, age, breed, city, area, postalCode,
        dogName, email, password, accessible, status, need_his_time, visibleToGender,
        publicKey, encryptedPrivateKey, aktiv, neutered, description,
        emailVerified, emailVerificationToken
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        name,
        gender ?? 'male',
        humanGender,
        age,
        breed ?? null,
        city ?? null,
        area ?? null,
        postalCode ?? null,
        dogName,
        email,
        hashedPassword,
        accessible ?? 1,
        status ?? null,
        need_his_time ? 1 : 0,
        visibleToGender ?? 'all',
        publicKey ?? null,
        encryptedPrivateKey ?? null,
        typeof aktiv === 'number' ? aktiv : 1,
        neutered ?? null,
        description ?? null,
        0,
        emailVerificationToken,
      ]
    );

    // Verifizierungs-Email senden
    // const verifyLink = `${BACKEND_URL}/auth/verify-email?token=${emailVerificationToken}`;
    const verifyLink = `${BACKEND_URL}/auth/verify-email?token=${emailVerificationToken}`;


    try {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: email,
        subject: 'WalkBuddy – Bitte bestätige deine Email-Adresse',
        html: `
          <h2>Willkommen bei WalkBuddy!</h2>
          <p>Bitte klicke auf den folgenden Link, um deine Email-Adresse zu bestätigen:</p>
          <p><a href="${verifyLink}">${verifyLink}</a></p>
          <p>Falls du dich nicht bei WalkBuddy registriert hast, kannst du diese Email ignorieren.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Email-Versand fehlgeschlagen:', emailErr);
    }

    return res.json({ success: true, message: 'Verifizierungs-Email gesendet' });
  } catch (err: any) {
    if (String(err.message).includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email existiert bereits' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Serverfehler' });
  }
});


// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email und Passwort sind Pflicht' });
    }

    const db = await dbPromise;

    const user = await db.get(`SELECT * FROM users WHERE email = ? AND aktiv = 1`, [email]);
    if (!user) return res.status(401).json({ error: 'Falsche Email oder Passwort' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Falsche Email oder Passwort' });

    if (!user.emailVerified) {
      return res.status(401).json({ error: 'Bitte bestätige zuerst deine Email-Adresse.' });
    }

    req.session.userId = user.id;

    // Express 5: Session explizit speichern, damit Set-Cookie Header gesetzt wird
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Serverfehler' });
      }
      return res.json({
        success: true,
        user: sanitizeUser(user),
        encryptedPrivateKey: user.encryptedPrivateKey || null
      });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

// Email-Verifizierung
router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.redirect(`${APP_URL}/login?verified=0`);

    const db = await dbPromise;
    const user = await db.get(
      `SELECT id FROM users WHERE emailVerificationToken = ?`,
      [token]
    );

    if (!user) {
      return res.redirect(`${APP_URL}/login?verified=0`);
    }

    await db.run(
      `UPDATE users SET emailVerified = 1, emailVerificationToken = NULL WHERE id = ?`,
      [user.id]
    );

    return res.redirect(`${APP_URL}/login?verified=1`);
  } catch (e) {
    console.error(e);
    return res.redirect(`${APP_URL}/login?verified=0`);
  }
});

// Verifizierungs-Email erneut senden
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: true });

    const db = await dbPromise;
    const user = await db.get(
      `SELECT id, emailVerified FROM users WHERE email = ? AND aktiv = 1`,
      [email]
    );

    if (user && !user.emailVerified) {
      const newToken = crypto.randomUUID();
      await db.run(
        `UPDATE users SET emailVerificationToken = ? WHERE id = ?`,
        [newToken, user.id]
      );

      const verifyLink = `${BACKEND_URL}/auth/verify-email?token=${newToken}`;
      try {
        await transporter.sendMail({
          from: MAIL_FROM,
          to: email,
          subject: 'WalkBuddy – Bitte bestätige deine Email-Adresse',
          html: `
            <h2>Willkommen bei WalkBuddy!</h2>
            <p>Bitte klicke auf den folgenden Link, um deine Email-Adresse zu bestätigen:</p>
            <p><a href="${verifyLink}">${verifyLink}</a></p>
            <p>Falls du dich nicht bei WalkBuddy registriert hast, kannst du diese Email ignorieren.</p>
          `,
        });
      } catch (emailErr) {
        console.error('Email-Versand fehlgeschlagen:', emailErr);
      }
    }

    // Immer success zurückgeben (Security: keine Info ob Email existiert)
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.json({ success: true });
  }
});

// Passwort vergessen
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: true });

    const db = await dbPromise;
    const user = await db.get(
      `SELECT id FROM users WHERE email = ? AND aktiv = 1`,
      [email]
    );

    if (user) {
      const token = crypto.randomUUID();
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 Stunde

      await db.run(
        `UPDATE users SET passwordResetToken = ?, passwordResetExpiry = ? WHERE id = ?`,
        [token, expiry, user.id]
      );

      const resetLink = `${APP_URL}/reset-password?token=${token}`;
      try {
        await transporter.sendMail({
          from: MAIL_FROM,
          to: email,
          subject: 'WalkBuddy – Passwort zurücksetzen',
          html: `
            <h2>Passwort zurücksetzen</h2>
            <p>Du hast angefordert, dein Passwort zurückzusetzen.</p>
            <p>Klicke auf den folgenden Link, um ein neues Passwort zu setzen:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>Der Link ist 1 Stunde gültig.</p>
            <p>Falls du kein neues Passwort angefordert hast, kannst du diese Email ignorieren.</p>
          `,
        });
      } catch (emailErr) {
        console.error('Password-Reset Email-Versand fehlgeschlagen:', emailErr);
      }
    }

    // Immer success zurückgeben (Security: keine Info ob Email existiert)
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.json({ success: true });
  }
});

// Passwort zurücksetzen
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token und Passwort sind erforderlich' });
    }

    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    const db = await dbPromise;
    const user = await db.get(
      `SELECT id, passwordResetExpiry FROM users WHERE passwordResetToken = ? AND aktiv = 1`,
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Link' });
    }

    // Prüfen ob Token abgelaufen
    if (!user.passwordResetExpiry || new Date(user.passwordResetExpiry) < new Date()) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Link' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      `UPDATE users SET password = ?, passwordResetToken = NULL, passwordResetExpiry = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Logout fehlgeschlagen' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

// ME (aktueller User aus Session)
router.get('/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;
    const user = await db.get(
      `SELECT id, name, email, gender, humanGender, age, breed, neutered, description,
              city, area, postalCode, dogName, accessible, need_his_time, available,
              visibleToGender, publicKey, profilePic, role, aktiv, hasSeenOnboarding
       FROM users WHERE id = ? AND aktiv = 1`,
      [userId]
    );

    if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
    return res.json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

// Public Key eines Users abrufen (für E2EE)
router.get('/public-key/:userId', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;
    const user = await db.get(
      `SELECT publicKey FROM users WHERE id = ?`,
      [req.params.userId]
    );

    if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
    res.json({ publicKey: user.publicKey || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// E2EE-Schlüssel hochladen (für bestehende User ohne Schlüssel)
router.post('/keys', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { publicKey, encryptedPrivateKey } = req.body;
    if (!publicKey || !encryptedPrivateKey) {
      return res.status(400).json({ error: 'Schlüssel erforderlich' });
    }

    const db = await dbPromise;
    const existing = await db.get(
      `SELECT publicKey FROM users WHERE id = ?`,
      [userId]
    );

    if (existing?.publicKey) {
      return res.status(400).json({ error: 'Schlüssel bereits vorhanden' });
    }

    await db.run(
      `UPDATE users SET publicKey = ?, encryptedPrivateKey = ? WHERE id = ?`,
      [publicKey, encryptedPrivateKey, userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ME updaten (nur Session-User)
router.put('/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const {
      name,
      gender,
      humanGender,
      age,
      breed,
      city,
      area,
      postalCode,
      dogName,
      accessible,
      need_his_time,
      visibleToGender,
      neutered,
      description,
      hasSeenOnboarding,
    } = req.body;

    if (!name || !gender || !dogName) {
      return res.status(400).json({ error: 'Name, Geschlecht und Hundename sind Pflicht' });
    }

    const db = await dbPromise;

    await db.run(
      `UPDATE users
       SET name = ?, gender = ?, humanGender = ?, age = ?, breed = ?,
           city = ?, area = ?, postalCode = ?, dogName = ?,
           accessible = ?, need_his_time = ?, visibleToGender = ?,
           neutered = ?, description = ?,
           hasSeenOnboarding = COALESCE(?, hasSeenOnboarding)
       WHERE id = ?`,
      name,
      gender,
      humanGender,
      age,
      breed,
      city || null,
      area || null,
      postalCode || null,
      dogName,
      accessible ? 1 : 0,
      need_his_time ? 1 : 0,
      visibleToGender || 'all',
      neutered || null,
      description || null,
      typeof hasSeenOnboarding === 'number' ? hasSeenOnboarding : null,
      userId
    );

    const updatedUser = await db.get(
      `SELECT id, name, email, gender, humanGender, age, breed, neutered, description,
              city, area, postalCode, dogName, accessible, need_his_time, available,
              visibleToGender, profilePic, role, aktiv, hasSeenOnboarding
       FROM users WHERE id = ? AND aktiv = 1`,
      [userId]
    );

    return res.json({ success: true, user: updatedUser });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

// Account löschen (Soft-Delete)
router.delete('/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Passwort ist erforderlich' });

    const db = await dbPromise;
    const user = await db.get(`SELECT password FROM users WHERE id = ? AND aktiv = 1`, [userId]);
    if (!user) return res.status(404).json({ error: 'User nicht gefunden' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Falsches Passwort' });

    await db.run(`UPDATE users SET aktiv = 0, available = 0 WHERE id = ?`, [userId]);

    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

// Profilbild hochladen
router.post('/upload-pic', upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    if (!req.file) return res.status(400).json({ error: 'Kein Bild hochgeladen' });

    const db = await dbPromise;

    // Altes Bild löschen
    const old = await db.get(`SELECT profilePic FROM users WHERE id = ?`, [userId]);
    if (old?.profilePic) {
      const oldPath = path.join(uploadDir, old.profilePic);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.run(`UPDATE users SET profilePic = ? WHERE id = ?`, [req.file.filename, userId]);

    res.json({ success: true, profilePic: req.file.filename });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
