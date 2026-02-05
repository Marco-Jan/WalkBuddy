import { Router } from 'express';
import { dbPromise } from '../db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
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

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const emailVerificationToken = crypto.randomUUID();
    const db = await dbPromise;

    await db.run(
      `INSERT INTO users (
        id, name, gender, humanGender, age, breed, city, area, postalCode,
        dogName, email, password, accessible, need_his_time, visibleToGender,
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
        accessible ? 1 : 0,
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
    const verifyLink = `${BACKEND_URL}/auth/verify-email?token=${emailVerificationToken}`;
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'onboarding@resend.dev',
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

    return res.json({
      success: true,
      user: sanitizeUser(user),
      encryptedPrivateKey: user.encryptedPrivateKey || null
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
        await resend.emails.send({
          from: process.env.RESEND_FROM || 'onboarding@resend.dev',
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
              visibleToGender, publicKey, profilePic, role, aktiv
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
           neutered = ?, description = ?
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
      userId
    );

    const updatedUser = await db.get(
      `SELECT id, name, email, gender, humanGender, age, breed, neutered, description,
              city, area, postalCode, dogName, accessible, need_his_time, available,
              visibleToGender, profilePic, role, aktiv
       FROM users WHERE id = ? AND aktiv = 1`,
      [userId]
    );

    return res.json({ success: true, user: updatedUser });
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
