import request from 'supertest';
import { createApp } from '../app';
import { setupTestDb, teardownTestDb, getTestDb } from './setup';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { Express } from 'express';

let app: Express;

const users = {
  male1: { id: uuidv4(), name: 'Tom', gender: 'male', email: 'tom@test.de', dogName: 'Rex', password: 'test123' },
  female1: { id: uuidv4(), name: 'Anna', gender: 'female', email: 'anna@test.de', dogName: 'Luna', password: 'test123' },
  male2: { id: uuidv4(), name: 'Jan', gender: 'male', email: 'jan@test.de', dogName: 'Max', password: 'test123' },
};

beforeAll(async () => {
  const db = await setupTestDb();
  app = createApp();

  // Test-User direkt in DB einfügen
  for (const u of Object.values(users)) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.run(
      `INSERT INTO users (id, name, gender, dogName, email, password, available, visibleToGender)
       VALUES (?,?,?,?,?,?,0,'all')`,
      [u.id, u.name, u.gender, u.dogName, u.email, hash]
    );
  }
});

afterAll(async () => {
  await teardownTestDb();
});

describe('GET /status/all', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app).get('/status/all');

    expect(res.status).toBe(401);
  });

  it('sollte alle User zurückgeben wenn eingeloggt', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent.get('/status/all');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    // Kein Passwort im Response
    res.body.forEach((u: any) => {
      expect(u.password).toBeUndefined();
    });
  });
});

describe('GET /status/available', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app).get('/status/available');

    expect(res.status).toBe(401);
  });

  it('sollte leere Liste zurückgeben wenn niemand verfügbar ist', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent.get('/status/available');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('sollte verfügbare User anzeigen (ohne sich selbst)', async () => {
    const db = getTestDb();
    // Anna verfügbar machen
    await db.run('UPDATE users SET available = 1 WHERE id = ?', [users.female1.id]);

    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent.get('/status/available');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Anna');
  });

  it('sollte visibleToGender-Filter beachten', async () => {
    const db = getTestDb();
    // Anna: nur für Frauen sichtbar
    await db.run('UPDATE users SET available = 1, visibleToGender = ? WHERE id = ?', ['female', users.female1.id]);

    // Tom (male) sieht Anna NICHT
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent.get('/status/available');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);

    // Zurücksetzen
    await db.run('UPDATE users SET visibleToGender = ? WHERE id = ?', ['all', users.female1.id]);
  });

  it('sollte sich selbst nicht in der Liste anzeigen', async () => {
    const db = getTestDb();
    await db.run('UPDATE users SET available = 1 WHERE id = ?', [users.male1.id]);

    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent.get('/status/available');

    expect(res.status).toBe(200);
    const ids = res.body.map((u: any) => u.id);
    expect(ids).not.toContain(users.male1.id);
  });
});

describe('POST /status/set', () => {
  it('sollte 401 ohne Login zurückgeben', async () => {
    const res = await request(app)
      .post('/status/set')
      .send({ available: true });

    expect(res.status).toBe(401);
  });

  it('sollte Status auf verfügbar setzen', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent
      .post('/status/set')
      .send({ available: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.available).toBe(1);
  });

  it('sollte Status auf nicht verfügbar setzen', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent
      .post('/status/set')
      .send({ available: false });

    expect(res.status).toBe(200);
    expect(res.body.user.available).toBe(0);
  });

  it('sollte bei nicht-boolean Wert 400 zurückgeben', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent
      .post('/status/set')
      .send({ available: 'ja' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('available muss boolean sein');
  });

  it('sollte bei fehlender available-Property 400 zurückgeben', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'tom@test.de', password: 'test123' });

    const res = await agent
      .post('/status/set')
      .send({});

    expect(res.status).toBe(400);
  });
});
