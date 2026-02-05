import { Router } from 'express';
import { dbPromise } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// User blockieren
router.post('/block', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId erforderlich' });
    if (userId === me) return res.status(400).json({ error: 'Du kannst dich nicht selbst blockieren' });

    const db = await dbPromise;

    const target = await db.get(`SELECT id FROM users WHERE id = ?`, [userId]);
    if (!target) return res.status(404).json({ error: 'User nicht gefunden' });

    await db.run(
      `INSERT OR IGNORE INTO blocks (userId, blockedUserId) VALUES (?, ?)`,
      [me, userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// User entblockieren
router.post('/unblock', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId erforderlich' });

    const db = await dbPromise;

    await db.run(
      `DELETE FROM blocks WHERE userId = ? AND blockedUserId = ?`,
      [me, userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Blockierte User auflisten
router.get('/list', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;

    const rows = await db.all(
      `SELECT b.blockedUserId, u.name, u.dogName, b.createdAt
       FROM blocks b
       JOIN users u ON u.id = b.blockedUserId
       WHERE b.userId = ?
       ORDER BY b.createdAt DESC`,
      [me]
    );

    res.json({ items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// User melden
router.post('/report', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId erforderlich' });
    if (!reason?.trim()) return res.status(400).json({ error: 'Grund erforderlich' });
    if (userId === me) return res.status(400).json({ error: 'Du kannst dich nicht selbst melden' });

    const db = await dbPromise;

    const target = await db.get(`SELECT id FROM users WHERE id = ?`, [userId]);
    if (!target) return res.status(404).json({ error: 'User nicht gefunden' });

    const id = uuidv4();
    await db.run(
      `INSERT INTO reports (id, reporterId, reportedUserId, reason) VALUES (?, ?, ?, ?)`,
      [id, me, userId, reason.trim()]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
