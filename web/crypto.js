const encoder = new TextEncoder();

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
   ENCRYPT (AES-256-GCM)
   Binary-safe for ALL file types
================================ */
async function encryptData(buffer, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer
  );

  // Layout:
  // [16 salt][12 iv][ciphertext + auth tag]
  const output = new Uint8Array(
    16 + 12 + encrypted.byteLength
  );

  let offset = 0;
  output.set(salt, offset); offset += 16;
  output.set(iv, offset); offset += 12;
  output.set(new Uint8Array(encrypted), offset);

  return output.buffer;
}

/* ===============================
   DECRYPT (AES-256-GCM)
================================ */
async function decryptData(file, password) {
  const data = new Uint8Array(await file.arrayBuffer());

  let offset = 0;
  const salt = data.slice(offset, offset + 16); offset += 16;
  const iv = data.slice(offset, offset + 12); offset += 12;
  const encrypted = data.slice(offset);

  const key = await getKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return decrypted; // ArrayBuffer
}
