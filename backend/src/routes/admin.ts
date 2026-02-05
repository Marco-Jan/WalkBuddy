import { Router, Request, Response, NextFunction } from 'express';
import { dbPromise } from '../db';

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
    const messageCount = await db.get(`SELECT COUNT(*) as count FROM messages`);
    const openReports = await db.get(`SELECT COUNT(*) as count FROM reports WHERE resolved = 0`);

    res.json({
      users: userCount?.count || 0,
      messages: messageCount?.count || 0,
      openReports: openReports?.count || 0,
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
      SELECT u.id, u.name, u.email, u.dogName, u.profilePic, u.role, u.available, u.city, u.aktiv,
        (SELECT COUNT(*) FROM messages m WHERE m.senderId = u.id OR m.receiverId = u.id) AS messageCount,
        (SELECT COUNT(*) FROM reports r WHERE r.reportedUserId = u.id AND r.resolved = 0) AS activeReports
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


export default router;
