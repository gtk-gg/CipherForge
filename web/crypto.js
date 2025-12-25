// crypto.js

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// derive AES-256 key from password
async function deriveKey(password, salt) {
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

// ENCRYPT
async function encryptData(arrayBuffer, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    arrayBuffer
  );

  // combine: [salt][iv][ciphertext]
  const result = new Uint8Array(
    salt.byteLength + iv.byteLength + encrypted.byteLength
  );

  result.set(salt, 0);
  result.set(iv, salt.byteLength);
  result.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);

  return new Blob([result], { type: "application/octet-stream" });
}

// DECRYPT
async function decryptData(file, password) {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      ciphertext
    );

    return decrypted;
  } catch (e) {
    throw new Error("Wrong password or corrupted file");
  }
}
