import request from 'supertest';
import { createApp } from '../app';
import { setupTestDb, teardownTestDb, getTestDb } from './setup';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { Express } from 'express';

let app: Express;

const userA = { id: uuidv4(), name: 'Alice', gender: 'female', email: 'alice@test.de', dogName: 'Mia', password: 'pw123' };
const userB = { id: uuidv4(), name: 'Bob', gender: 'male', email: 'bob@test.de', dogName: 'Rex', password: 'pw123' };
const userC = { id: uuidv4(), name: 'Clara', gender: 'female', email: 'clara@test.de', dogName: 'Lilly', password: 'pw123' };

beforeAll(async () => {
  const db = await setupTestDb();
  app = createApp();

  for (const u of [userA, userB, userC]) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.run(
      `INSERT INTO users (id, name, gender, dogName, email, password, available, visibleToGender)
       VALUES (?,?,?,?,?,?,1,'all')`,
      [u.id, u.name, u.gender, u.dogName, u.email, hash]
    );
  }
});

afterAll(async () => {
  await teardownTestDb();
});

function loginAs(user: typeof userA) {
  const agent = request.agent(app);
  return agent.post('/auth/login').send({ email: user.email, password: user.password }).then(() => agent);
}

describe('POST /messages/send', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app)
      .post('/messages/send')
      .send({ receiverId: userB.id, content: 'Hi' });

    expect(res.status).toBe(401);
  });

  it('sollte Nachricht senden', async () => {
    const agent = await loginAs(userA);

    const res = await agent
      .post('/messages/send')
      .send({ receiverId: userB.id, content: 'Hallo Bob!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('sollte leere Nachricht ablehnen', async () => {
    const agent = await loginAs(userA);

    const res = await agent
      .post('/messages/send')
      .send({ receiverId: userB.id, content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Empfänger und Text erforderlich');
  });

  it('sollte fehlenden Empfänger ablehnen', async () => {
    const agent = await loginAs(userA);

    const res = await agent
      .post('/messages/send')
      .send({ content: 'Hallo?' });

    expect(res.status).toBe(400);
  });

  it('sollte Nachricht an sich selbst ablehnen', async () => {
    const agent = await loginAs(userA);

    const res = await agent
      .post('/messages/send')
      .send({ receiverId: userA.id, content: 'Self-talk' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Nicht an dich selbst senden');
  });

  it('sollte Nachricht an nicht-verfügbaren User ablehnen', async () => {
    const db = getTestDb();
    await db.run('UPDATE users SET available = 0 WHERE id = ?', [userC.id]);

    const agent = await loginAs(userA);

    const res = await agent
      .post('/messages/send')
      .send({ receiverId: userC.id, content: 'Hallo Clara!' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('User nicht verfügbar');

    // Zurücksetzen
    await db.run('UPDATE users SET available = 1 WHERE id = ?', [userC.id]);
  });

  it('sollte visibleToGender-Einschränkung beachten', async () => {
    const db = getTestDb();
    // Clara erlaubt nur Nachrichten von Frauen
    await db.run('UPDATE users SET visibleToGender = ? WHERE id = ?', ['female', userC.id]);

    // Bob (male) versucht Clara zu schreiben
    const agent = await loginAs(userB);

    const res = await agent
      .post('/messages/send')
      .send({ receiverId: userC.id, content: 'Hi Clara' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('User erlaubt keine Nachrichten von dir');

    // Alice (female) darf Clara schreiben
    const agentA = await loginAs(userA);
    const res2 = await agentA
      .post('/messages/send')
      .send({ receiverId: userC.id, content: 'Hi Clara von Alice' });

    expect(res2.status).toBe(200);

    // Zurücksetzen
    await db.run('UPDATE users SET visibleToGender = ? WHERE id = ?', ['all', userC.id]);
  });

  it('sollte Nachricht an nicht-existierenden User ablehnen', async () => {
    const agent = await loginAs(userA);

    const res = await agent
      .post('/messages/send')
      .send({ receiverId: uuidv4(), content: 'Hallo Geist' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('User nicht verfügbar');
  });
});

describe('GET /messages/with/:userId', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app).get(`/messages/with/${userB.id}`);

    expect(res.status).toBe(401);
  });

  it('sollte Chatverlauf laden', async () => {
    const agent = await loginAs(userA);

    const res = await agent.get(`/messages/with/${userB.id}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].content).toBe('Hallo Bob!');
  });

  it('sollte ungültige UUID ablehnen', async () => {
    const agent = await loginAs(userA);

    const res = await agent.get('/messages/with/invalid-id');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ungültige User-ID');
  });

  it('sollte 404 bei nicht-existierendem User zurückgeben', async () => {
    const agent = await loginAs(userA);
    const fakeUuid = uuidv4();

    const res = await agent.get(`/messages/with/${fakeUuid}`);

    expect(res.status).toBe(404);
  });

  it('sollte 403 ohne vorherige Konversation zurückgeben', async () => {
    // Bob und Clara haben nie geschrieben
    const agent = await loginAs(userB);

    const res = await agent.get(`/messages/with/${userC.id}`);

    // Wegen Clara's Message von Alice gibt es keine Relation zu Bob
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Kein Zugriff auf diesen Chat');
  });
});

describe('GET /messages/partner/:otherId', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app).get(`/messages/partner/${userB.id}`);

    expect(res.status).toBe(401);
  });

  it('sollte Partner-Name zurückgeben', async () => {
    const agent = await loginAs(userA);

    const res = await agent.get(`/messages/partner/${userB.id}`);

    expect(res.status).toBe(200);
    expect(res.body.otherName).toBe('Rex (Bob)');
  });

  it('sollte 404 bei nicht-existierendem User zurückgeben', async () => {
    const agent = await loginAs(userA);

    const res = await agent.get(`/messages/partner/${uuidv4()}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /messages/unread-count', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app).get('/messages/unread-count');

    expect(res.status).toBe(401);
  });

  it('sollte Anzahl ungelesener Nachrichten zurückgeben', async () => {
    const agent = await loginAs(userB);

    const res = await agent.get('/messages/unread-count');

    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    // Bob hat eine Nachricht von Alice, die er nicht gelesen hat
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /messages/mark-read/:otherId', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app).post(`/messages/mark-read/${userA.id}`);

    expect(res.status).toBe(401);
  });

  it('sollte Konversation als gelesen markieren', async () => {
    const agent = await loginAs(userB);

    const res = await agent.post(`/messages/mark-read/${userA.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Unread count sollte jetzt 0 sein für diese Konversation
    const countRes = await agent.get('/messages/unread-count');
    expect(countRes.body.count).toBe(0);
  });
});

describe('GET /messages/inbox', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app).get('/messages/inbox');

    expect(res.status).toBe(401);
  });

  it('sollte Inbox mit Kontakten zurückgeben', async () => {
    const agent = await loginAs(userA);

    const res = await agent.get('/messages/inbox');

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);

    const item = res.body.items[0];
    expect(item.otherId).toBeDefined();
    expect(item.otherName).toBeDefined();
    expect(item.content).toBeDefined();
    expect(item.createdAt).toBeDefined();
  });

  it('sollte leere Inbox für User ohne Nachrichten zurückgeben', async () => {
    // Neuen User erstellen der keine Nachrichten hat
    const db = getTestDb();
    const newId = uuidv4();
    const hash = await bcrypt.hash('pw123', 10);
    await db.run(
      `INSERT INTO users (id, name, gender, dogName, email, password, available, visibleToGender)
       VALUES (?,?,?,?,?,?,1,'all')`,
      [newId, 'Neu', 'male', 'Hund', 'neu@test.de', hash]
    );

    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'neu@test.de', password: 'pw123' });

    const res = await agent.get('/messages/inbox');

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});
