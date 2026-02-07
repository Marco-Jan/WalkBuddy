import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbPromise } from '../db';

const router = Router();

// Cleanup: Statuse älter als 3 Stunden alle 10 Minuten löschen
setInterval(async () => {
  try {
    const db = await dbPromise;
    await db.run(`DELETE FROM statuses WHERE datetime(createdAt) <= datetime('now', '-3 hours')`);
  } catch { /* ignore */ }
}, 3 * 60 * 60 * 1000);

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

    // Mein Geschlecht und Sichtbarkeitsfilter holen
    const me = await db.get(`SELECT humanGender, visibleToGender FROM users WHERE id = ? AND aktiv = 1`, [myId]);
    if (!me) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const myGender = me.humanGender; // 'male' | 'female' | 'divers'
    const myFilter = me.visibleToGender; // 'all' | 'male' | 'female' | 'divers'

    // Bidirektional: Zeige nur User deren visibleToGender mein Geschlecht erlaubt
    // UND deren humanGender mein visibleToGender erlaubt
    const users = await db.all(
      `${SAFE_SELECT}
       WHERE available = 1
         AND id != ?
         AND aktiv = 1
         AND (visibleToGender = 'all' OR visibleToGender = ?)
         AND (? = 'all' OR humanGender = ?)
         AND id NOT IN (SELECT blockedUserId FROM blocks WHERE userId = ?)
         AND id NOT IN (SELECT userId FROM blocks WHERE blockedUserId = ?)`,
      [myId, myGender, myFilter, myFilter, myId, myId]
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


// In-Memory Cache für Photon API
const cityCache = new Map<string, { data: any[]; ts: number }>();
const CACHE_TTL = 60_000; // 60s
const CACHE_MAX = 500;

router.get('/city-search', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const q = (req.query.q as string || '').trim();
    if (q.length < 2) return res.json([]);

    const cacheKey = q.toLowerCase();

    // Check cache
    const cached = cityCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=de&limit=7&layer=city`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      const json = await response.json();
      const features: any[] = json.features || [];

      const seen = new Set<string>();
      const results: { city: string; postcode: string; state: string }[] = [];

      for (const f of features) {
        const p = f.properties || {};
        const city = p.name || p.city || '';
        const postcode = p.postcode || '';
        const state = p.state || '';
        const countrycode = (p.countrycode || '').toUpperCase();

        if (!city || (countrycode && countrycode !== 'DE' && countrycode !== 'AT' && countrycode !== 'CH')) continue;

        const key = `${city}-${postcode}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({ city, postcode, state });
      }

      // Update cache (evict oldest if full)
      if (cityCache.size >= CACHE_MAX) {
        const oldest = cityCache.keys().next().value;
        if (oldest !== undefined) cityCache.delete(oldest);
      }
      cityCache.set(cacheKey, { data: results, ts: Date.now() });

      return res.json(results);
    } catch (apiErr) {
      // Fallback: LIKE-Suche auf bestehende DB-Städte
      const db = await dbPromise;
      const rows = await db.all(
        `SELECT DISTINCT city, postalCode FROM users
         WHERE aktiv = 1 AND city IS NOT NULL AND city != '' AND city LIKE ?
         ORDER BY city ASC LIMIT 10`,
        [`%${q}%`]
      );
      return res.json(rows.map((r: any) => ({ city: r.city, postcode: r.postalCode || '', state: '' })));
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Alle distinkten Stadt/PLZ-Kombinationen aktiver User
router.get('/cities', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;
    const rows = await db.all(
      `SELECT DISTINCT city, postalCode FROM users
       WHERE aktiv = 1 AND city IS NOT NULL AND city != ''
       ORDER BY city ASC`
    );
    res.json(rows.map((r: any) => ({ city: r.city, postalCode: r.postalCode || '' })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Status posten/aktualisieren (1 Status pro User)
router.post('/post', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Status-Text ist erforderlich' });
    }
    if (text.length > 150) {
      return res.status(400).json({ error: 'Status darf max. 150 Zeichen lang sein' });
    }

    const db = await dbPromise;

    // Alten Status löschen, dann neuen einfügen
    await db.run(`DELETE FROM statuses WHERE userId = ?`, [userId]);
    const id = uuidv4();
    await db.run(
      `INSERT INTO statuses (id, userId, text) VALUES (?, ?, ?)`,
      [id, userId, text.trim()]
    );

    res.json({ success: true, status: { id, userId, text: text.trim() } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Neueste 5 Statuse aller sichtbaren User (Feed)
router.get('/feed', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;

    const items = await db.all(
      `SELECT s.id, s.text, s.createdAt, s.userId,
              u.name, u.dogName, u.profilePic, u.city
       FROM statuses s
       JOIN users u ON s.userId = u.id
       WHERE u.aktiv = 1 AND u.available = 1
         AND datetime(s.createdAt) > datetime('now', '-3 hours')
         AND s.userId NOT IN (SELECT blockedUserId FROM blocks WHERE userId = ?)
         AND s.userId NOT IN (SELECT userId FROM blocks WHERE blockedUserId = ?)
       ORDER BY s.createdAt DESC
       LIMIT 5`,
      [userId, userId]
    );

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Eigenen Status löschen
router.delete('/my-status', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;
    await db.run(`DELETE FROM statuses WHERE userId = ?`, [userId]);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Aktive Ankündigungen (für alle eingeloggten User)
router.get('/announcements/active', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const db = await dbPromise;
    const items = await db.all(
      `SELECT id, title, message, createdAt FROM announcements WHERE active = 1 ORDER BY createdAt DESC`
    );

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
