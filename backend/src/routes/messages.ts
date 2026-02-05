import { Router } from 'express';
import { dbPromise } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Nachricht senden
router.post('/send', async (req, res) => {
  try {
    const senderId = req.session.userId;
    if (!senderId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { receiverId, content, iv } = req.body;

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ error: 'Empfänger und Text erforderlich' });
    }

    if (receiverId === senderId) {
      return res.status(400).json({ error: 'Nicht an dich selbst senden' });
    }

    const db = await dbPromise;

    // Block-Check: Blockierung in beide Richtungen prüfen
    const block = await db.get(
      `SELECT 1 FROM blocks
       WHERE (userId = ? AND blockedUserId = ?)
          OR (userId = ? AND blockedUserId = ?)`,
      [senderId, receiverId, receiverId, senderId]
    );
    if (block) {
      return res.status(403).json({ error: 'Nachricht kann nicht gesendet werden' });
    }

    // Empfänger prüfen (muss verfügbar sein)
    const receiver = await db.get(
    `SELECT gender, available, visibleToGender FROM users WHERE id = ?`,
    [receiverId]
    );

    if (!receiver || receiver.available !== 1) {
    return res.status(403).json({ error: 'User nicht verfügbar' });
    }
    const meRow = await db.get(`SELECT gender FROM users WHERE id = ?`, [senderId]);

    if (
        receiver.visibleToGender !== 'all' &&
        receiver.visibleToGender !== meRow.gender
        ) {
        return res.status(403).json({ error: 'User erlaubt keine Nachrichten von dir' });
        }

    const id = uuidv4();

    await db.run(
      `INSERT INTO messages (id, senderId, receiverId, content, iv)
       VALUES (?,?,?,?,?)`,
      [id, senderId, receiverId, iv ? content : content.trim(), iv || null]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Verlauf mit einem User
router.get('/with/:userId', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const other = req.params.userId;

    // UUID validieren
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(other)) {
      return res.status(400).json({ error: 'Ungültige User-ID' });
    }

    const db = await dbPromise;

    // Existiert der User?
    const otherUser = await db.get(
      `SELECT id FROM users WHERE id = ?`,
      [other]
    );
    if (!otherUser) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }

    // Block-Check
    const block = await db.get(
      `SELECT 1 FROM blocks
       WHERE (userId = ? AND blockedUserId = ?)
          OR (userId = ? AND blockedUserId = ?)`,
      [me, other, other, me]
    );
    if (block) {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    // Gibt es überhaupt eine Beziehung?
    const relation = await db.get(
      `
      SELECT 1
      FROM messages
      WHERE active = 1
        AND ((senderId = ? AND receiverId = ?)
         OR (senderId = ? AND receiverId = ?))
      LIMIT 1
      `,
      [me, other, other, me]
    );

    if (!relation) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Chat' });
    }

    // Nachrichten laden
    const messages = await db.all(
      `
      SELECT id, senderId, receiverId, content, createdAt, iv
      FROM messages
      WHERE active = 1
        AND ((senderId = ? AND receiverId = ?)
         OR (senderId = ? AND receiverId = ?))
      ORDER BY createdAt ASC
      `,
      [me, other, other, me]
    );

    // Public Key des Gesprächspartners für E2EE-Entschlüsselung
    const otherKeyRow = await db.get(
      `SELECT publicKey FROM users WHERE id = ?`,
      [other]
    );

    res.json({ messages, otherPublicKey: otherKeyRow?.publicKey || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/partner/:otherId', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const otherId = req.params.otherId;
    const db = await dbPromise;

    const other = await db.get(
      `SELECT id, name, dogName FROM users WHERE id = ?`,
      [otherId]
    );

    if (!other) return res.status(404).json({ error: 'User nicht gefunden' });

    res.json({ otherName: `${other.dogName} (${other.name})` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});


//ungelesene nachrichten
router.get('/unread-count', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;

    const row = await db.get(
      `
      WITH conv AS (
        SELECT
          CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END AS otherId,
          MAX(CASE WHEN m.senderId != ? THEN datetime(m.createdAt) END) AS lastIncomingAt
        FROM messages m
        WHERE m.active = 1 AND (m.senderId = ? OR m.receiverId = ?)
        GROUP BY otherId
      )
      SELECT COUNT(*) AS count
      FROM conv
      LEFT JOIN conversation_reads cr
        ON cr.userId = ? AND cr.otherId = conv.otherId
      WHERE conv.lastIncomingAt IS NOT NULL
        AND datetime(conv.lastIncomingAt) > datetime(COALESCE(cr.lastSeenAt, '1970-01-01 00:00:00'))
        AND conv.otherId NOT IN (SELECT blockedUserId FROM blocks WHERE userId = ?)
        AND conv.otherId NOT IN (SELECT userId FROM blocks WHERE blockedUserId = ?)
      `,
      [me, me, me, me, me, me, me]
    );

    res.json({ count: row?.count ?? 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});


//als gelesen markiert
// router.post('/mark-read', async (req, res) => {
//   try {
//     const me = req.session.userId;
//     if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

//     const db = await dbPromise;
//     await db.run(
//                 `UPDATE users
//                 SET lastSeenMessagesAt = CURRENT_TIMESTAMP
//                 WHERE id = ?`,
//                 [me]
//                 );

//     const row = await db.get(`SELECT lastSeenMessagesAt FROM users WHERE id = ?`, [me]);
//     res.json({ success: true, lastSeenMessagesAt: row?.lastSeenMessagesAt });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: 'Serverfehler' });
//   }
// });

router.post('/mark-read/:otherId', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const otherId = req.params.otherId;
    const db = await dbPromise;

    await db.run(
      `INSERT INTO conversation_reads (userId, otherId, lastSeenAt)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(userId, otherId)
       DO UPDATE SET lastSeenAt = CURRENT_TIMESTAMP`,
      [me, otherId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});



//Inbox-Liste (letzte Nachricht pro Kontakt)

router.get('/inbox', async (req, res) => {
  try {
    const me = req.session.userId;
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;

    const rows = await db.all(
      `
      WITH last_ts AS (
        SELECT
          CASE WHEN senderId = ? THEN receiverId ELSE senderId END AS otherId,
          MAX(datetime(createdAt)) AS lastAt
        FROM messages
        WHERE active = 1 AND (senderId = ? OR receiverId = ?)
        GROUP BY otherId
      ),
      latest AS (
        SELECT
          m.*,
          CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END AS otherId
        FROM messages m
        JOIN last_ts t
          ON t.otherId = (CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END)
         AND datetime(m.createdAt) = t.lastAt
        WHERE m.active = 1 AND (m.senderId = ? OR m.receiverId = ?)
      ),
      latest_one AS (
        -- falls mehrere Nachrichten exakt gleiche createdAt haben: nimm "max(id)" als Tie-Breaker
        SELECT l.*
        FROM latest l
        JOIN (
          SELECT otherId, MAX(id) AS maxId
          FROM latest
          GROUP BY otherId
        ) x ON x.otherId = l.otherId AND x.maxId = l.id
      )
      SELECT
        l.id,
        l.senderId,
        l.receiverId,
        l.content,
        l.createdAt,
        l.iv,
        l.otherId,
        u.name AS otherName,
        u.dogName AS otherDogName,
        u.publicKey AS otherPublicKey,
        CASE
          WHEN l.senderId = l.otherId
           AND datetime(l.createdAt) > datetime(COALESCE(cr.lastSeenAt, '1970-01-01 00:00:00'))
          THEN 1 ELSE 0
        END AS hasUnread
      FROM latest_one l
      JOIN users u ON u.id = l.otherId
      LEFT JOIN conversation_reads cr
        ON cr.userId = ? AND cr.otherId = l.otherId
      WHERE l.otherId NOT IN (SELECT blockedUserId FROM blocks WHERE userId = ?)
        AND l.otherId NOT IN (SELECT userId FROM blocks WHERE blockedUserId = ?)
      ORDER BY datetime(l.createdAt) DESC
      `,
      [me, me, me, me, me, me, me, me, me, me]
    );

    res.json({ items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
