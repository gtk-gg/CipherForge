async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
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
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(buffer, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer
  );

  return new Blob([salt, iv, new Uint8Array(encrypted)]);
}

async function decryptData(blob, password) {
  const raw = new Uint8Array(await blob.arrayBuffer());

  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const data = raw.slice(28);

  const key = await deriveKey(password, salt);

  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
}
