class CipherForgeCrypto {
  constructor() {
    this.magic = new Uint8Array([67,70,33]); // 'CF!'
  }

  async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw", enc.encode(password),
      { name: "PBKDF2" },
      false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt","decrypt"]
    );
  }

  async encryptFile(file, password) {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const key = await this.deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM IV
    const buffer = await file.arrayBuffer();
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      buffer
    );

    // Compose final Blob: magic + salt + file size (8 bytes) + iv + ciphertext
    const sizeBuf = new ArrayBuffer(8);
    new DataView(sizeBuf).setBigUint64(0, BigInt(file.size));
    const blob = new Blob([
      this.magic,
      salt,
      sizeBuf,
      iv,
      new Uint8Array(encrypted)
    ]);

    return blob;
  }

  async decryptFile(file, password) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Verify magic
    if(bytes[0]!==67 || bytes[1]!==70 || bytes[2]!==33)
      throw new Error("Not a CipherForge encrypted file");

    const salt = bytes.slice(3,35);
    const size = Number(new DataView(bytes.buffer,35,8).getBigUint64(0));
    const iv = bytes.slice(43,55);
    const ciphertext = bytes.slice(55);

    const key = await this.deriveKey(password, salt);
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name:"AES-GCM", iv: iv },
        key,
        ciphertext
      );
      if(decrypted.byteLength !== size) console.warn("Size mismatch!");
      return new Blob([decrypted]);
    } catch(e) {
      throw new Error("Decryption failed. Wrong password or corrupted file.");
    }
  }

  generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for(let i=0;i<100;i++) pwd += chars[Math.floor(Math.random()*chars.length)];
    return pwd;
  }
}
