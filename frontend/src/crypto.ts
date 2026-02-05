// Ende-zu-Ende-Verschlüsselung: ECDH P-256 + AES-256-GCM
// Nur Sender und Empfänger können Nachrichten lesen.
// Der Server speichert nur verschlüsselte Daten.

const PBKDF2_ITERATIONS = 100000;
const DB_NAME = 'walkbuddy_e2ee';
const STORE_NAME = 'keys';

// --- Base64 Helpers ---

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- IndexedDB Key Storage ---
// CryptoKey-Objekte werden direkt in IndexedDB gespeichert (Structured Clone).
// Überlebt Tab-Schließen und Browser-Neustart. Wird bei Logout gelöscht.

function openKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storePrivateKey(key: CryptoKey): Promise<void> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(key, 'privateKey');
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadPrivateKey(): Promise<CryptoKey | null> {
  try {
    const db = await openKeyStore();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get('privateKey');
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  } catch {
    return null;
  }
}

export async function clearKeyStore(): Promise<void> {
  try {
    const db = await openKeyStore();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    // ignore
  }
}

// --- Key Generation ---

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// --- Key Export/Import ---

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('spki', key);
  return toBase64(raw);
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    fromBase64(base64),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

// --- Private Key Protection (PBKDF2 + AES-GCM Key Wrapping) ---
// Der private Schlüssel wird mit dem Benutzerpasswort verschlüsselt,
// bevor er auf dem Server gespeichert wird.

export async function encryptPrivateKey(
  privateKey: CryptoKey,
  password: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey']
  );

  const wrapped = await crypto.subtle.wrapKey('pkcs8', privateKey, wrappingKey, {
    name: 'AES-GCM',
    iv,
  });

  return JSON.stringify({
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    key: toBase64(wrapped),
  });
}

export async function decryptPrivateKey(
  encryptedData: string,
  password: string
): Promise<CryptoKey> {
  const { salt, iv, key } = JSON.parse(encryptedData);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const unwrappingKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['unwrapKey']
  );

  return crypto.subtle.unwrapKey(
    'pkcs8',
    fromBase64(key),
    unwrappingKey,
    { name: 'AES-GCM', iv: fromBase64(iv) },
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// --- Message Encryption/Decryption ---
// ECDH Shared Secret + AES-256-GCM
// Sender und Empfänger leiten denselben Shared Secret ab:
//   ECDH(A_private, B_public) === ECDH(B_private, A_public)

async function deriveSharedAesKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    256
  );

  return crypto.subtle.importKey('raw', sharedBits, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptMessage(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const aesKey = await deriveSharedAesKey(myPrivateKey, theirPublicKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv.buffer),
  };
}

export async function decryptMessage(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<string> {
  const aesKey = await deriveSharedAesKey(myPrivateKey, theirPublicKey);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    aesKey,
    fromBase64(ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}
