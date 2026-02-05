import { Router } from 'express';
import { dbPromise } from '../db';

const router = Router();

const SAFE_SELECT = `
  SELECT id, name, email, gender, humanGender, age, breed, neutered, description,
         dogName, accessible, need_his_time, available,
         city, area, postalCode, visibleToGender, profilePic, aktiv
  FROM users
`;


// (Optional) nur für Debug/Admin: alle User (ohne Passwort)
router.get('/all', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;
    const users = await db.all(`${SAFE_SELECT} WHERE aktiv = 1`);
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// alle verfügbaren User (ohne Passwort)
router.get('/available', async (req, res) => {
  try {
    const myId = req.session.userId;
    if (!myId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;

    // Mein Geschlecht holen
    const me = await db.get(`SELECT humanGender FROM users WHERE id = ? AND aktiv = 1`, [myId]);
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const myGender = me.humanGender; // 'male' | 'female'

    // Nur User die mich sehen wollen (oder alle), blockierte ausfiltern
    const users = await db.all(
      `${SAFE_SELECT}
       WHERE available = 1
         AND id != ?
         AND aktiv = 1
         AND (visibleToGender = 'all' OR visibleToGender = ?)
         AND id NOT IN (SELECT blockedUserId FROM blocks WHERE userId = ?)
         AND id NOT IN (SELECT userId FROM blocks WHERE blockedUserId = ?)`,
      [myId, myGender, myId, myId]
    );

    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});



// Status ändern (nur für eingeloggten User via Session)
router.post('/set', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { available } = req.body;
    if (typeof available !== 'boolean') {
      return res.status(400).json({ error: 'available muss boolean sein' });
    }

    const db = await dbPromise;
    await db.run('UPDATE users SET available = ? WHERE id = ? AND aktiv = 1', [available ? 1 : 0, userId]);

    // Optional: aktuellen User zurückgeben
    const me = await db.get(`${SAFE_SELECT} WHERE id = ? AND aktiv = 1`, [userId]);

    res.json({ success: true, user: me });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

  // Einzelnes User-Profil laden
    router.get('/user/:userId', async (req, res) => {
      try {
        const sessionUserId = req.session.userId;
        if (!sessionUserId) {
          return res.status(401).json({ error: 'Nicht eingeloggt' });
        }

        const db = await dbPromise;

        const me = await db.get(
          `SELECT id FROM users WHERE id = ? AND aktiv = 1`,
          [sessionUserId]
        );

        if (!me) {
          return res.status(401).json({ error: 'Account deaktiviert' });
        }

        const user = await db.get(
          `${SAFE_SELECT} WHERE id = ? AND aktiv = 1`,
          [req.params.userId]
        );

        if (!user) return res.status(404).json({ error: 'User nicht gefunden' });

        res.json({ user });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
      }
    });


export default router;
