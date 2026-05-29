// src/types/vault.ts

export type VaultMode = "v1" | "v2" | string;

export type VaultType = "main" | "archive";

export interface EncryptedVault {
  ciphertext: string;
  iv: string;
  metadata?: Record<string, any> | null;
}