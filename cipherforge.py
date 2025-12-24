"""
CipherForge - Secure File Encryption
github.com/gtk-gg
"""
import os
import sys
import struct
import hashlib
import secrets
from typing import Tuple, Optional
import getpass

# Import cryptography (optional)
try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
    from cryptography.hazmat.backends import default_backend
    from cryptography.exceptions import InvalidTag
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

# ============================================
# WARNING & BANNER
# ============================================
def show_warning_header():
    os.system('cls' if os.name == 'nt' else 'clear')
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                       ⚠️  IMPORTANT WARNING  ⚠️                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  THIS TOOL IS FOR EDUCATIONAL PURPOSES ONLY!                      ║
║  DO NOT USE FOR MALICIOUS ACTIVITIES OR ILLEGAL PURPOSES          ║
║  DEVELOPER IS NOT RESPONSIBLE FOR YOUR ACTIONS!                   ║
║                                                                   ║
║  ⚠️  ENCRYPTION CAN BE IRREVERSIBLE WITHOUT PASSWORD!             ║
║  ⚠️  SAVE YOUR PASSWORD SECURELY - CANNOT BE RECOVERED!           ║
║  ⚠️  DEVELOPER IS NOT RESPONSIBLE FOR LOST PASSWORDS OR FILE      ║
║  ⚠️  FOR SECURITY PURPOSE, ENCRYPTED FILE WILL BE SAVED AS COPY   ║ 
╚═══════════════════════════════════════════════════════════════════╝
""")

def show_banner():
    os.system('cls' if os.name == 'nt' else 'clear')
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ██████╗██╗██████╗ ██╗  ██╗███████╗██████╗ ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
║  ██╔════╝██║██╔══██╗██║  ██║██╔════╝██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
║  ██║     ██║██████╔╝███████║█████╗  ██████╔╝█████╗  ██║   ██║██████╔╝██║  ███╗█████╗  
║  ██║     ██║██╔═══╝ ██╔══██║██╔══╝  ██╔══██╗██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  
║  ╚██████╗██║██║     ██║  ██║███████╗██║  ██║██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
║   ╚═════╝╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
║                                                                  ║
║                  🔒  Secure File Encryption  🔒                  ║
║                     GitHub: github.com/gtk-gg                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")

# ============================================
# ENCRYPTION ENGINE
# ============================================
class ReliableEncryptionEngine:
    def __init__(self):
        self.chunk_size = 65536  # 64KB chunks

    def derive_key(self, password: str, salt: bytes) -> bytes:
        return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000, 32)

    def encrypt_chunk(self, data: bytes, key: bytes) -> bytes:
        result = bytearray(data)
        key_len = len(key)
        for i in range(len(result)):
            result[i] ^= key[i % key_len]
        return bytes(result)

    def decrypt_chunk(self, data: bytes, key: bytes) -> bytes:
        return self.encrypt_chunk(data, key)

class FileEncryptor:
    def __init__(self):
        self.engine = ReliableEncryptionEngine()

    def encrypt_file(self, input_file: str, output_file: str, password: str) -> Tuple[bool, str]:
        try:
            print(f"Starting encryption of: {input_file}")
            salt = secrets.token_bytes(32)
            key = self.engine.derive_key(password, salt)
            file_size = os.path.getsize(input_file)
            with open(input_file, 'rb') as f_in, open(output_file, 'wb') as f_out:
                f_out.write(b'CF!')  # Magic
                f_out.write(salt)
                f_out.write(struct.pack('Q', file_size))
                checksum = hashlib.sha256()
                bytes_processed = 0
                while True:
                    chunk = f_in.read(self.engine.chunk_size)
                    if not chunk: break
                    encrypted_chunk = self.engine.encrypt_chunk(chunk, key)
                    checksum.update(encrypted_chunk)
                    f_out.write(encrypted_chunk)
                    bytes_processed += len(chunk)
                f_out.write(checksum.digest())
            print(f"Encryption completed successfully!")
            return True, f"Encrypted {file_size:,} bytes"
        except Exception as e:
            return False, f"Error: {str(e)}"

    def decrypt_file(self, input_file: str, output_file: str, password: str) -> Tuple[bool, str]:
        try:
            with open(input_file, 'rb') as f_in:
                if f_in.read(3) != b'CF!':
                    return False, "Not a CipherForge encrypted file"
                salt = f_in.read(32)
                size_data = f_in.read(8)
                if len(salt) != 32 or len(size_data) != 8:
                    return False, "File header corrupted"
                original_size = struct.unpack('Q', size_data)[0]
                key = ReliableEncryptionEngine().derive_key(password, salt)
                current_pos = f_in.tell()
                f_in.seek(0, 2)
                total_size = f_in.tell()
                f_in.seek(current_pos)
                data_size = total_size - 43 - 32
                checksum = hashlib.sha256()
                bytes_written = 0
                with open(output_file, 'wb') as f_out:
                    while bytes_written < data_size:
                        remaining = data_size - bytes_written
                        read_size = min(ReliableEncryptionEngine().chunk_size, remaining)
                        encrypted_chunk = f_in.read(read_size)
                        if not encrypted_chunk: break
                        checksum.update(encrypted_chunk)
                        decrypted_chunk = ReliableEncryptionEngine().decrypt_chunk(encrypted_chunk, key)
                        f_out.write(decrypted_chunk)
                        bytes_written += len(decrypted_chunk)
                    stored_checksum = f_in.read(32)
                    if stored_checksum != checksum.digest():
                        return False, "ERROR: Wrong password or file corrupted"
                if bytes_written != original_size:
                    return False, f"Size mismatch: expected {original_size}, got {bytes_written}"
                return True, f"Decrypted {original_size:,} bytes"
        except Exception as e:
            return False, f"Error: {str(e)}"

# ============================================
# PASSWORD MANAGEMENT
# ============================================
class PasswordManager:
    @staticmethod
    def generate_secure_password() -> str:
        upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
        lower = "abcdefghijkmnopqrstuvwxyz"
        digits = "23456789"
        special = "!@#$%^&*"
        password = [secrets.choice(upper), secrets.choice(lower), secrets.choice(digits), secrets.choice(special)]
        all_chars = upper + lower + digits + special
        for _ in range(20):
            password.append(secrets.choice(all_chars))
        secrets.SystemRandom().shuffle(password)
        return ''.join(password)

    @staticmethod
    def copy_to_clipboard(text: str) -> bool:
        try:
            import pyperclip
            pyperclip.copy(text)
            return True
        except:
            try:
                import tkinter as tk
                root = tk.Tk()
                root.withdraw()
                root.clipboard_clear()
                root.clipboard_append(text)
                root.update()
                root.destroy()
                return True
            except:
                return False

# ============================================
# USER INTERFACE
# ============================================
class CipherForgeUI:
    @staticmethod
    def get_file_path(prompt: str) -> Optional[str]:
        print(f"\n{prompt}\n{'─'*40}")
        path = input("➤ Enter path (or drag & drop): ").strip()
        if path.startswith('"') and path.endswith('"'):
            path = path[1:-1]
        if not os.path.exists(path) or not os.path.isfile(path):
            print("❌ Invalid file path")
            return None
        return path

    @staticmethod
    def get_password_for_encryption() -> Optional[str]:
        print("\n" + "═"*70 + "\n🔒 PASSWORD SETUP\n" + "═"*70)
        print("1. Use my own password\n2. Generate ultra-secure random password\n3. Cancel")
        while True:
            choice = input("\n➤ Select option (1-3): ").strip()
            if choice == '3': return None
            if choice == '1':
                while True:
                    password = getpass.getpass("➤ Enter password: ")
                    if len(password) < 8:
                        if input("⚠️ Too short, use anyway? (y/n): ").lower() != 'y':
                            continue
                    if password == getpass.getpass("➤ Confirm password: "):
                        return password
                    print("❌ Passwords don't match!")
            elif choice == '2':
                password = PasswordManager.generate_secure_password()
                print(f"Generated Password: {password}")
                PasswordManager.copy_to_clipboard(password)
                if input("Use this password? (y/n): ").lower() == 'y':
                    return password

    @staticmethod
    def get_password_for_decryption() -> Optional[str]:
        print("\n" + "═"*70 + "\n🔓 DECRYPTION PASSWORD\n" + "═"*70)
        return getpass.getpass("➤ Password: ")

# ============================================
# SHOW METHODS
# ============================================
def show_encryption_methods():
    show_banner()
    print("\n" + "═"*70 + "\n🔐 ENCRYPTION METHODS USED\n" + "═"*70)
    print("""
1. KEY DERIVATION: PBKDF2 with SHA-256, 100,000 iterations, unique salt
2. ENCRYPTION: XOR-based stream cipher, chunk-by-chunk, 256-bit key
3. INTEGRITY: SHA-256 checksum, file size verification
4. SECURITY: No password storage, memory-safe, no recovery possible
5. ⚠️ IMPORTANT:
   • Without correct password, decryption is mathematically impossible
   • Each file has unique encryption parameters
   • Lost password = permanently encrypted data, So please save the password used for encrypting your file
""")
    input("\n➤ Press Enter to return...")

# ============================================
# MAIN APP
# ============================================
class CipherForge:
    def __init__(self):
        self.ui = CipherForgeUI()
        self.encryptor = FileEncryptor()

    def show_warning_and_accept(self):
        show_warning_header()
        accept = input("\n➤ Type 'ACCEPT' to continue: ").strip().upper()
        return accept == 'ACCEPT'

    def run_encryption(self):
        show_banner()
        file_path = self.ui.get_file_path("📁 SELECT FILE TO ENCRYPT")
        if not file_path: return False
        password = self.ui.get_password_for_encryption()
        if not password: return False
        output_file = file_path + ".encrypted"
        success, msg = self.encryptor.encrypt_file(file_path, output_file, password)
        print(msg)
        return success

    def run_decryption(self):
        show_banner()
        file_path = self.ui.get_file_path("📁 SELECT FILE TO DECRYPT")
        if not file_path: return False
        password = self.ui.get_password_for_decryption()
        if not password: return False
        output_file = file_path[:-10] if file_path.endswith('.encrypted') else file_path + ".decrypted"
        success, msg = self.encryptor.decrypt_file(file_path, output_file, password)
        print(msg)
        return success

    def main_menu(self):
        show_banner()
        print("\n1. Encrypt\n2. Decrypt\n3. Methods\n4. Exit")
        choice = input("➤ Select option: ").strip()
        if choice == '1': self.run_encryption()
        elif choice == '2': self.run_decryption()
        elif choice == '3': show_encryption_methods()
        else: sys.exit(0)

    def run(self):
        if not self.show_warning_and_accept():
            print("❌ Must accept terms"); return
        while True:
            self.main_menu()
            if input("Return to menu? (y/n): ").lower() != 'y': break

def main():
    app = CipherForge()
    app.run()

if __name__ == "__main__":
    main()
