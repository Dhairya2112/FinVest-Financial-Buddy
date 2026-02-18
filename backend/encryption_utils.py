import os
from cryptography.fernet import Fernet
import base64

class DataCipher:
    """Utility class for AES-256 encryption/decryption of user data."""
    
    _cipher = None

    @classmethod
    def _get_cipher(cls):
        if cls._cipher is None:
            # Load key strictly from Environment Variables
            key = os.environ.get("ENCRYPTION_KEY")
            if not key:
                raise ValueError("ENCRYPTION_KEY environment variable is not set. Cannot securely initialize backend.")
            
            # Ensure the key is bytes
            if isinstance(key, str):
                key = key.encode()
                
            cls._cipher = Fernet(key)
        return cls._cipher

    @classmethod
    def encrypt(cls, data):
        """Encrypt string or numeric data."""
        if data is None:
            return None
        
        # Convert all data to string before encryption
        data_str = str(data)
        cipher = cls._get_cipher()
        return cipher.encrypt(data_str.encode()).decode()

    @classmethod
    def decrypt(cls, encrypted_data):
        """Decrypt data back to its original string form."""
        if encrypted_data is None:
            return None
            
        try:
            cipher = cls._get_cipher()
            decrypted_bytes = cipher.decrypt(encrypted_data.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            # If decryption fails (e.g. data wasn't encrypted), return as-is
            return encrypted_data

    @classmethod
    def decrypt_float(cls, encrypted_data, default=0.0):
        """Decrypt data and convert to float."""
        val = cls.decrypt(encrypted_data)
        try:
            return float(val) if val is not None else default
        except (ValueError, TypeError):
            return default
