import request from 'supertest';
import { createApp } from '../app';
import { setupTestDb, teardownTestDb } from './setup';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  await setupTestDb();
  app = createApp();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('POST /auth/register', () => {
  it('sollte neuen User registrieren', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Max',
        gender: 'male',
        dogName: 'Bello',
        email: 'max@test.de',
        password: 'geheim123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Max');
    expect(res.body.user.email).toBe('max@test.de');
    expect(res.body.user.dogName).toBe('Bello');
    // Passwort darf NICHT im Response sein
    expect(res.body.user.password).toBeUndefined();
  });

  it('sollte bei fehlenden Pflichtfeldern 400 zurückgeben', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Alle Felder sind Pflicht');
  });

  it('sollte bei fehlender Email 400 zurückgeben', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test',
        gender: 'male',
        dogName: 'Rex',
        password: '123',
      });

    expect(res.status).toBe(400);
  });

  it('sollte bei fehlender Password 400 zurückgeben', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test',
        gender: 'male',
        dogName: 'Rex',
        email: 'no-pw@test.de',
      });

    expect(res.status).toBe(400);
  });

  it('sollte Duplikat-Email ablehnen', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Max2',
        gender: 'male',
        dogName: 'Rex',
        email: 'max@test.de', // bereits registriert
        password: 'test123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email existiert bereits');
  });

  it('sollte optionale Felder akzeptieren', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Lisa',
        gender: 'female',
        dogName: 'Luna',
        email: 'lisa@test.de',
        password: 'test123',
        accessible: true,
        need_his_time: true,
        city: 'Graz',
        area: 'Lend',
        postalCode: '8020',
        visibleToGender: 'female',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.city).toBe('Graz');
    expect(res.body.user.area).toBe('Lend');
    expect(res.body.user.postalCode).toBe('8020');
    expect(res.body.user.visibleToGender).toBe('female');
  });

  it('sollte leeren String als Name ablehnen', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: '',
        gender: 'male',
        dogName: 'Rex',
        email: 'empty@test.de',
        password: 'test',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('sollte mit korrekten Daten einloggen', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'max@test.de', password: 'geheim123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('max@test.de');
    // Passwort darf NICHT im Response sein
    expect(res.body.user.password).toBeUndefined();
  });

  it('sollte bei falschem Passwort 401 zurückgeben', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'max@test.de', password: 'falsch' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Falsche Email oder Passwort');
  });

  it('sollte bei nicht existierender Email 401 zurückgeben', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'gibtsnicht@test.de', password: 'egal' });

    expect(res.status).toBe(401);
  });

  it('sollte bei fehlendem Email-Feld 400 zurückgeben', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'test' });

    expect(res.status).toBe(400);
  });

  it('sollte bei fehlendem Passwort-Feld 400 zurückgeben', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'max@test.de' });

    expect(res.status).toBe(400);
  });
});

describe('GET /auth/me', () => {
  it('sollte 401 ohne Session zurückgeben', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.status).toBe(401);
  });

  it('sollte User-Daten mit gültiger Session zurückgeben', async () => {
    const agent = request.agent(app);

    await agent
      .post('/auth/login')
      .send({ email: 'max@test.de', password: 'geheim123' });

    const res = await agent.get('/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('max@test.de');
    expect(res.body.user.name).toBe('Max');
  });
});

describe('PUT /auth/me', () => {
  it('sollte 401 ohne Session zurückgeben', async () => {
    const res = await request(app)
      .put('/auth/me')
      .send({ name: 'Hack', gender: 'male', dogName: 'Rex' });

    expect(res.status).toBe(401);
  });

  it('sollte Profil updaten', async () => {
    const agent = request.agent(app);

    await agent
      .post('/auth/login')
      .send({ email: 'max@test.de', password: 'geheim123' });

    const res = await agent
      .put('/auth/me')
      .send({
        name: 'Max Updated',
        gender: 'male',
        dogName: 'Bello Updated',
        accessible: true,
        need_his_time: false,
        city: 'Wien',
        visibleToGender: 'all',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Max Updated');
    expect(res.body.user.dogName).toBe('Bello Updated');
    expect(res.body.user.city).toBe('Wien');
  });

  it('sollte bei fehlendem Name 400 zurückgeben', async () => {
    const agent = request.agent(app);

    await agent
      .post('/auth/login')
      .send({ email: 'max@test.de', password: 'geheim123' });

    const res = await agent
      .put('/auth/me')
      .send({ gender: 'male', dogName: 'Rex' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Name, Geschlecht und Hundename sind Pflicht');
  });
});

describe('POST /auth/logout', () => {
  it('sollte Session zerstören', async () => {
    const agent = request.agent(app);

    await agent
      .post('/auth/login')
      .send({ email: 'max@test.de', password: 'geheim123' });

    const logoutRes = await agent.post('/auth/logout');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Nach Logout: /me sollte 401 zurückgeben
    const meRes = await agent.get('/auth/me');
    expect(meRes.status).toBe(401);
  });
});
