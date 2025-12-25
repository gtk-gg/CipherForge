// crypto.js - AES-256-GCM, binary-safe

async function getKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
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
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(arrayBuffer, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassword(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    arrayBuffer
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);

  return new Blob([combined]);
}

export async function decryptData(file, password) {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);

  const key = await getKeyFromPassword(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new Uint8Array(decrypted);
  } catch {
    throw new Error("Wrong password or corrupted file");
  }
}
