/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Use a default key in development (NOT SECURE - only for local dev)
    console.warn('⚠️  Using default encryption key - NOT SECURE. Set ENCRYPTION_KEY in production!');
    return Buffer.from('dev-key-not-secure-change-me-32'.padEnd(KEY_LENGTH, '0'));
  }

  // Derive key from the environment variable
  return crypto.pbkdf2Sync(key, 'salt', 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:encrypted:tag
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Return format: iv:encrypted:tag (all in hex)
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypts encrypted data
 * @param encryptedData - Encrypted string in format: iv:encrypted:tag
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hashes sensitive data (one-way)
 * Useful for storing passwords or API key verification
 * @param text - Plain text to hash
 * @returns Hashed string
 */
export function hash(text: string): string {
  if (!text) return '';

  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(text, salt, 100000, 64, 'sha512').toString('hex');

  return `${salt}:${hash}`;
}

/**
 * Verifies hashed data
 * @param text - Plain text to verify
 * @param hashedText - Hashed string to compare against
 * @returns True if match, false otherwise
 */
export function verifyHash(text: string, hashedText: string): boolean {
  if (!text || !hashedText) return false;

  try {
    const [salt, originalHash] = hashedText.split(':');
    const hash = crypto.pbkdf2Sync(text, salt, 100000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch (error) {
    return false;
  }
}

/**
 * Generates a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Random token as hex string
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Masks sensitive data for logging
 * Shows first and last few characters
 * @param text - Text to mask
 * @param visibleChars - Number of characters to show at start/end (default: 4)
 * @returns Masked string
 */
export function maskSensitive(text: string, visibleChars: number = 4): string {
  if (!text || text.length <= visibleChars * 2) {
    return '****';
  }

  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const masked = '*'.repeat(Math.max(8, text.length - visibleChars * 2));

  return `${start}${masked}${end}`;
}

