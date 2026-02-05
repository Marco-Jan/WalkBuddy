import { Router } from 'express';
import { dbPromise } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Kontaktformular absenden (kein Login nötig)
router.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, Email und Nachricht sind Pflicht' });
    }

    const db = await dbPromise;
    const id = uuidv4();

    await db.run(
      `INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?,?,?,?,?)`,
      [id, name, email, subject || null, message]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Kontaktformular-Fehler:', err);
    return res.status(500).json({ error: 'Nachricht konnte nicht gespeichert werden' });
  }
});

export default router;
