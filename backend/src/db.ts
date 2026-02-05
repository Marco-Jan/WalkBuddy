// backend/src/db.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.join(__dirname, '../data/buddywalk.db');


console.log('DB-Pfad:', dbPath);

export const dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database
});

export async function initDb() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      humanGender TEXT NOT NULL DEFAULT 'male', 
      gender TEXT NOT NULL DEFAULT 'male',
      age TEXT NOT NULL,
      breed TEXT DEFAULT NULL,
      city TEXT DEFAULT NULL,
      area TEXT DEFAULT NULL,
      postalCode TEXT DEFAULT NULL,
      dogName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      accessible INTEGER NOT NULL DEFAULT 1,
      need_his_time INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1,
      visibleToGender TEXT NOT NULL DEFAULT 'all',
      publicKey TEXT DEFAULT NULL,
      encryptedPrivateKey TEXT DEFAULT NULL,
      neutered TEXT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      profilePic TEXT DEFAULT NULL,
      role TEXT DEFAULT 'user',
      aktiv INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    senderId TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    iv TEXT DEFAULT NULL,
    active INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (senderId) REFERENCES users(id),
    FOREIGN KEY (receiverId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversation_reads (
      userId TEXT NOT NULL,
      otherId TEXT NOT NULL,
      lastSeenAt DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00',
      PRIMARY KEY (userId, otherId)
    );

    CREATE TABLE IF NOT EXISTS blocks (
      userId TEXT NOT NULL,
      blockedUserId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, blockedUserId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (blockedUserId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporterId TEXT NOT NULL,
      reportedUserId TEXT NOT NULL,
      reason TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved INTEGER DEFAULT 0,
      FOREIGN KEY (reporterId) REFERENCES users(id),
      FOREIGN KEY (reportedUserId) REFERENCES users(id)
    );

  `);

  // Migration: age-Spalte hinzufügen falls sie fehlt
  const cols = await db.all(`PRAGMA table_info(users)`);
  const hasAge = cols.some((c: any) => c.name === 'age');
  if (!hasAge) {
    await db.exec(`ALTER TABLE users ADD COLUMN age TEXT NOT NULL DEFAULT ''`);
    console.log('✅ Migration: age-Spalte zu users hinzugefügt');
  }

  // Migration: E2EE-Spalten für users
  const userCols = await db.all(`PRAGMA table_info(users)`);
  if (!userCols.some((c: any) => c.name === 'publicKey')) {
    await db.exec(`ALTER TABLE users ADD COLUMN publicKey TEXT DEFAULT NULL`);
    console.log('✅ Migration: publicKey-Spalte zu users hinzugefügt');
  }
  if (!userCols.some((c: any) => c.name === 'encryptedPrivateKey')) {
    await db.exec(`ALTER TABLE users ADD COLUMN encryptedPrivateKey TEXT DEFAULT NULL`);
    console.log('✅ Migration: encryptedPrivateKey-Spalte zu users hinzugefügt');
  }

  // Migration: iv-Spalte für messages (E2EE)
  const msgCols = await db.all(`PRAGMA table_info(messages)`);
  if (!msgCols.some((c: any) => c.name === 'iv')) {
    await db.exec(`ALTER TABLE messages ADD COLUMN iv TEXT DEFAULT NULL`);
    console.log('✅ Migration: iv-Spalte zu messages hinzugefügt');
  }

   // Migration: breed-Spalte für users breed
  const breedCols = await db.all(`PRAGMA table_info(users)`);
  if (!breedCols.some((c: any) => c.name === 'breed')) {
    await db.exec(`ALTER TABLE users ADD COLUMN breed TEXT DEFAULT NULL`);
    console.log('✅ Migration: breed-Spalte zu messages hinzugefügt');
  }

    // Migration: humanAge-Spalte für users breed
  const humanGenderCols = await db.all(`PRAGMA table_info(users)`);
  if (!humanGenderCols.some((c: any) => c.name === 'humanGender')) {
    await db.exec(`ALTER TABLE users ADD COLUMN humanGender TEXT DEFAULT 'male'`);
    console.log('✅ Migration: HumanGender-Spalte zu messages hinzugefügt');
  }


  // Migration: profilePic-Spalte für users
  const picCols = await db.all(`PRAGMA table_info(users)`);
  if (!picCols.some((c: any) => c.name === 'profilePic')) {
    await db.exec(`ALTER TABLE users ADD COLUMN profilePic TEXT DEFAULT NULL`);
    console.log('✅ Migration: profilePic-Spalte zu users hinzugefügt');
  }

  // Migration: role-Spalte für users
  const roleCols = await db.all(`PRAGMA table_info(users)`);
  if (!roleCols.some((c: any) => c.name === 'role')) {
    await db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  }



  // Migration: resolved-Spalte für reports
  const reportCols = await db.all(`PRAGMA table_info(reports)`);
  if (!reportCols.some((c: any) => c.name === 'resolved')) {
    await db.exec(`ALTER TABLE reports ADD COLUMN resolved INTEGER DEFAULT 0`);
    console.log('✅ Migration: resolved-Spalte zu reports hinzugefügt');
  }

    // Migration: aktiv-Spalte für users
  const aktivCols = await db.all(`PRAGMA table_info(users)`);
  if (!aktivCols.some((c: any) => c.name === 'aktiv')) {
    await db.exec(`ALTER TABLE users ADD COLUMN aktiv INTEGER DEFAULT 1`);
    console.log('✅ Migration: aktiv-Spalte zu users hinzugefügt');
  }



  // Migration: active-Spalte für messages (soft delete)
  const msgCols2 = await db.all(`PRAGMA table_info(messages)`);
  if (!msgCols2.some((c: any) => c.name === 'active')) {
    await db.exec(`ALTER TABLE messages ADD COLUMN active INTEGER NOT NULL DEFAULT 1`);
    console.log('✅ Migration: active-Spalte zu messages hinzugefügt');
  }

  // Migration: neutered-Spalte für users (Hund kastriert)
  const neuteredCols = await db.all(`PRAGMA table_info(users)`);
  if (!neuteredCols.some((c: any) => c.name === 'neutered')) {
    await db.exec(`ALTER TABLE users ADD COLUMN neutered TEXT DEFAULT NULL`);
    console.log('✅ Migration: neutered-Spalte zu users hinzugefügt');
  }

  // Migration: description-Spalte für users (Hund Beschreibung)
  const descCols = await db.all(`PRAGMA table_info(users)`);
  if (!descCols.some((c: any) => c.name === 'description')) {
    await db.exec(`ALTER TABLE users ADD COLUMN description TEXT DEFAULT NULL`);
    console.log('✅ Migration: description-Spalte zu users hinzugefügt');
  }

  // Migration: emailVerified-Spalte für users (DEFAULT 1 damit bestehende User verifiziert bleiben)
  const verifiedCols = await db.all(`PRAGMA table_info(users)`);
  if (!verifiedCols.some((c: any) => c.name === 'emailVerified')) {
    await db.exec(`ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 1`);
    console.log('✅ Migration: emailVerified-Spalte zu users hinzugefügt');
  }

  // Migration: emailVerificationToken-Spalte für users
  const tokenCols = await db.all(`PRAGMA table_info(users)`);
  if (!tokenCols.some((c: any) => c.name === 'emailVerificationToken')) {
    await db.exec(`ALTER TABLE users ADD COLUMN emailVerificationToken TEXT DEFAULT NULL`);
    console.log('✅ Migration: emailVerificationToken-Spalte zu users hinzugefügt');
  }

  console.log('✅ SQLite DB bereit:', dbPath);
}
