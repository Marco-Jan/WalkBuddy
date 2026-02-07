// Test-Helper: In-Memory SQLite DB initialisieren
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as dbModule from '../db';

let testDb: Database;

export async function setupTestDb() {
  testDb = await open({
    filename: ':memory:',
    driver: sqlite3.Database,
  });

  await testDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age STRING NOT NULL,
      city TEXT DEFAULT NULL,
      area TEXT DEFAULT NULL,
      postalCode TEXT DEFAULT NULL,
      dogName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      accessible INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT NULL,
      need_his_time INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 0,
      visibleToGender TEXT NOT NULL DEFAULT 'all'
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderId) REFERENCES users(id),
      FOREIGN KEY (receiverId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversation_reads (
      userId TEXT NOT NULL,
      otherId TEXT NOT NULL,
      lastSeenAt DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00',
      PRIMARY KEY (userId, otherId)
    );

    CREATE TABLE IF NOT EXISTS statuses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      text TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // dbPromise mocken: das Promise resolved direkt zur testDb
  Object.defineProperty(dbModule, 'dbPromise', {
    value: Promise.resolve(testDb),
    writable: true,
  });

  return testDb;
}

export async function teardownTestDb() {
  if (testDb) {
    await testDb.close();
  }
}

export function getTestDb() {
  return testDb;
}
