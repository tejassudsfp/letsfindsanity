"""Encryption service for sensitive data"""

import os
from cryptography.fernet import Fernet
import base64


def get_encryption_key():
    """Get encryption key from environment variable"""
    key = os.getenv('ENCRYPTION_KEY')
    if not key:
        raise ValueError("ENCRYPTION_KEY not found in environment variables")
    return key.encode()


def encrypt_content(plaintext: str) -> str:
    """
    Encrypt plaintext content using Fernet symmetric encryption

    Args:
        plaintext: The text to encrypt

    Returns:
        Base64-encoded encrypted string
    """
    if not plaintext:
        return ''

    try:
        key = get_encryption_key()
        f = Fernet(key)
        encrypted = f.encrypt(plaintext.encode())
        return encrypted.decode()
    except Exception as e:
        # Log error but don't expose encryption details
        print(f"Encryption error: {str(e)}")
        raise ValueError("Failed to encrypt content")


def is_encrypted(content: str) -> bool:
    """
    Check if content appears to be encrypted (Fernet format)
    Fernet tokens start with 'gAAAAA' after base64 encoding
    """
    if not content:
        return False

    # Fernet tokens are always base64 and start with version byte
    # Check if it looks like a Fernet token
    try:
        # Fernet tokens have a specific format and length
        return len(content) > 50 and content.startswith('gAAAAA')
    except:
        return False


def decrypt_content(encrypted: str) -> str:
    """
    Decrypt encrypted content using Fernet symmetric encryption
    If content is not encrypted (legacy plaintext), return as-is

    Args:
        encrypted: The base64-encoded encrypted string or plaintext

    Returns:
        Decrypted plaintext string
    """
    if not encrypted:
        return ''

    # Check if content is actually encrypted
    if not is_encrypted(encrypted):
        # Legacy plaintext content - return as-is
        return encrypted

    try:
        key = get_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(encrypted.encode())
        return decrypted.decode()
    except Exception as e:
        # Log error but don't expose encryption details
        print(f"Decryption error: {str(e)}")
        raise ValueError("Failed to decrypt content")
