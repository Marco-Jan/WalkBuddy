import { Router, Request, Response, NextFunction } from 'express';
import { dbPromise } from '../db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const router = Router();

// Middleware: nur Admins
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const db = await dbPromise;
  const user = await db.get(`SELECT role FROM users WHERE id = ?`, [userId]);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  next();
}

// Dashboard-Statistiken
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const db = await dbPromise;

    const userCount = await db.get(`SELECT COUNT(*) as count FROM users`);
    const onlineCount = await db.get(
      `SELECT COUNT(*) as count FROM users WHERE aktiv = 1 AND lastActiveAt IS NOT NULL AND datetime(lastActiveAt) > datetime('now', '-5 minutes')`
    );
    const openReports = await db.get(`SELECT COUNT(*) as count FROM reports WHERE resolved = 0`);
    const unreadContact = await db.get(`SELECT COUNT(*) as count FROM contact_messages WHERE read = 0`);

    res.json({
      users: userCount?.count || 0,
      onlineUsers: onlineCount?.count || 0,
      openReports: openReports?.count || 0,
      unreadContact: unreadContact?.count || 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Alle User mit Nachrichtenanzahl und offenen Meldungen
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const db = await dbPromise;

    const users = await db.all(`
      SELECT u.id, u.name, u.email, u.dogName, u.profilePic, u.role, u.available, u.city, u.aktiv, u.warned,
        (SELECT COUNT(*) FROM messages m WHERE m.senderId = u.id OR m.receiverId = u.id) AS messageCount,
        (SELECT COUNT(*) FROM reports r WHERE r.reportedUserId = u.id AND r.resolved = 0) AS activeReports,
        CASE WHEN (SELECT COUNT(*) FROM reports r WHERE r.reportedUserId = u.id AND r.resolved = 0) >= 2 THEN 1 ELSE 0 END AS flagged
      FROM users u
      ORDER BY u.name ASC
    `);

    res.json({ items: users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Alle Reports mit Reporter/Reported-Info
router.get('/reports', requireAdmin, async (_req, res) => {
  try {
    const db = await dbPromise;

    const reports = await db.all(`
      SELECT r.id, r.reason, r.createdAt, r.resolved,
             r.reporterId, reporter.name AS reporterName, reporter.dogName AS reporterDogName,
             r.reportedUserId, reported.name AS reportedName, reported.dogName AS reportedDogName
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporterId
      JOIN users reported ON reported.id = r.reportedUserId
      ORDER BY r.resolved ASC, r.createdAt DESC
    `);

    res.json({ items: reports });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Report als erledigt markieren
router.put('/reports/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const db = await dbPromise;

    const report = await db.get(`SELECT id FROM reports WHERE id = ?`, [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Report nicht gefunden' });

    await db.run(`UPDATE reports SET resolved = 1 WHERE id = ?`, [req.params.id]);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// User deaktivieren (soft delete)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    const targetId = req.params.id;

    // Nicht sich selbst deaktivieren
    if (targetId === req.session.userId) {
      return res.status(400).json({ error: 'Du kannst dich nicht selbst deaktivieren' });
    }

    const target = await db.get(`SELECT id, aktiv FROM users WHERE id = ?`, [targetId]);
    if (!target) return res.status(404).json({ error: 'User nicht gefunden' });

    // Schon deaktiviert?
    if (target.aktiv === 0) {
      return res.json({ success: true, alreadyInactive: true });
    }

    // Soft delete: deaktivieren + optional unsichtbar schalten
    await db.run(
      `UPDATE users
       SET aktiv = 0,
           available = 0
       WHERE id = ?`,
      [targetId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});


// Kontaktanfragen auflisten
router.get('/contact', requireAdmin, async (_req, res) => {
  try {
    const db = await dbPromise;

    const messages = await db.all(`
      SELECT id, name, email, subject, message, read, createdAt
      FROM contact_messages
      ORDER BY read ASC, createdAt DESC
    `);

    res.json({ items: messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Kontaktanfrage als gelesen markieren
router.put('/contact/:id/read', requireAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`UPDATE contact_messages SET read = 1 WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Kontaktanfrage löschen
router.delete('/contact/:id', requireAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`DELETE FROM contact_messages WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Log: Chronologische Übersicht aller Aktivitäten
router.get('/log', requireAdmin, async (_req, res) => {
  try {
    const db = await dbPromise;

    const log = await db.all(`
      SELECT id, 'contact' as type, name as actor, subject as detail, message as extra, createdAt
      FROM contact_messages
      UNION ALL
      SELECT r.id, 'report' as type,
             reporter.name || ' → ' || reported.name as actor,
             r.reason as detail,
             NULL as extra,
             r.createdAt
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporterId
      JOIN users reported ON reported.id = r.reportedUserId
      UNION ALL
      SELECT m.id, 'message' as type,
             sender.name || ' → ' || receiver.name as actor,
             NULL as detail,
             NULL as extra,
             m.createdAt
      FROM messages m
      JOIN users sender ON sender.id = m.senderId
      JOIN users receiver ON receiver.id = m.receiverId
      WHERE m.active = 1
      ORDER BY createdAt DESC
      LIMIT 100
    `);

    res.json({ items: log });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ──── Ankündigungen ────

// Alle Ankündigungen (Admin)
router.get('/announcements', requireAdmin, async (_req, res) => {
  try {
    const db = await dbPromise;
    const items = await db.all(`SELECT * FROM announcements ORDER BY createdAt DESC`);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Neue Ankündigung erstellen
router.post('/announcements', requireAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Titel und Nachricht erforderlich' });
    }

    const db = await dbPromise;
    const id = uuidv4();
    await db.run(
      `INSERT INTO announcements (id, title, message) VALUES (?, ?, ?)`,
      [id, title.trim(), message.trim()]
    );

    const announcement = await db.get(`SELECT * FROM announcements WHERE id = ?`, [id]);
    res.json(announcement);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Ankündigung löschen
router.delete('/announcements/:id', requireAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`DELETE FROM announcements WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ──── User-Export (CSV) ────

// Rate-Limit Tracking für Export
const exportCache = new Map<string, number>();

router.post('/export', requireAdmin, async (req, res) => {
  try {
    const userId = req.session.userId!;

    // Rate-Limit: max 1 Export pro Minute
    const lastExport = exportCache.get(userId) || 0;
    if (Date.now() - lastExport < 60_000) {
      return res.status(429).json({ error: 'Bitte warte eine Minute zwischen Exporten' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Passwort erforderlich' });
    }

    const db = await dbPromise;

    // Passwort-Bestätigung
    const admin = await db.get(`SELECT password FROM users WHERE id = ?`, [userId]);
    if (!admin) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(403).json({ error: 'Falsches Passwort' });

    exportCache.set(userId, Date.now());

    // CSV generieren (keine sensitiven Daten)
    const users = await db.all(
      `SELECT name, email, city, dogName, aktiv FROM users ORDER BY name ASC`
    );

    const header = 'Name,Email,Stadt,Hundename,Aktiv';
    const rows = users.map((u: any) => {
      const escapeCsv = (val: string | null) => {
        if (!val) return '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };
      return [
        escapeCsv(u.name),
        escapeCsv(u.email),
        escapeCsv(u.city),
        escapeCsv(u.dogName),
        u.aktiv ? 'Ja' : 'Nein',
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="walkbuddy-users.csv"');
    res.send('\uFEFF' + csv); // BOM for Excel
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ──── Warn-Flags ────

// User verwarnen
router.put('/users/:id/warn', requireAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    const target = await db.get(`SELECT id FROM users WHERE id = ?`, [req.params.id]);
    if (!target) return res.status(404).json({ error: 'User nicht gefunden' });

    await db.run(`UPDATE users SET warned = 1 WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Flag aufheben
router.put('/users/:id/clear-flag', requireAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    const target = await db.get(`SELECT id FROM users WHERE id = ?`, [req.params.id]);
    if (!target) return res.status(404).json({ error: 'User nicht gefunden' });

    await db.run(`UPDATE users SET warned = 0 WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
