class CipherForgeCrypto {
    constructor() {
        this.chunkSize = 1024 * 1024; // 1MB chunks
        this.saltSize = 32;
        this.iterations = 100000;
    }

    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        // Import password as key
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        // Derive key using PBKDF2
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        
        return derivedKey;
    }

    async encryptFile(file, password) {
        try {
            // Generate salt
            const salt = crypto.getRandomValues(new Uint8Array(this.saltSize));
            
            // Derive key
            const key = await this.deriveKey(password, salt);
            
            // Generate IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const totalChunks = Math.ceil(file.size / this.chunkSize);
            let encryptedChunks = [];
            let processedBytes = 0;
            
            // Read and encrypt file in chunks
            for (let i = 0; i < totalChunks; i++) {
                const start = i * this.chunkSize;
                const end = Math.min(start + this.chunkSize, file.size);
                const chunk = file.slice(start, end);
                
                const chunkBuffer = await chunk.arrayBuffer();
                const encryptedChunk = await crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: i === 0 ? iv : new Uint8Array(12), // Use IV only for first chunk
                        additionalData: new TextEncoder().encode(`chunk_${i}`)
                    },
                    key,
                    chunkBuffer
                );
                
                encryptedChunks.push(new Uint8Array(encryptedChunk));
                processedBytes += (end - start);
                
                // Update progress
                if (this.onProgress) {
                    this.onProgress(processedBytes, file.size);
                }
            }
            
            // Combine all chunks
            const totalEncryptedSize = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedEncrypted = new Uint8Array(totalEncryptedSize);
            let offset = 0;
            for (const chunk of encryptedChunks) {
                combinedEncrypted.set(chunk, offset);
                offset += chunk.length;
            }
            
            // Create final file structure
            const header = new TextEncoder().encode('CF2!');
            const fileSizeBuffer = new Uint8Array(new BigUint64Array([BigInt(file.size)]).buffer);
            
            const finalFile = new Uint8Array(
                header.length + 
                salt.length + 
                iv.length + 
                fileSizeBuffer.length + 
                combinedEncrypted.length
            );
            
            let finalOffset = 0;
            finalFile.set(header, finalOffset);
            finalOffset += header.length;
            finalFile.set(salt, finalOffset);
            finalOffset += salt.length;
            finalFile.set(iv, finalOffset);
            finalOffset += iv.length;
            finalFile.set(fileSizeBuffer, finalOffset);
            finalOffset += fileSizeBuffer.length;
            finalFile.set(combinedEncrypted, finalOffset);
            
            return new Blob([finalFile], { type: 'application/octet-stream' });
            
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    async decryptFile(file, password) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const view = new DataView(arrayBuffer);
            
            // Check magic
            const magic = String.fromCharCode(...new Uint8Array(arrayBuffer, 0, 4));
            if (magic !== 'CF2!') {
                throw new Error('Not a CipherForge encrypted file');
            }
            
            let offset = 4;
            
            // Read salt
            const salt = new Uint8Array(arrayBuffer, offset, this.saltSize);
            offset += this.saltSize;
            
            // Read IV
            const iv = new Uint8Array(arrayBuffer, offset, 12);
            offset += 12;
            
            // Read original file size
            const sizeBuffer = new Uint8Array(arrayBuffer, offset, 8);
            const originalSize = new DataView(sizeBuffer.buffer).getBigUint64(0, true);
            offset += 8;
            
            // Get encrypted data
            const encryptedData = new Uint8Array(arrayBuffer, offset);
            
            // Derive key
            const key = await this.deriveKey(password, salt);
            
            // Determine chunk sizes (encrypted chunks are larger due to auth tag)
            const encryptedChunkSize = Math.ceil(this.chunkSize) + 16; // Add 16 bytes for GCM tag
            const totalChunks = Math.ceil(encryptedData.length / encryptedChunkSize);
            
            let decryptedChunks = [];
            let processedBytes = 0;
            
            for (let i = 0; i < totalChunks; i++) {
                const start = i * encryptedChunkSize;
                const end = Math.min(start + encryptedChunkSize, encryptedData.length);
                const chunk = encryptedData.slice(start, end);
                
                try {
                    const decryptedChunk = await crypto.subtle.decrypt(
                        {
                            name: 'AES-GCM',
                            iv: i === 0 ? iv : new Uint8Array(12),
                            additionalData: new TextEncoder().encode(`chunk_${i}`)
                        },
                        key,
                        chunk
                    );
                    
                    decryptedChunks.push(new Uint8Array(decryptedChunk));
                    processedBytes += chunk.length;
                    
                } catch (decryptError) {
                    throw new Error('Wrong password or file corrupted');
                }
                
                // Update progress
                if (this.onProgress) {
                    this.onProgress(processedBytes, encryptedData.length);
                }
            }
            
            // Combine all decrypted chunks
            const totalDecryptedSize = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
            
            if (totalDecryptedSize !== Number(originalSize)) {
                throw new Error('File size mismatch - possible corruption');
            }
            
            const combinedDecrypted = new Uint8Array(totalDecryptedSize);
            let decryptedOffset = 0;
            for (const chunk of decryptedChunks) {
                combinedDecrypted.set(chunk, decryptedOffset);
                decryptedOffset += chunk.length;
            }
            
            return new Blob([combinedDecrypted]);
            
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    generatePassword() {
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghijkmnopqrstuvwxyz';
        const digits = '23456789';
        const special = '!@#$%^&*';
        const allChars = upper + lower + digits + special;
        
        let password = [
            upper.charAt(Math.floor(Math.random() * upper.length)),
            lower.charAt(Math.floor(Math.random() * lower.length)),
            digits.charAt(Math.floor(Math.random() * digits.length)),
            special.charAt(Math.floor(Math.random() * special.length))
        ];
        
        // Add random characters
        for (let i = 0; i < 20; i++) {
            password.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
        }
        
        // Shuffle
        for (let i = password.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [password[i], password[j]] = [password[j], password[i]];
        }
        
        return password.join('');
    }

    checkPasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        return {
            score: score,
            strength: score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong',
            percentage: Math.min(100, (score / 6) * 100)
        };
    }
}
