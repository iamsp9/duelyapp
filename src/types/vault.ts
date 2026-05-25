// src/types/vault.ts

export type VaultMode = "v1" | "v2" | string; // Adjust strings to match your actual crypto versioning/modes

export interface EncryptedVault {
  ciphertext: string;
  iv: string;
  metadata?: Record<string, any> | null;
}