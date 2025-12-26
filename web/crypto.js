const encoder = new TextEncoder();
const decoder = new TextDecoder();

/* ===============================
   KEY DERIVATION (PBKDF2)
================================ */
async function getKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/* ===============================
   ENCRYPT
   Stores MIME type safely
================================ */
async function encryptData(buffer, password, mimeType) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer
  );

  const meta = encoder.encode(mimeType);
  const metaLen = new Uint8Array([meta.length]);

  const output = new Uint8Array(
    16 + 12 + 1 + meta.length + encrypted.byteLength
  );

  let offset = 0;
  output.set(salt, offset); offset += 16;
  output.set(iv, offset); offset += 12;
  output.set(metaLen, offset); offset += 1;
  output.set(meta, offset); offset += meta.length;
  output.set(new Uint8Array(encrypted), offset);

  return output.buffer;
}

/* ===============================
   DECRYPT
   Restores MIME type
================================ */
async function decryptData(file, password) {
  const data = new Uint8Array(await file.arrayBuffer());

  let offset = 0;
  const salt = data.slice(offset, offset + 16); offset += 16;
  const iv = data.slice(offset, offset + 12); offset += 12;

  const metaLen = data[offset]; offset += 1;
  const mimeType = decoder.decode(
    data.slice(offset, offset + metaLen)
  );
  offset += metaLen;

  const encrypted = data.slice(offset);
  const key = await getKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return {
    buffer: decrypted,
    mimeType
  };
}
