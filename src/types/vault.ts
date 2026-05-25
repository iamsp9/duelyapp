export type VaultMode =
  | "pin"
  | "passphrase";

export interface VaultMetadata {
  version: number;

  mode: VaultMode;

  salt: string;

  createdAt: string;

  updatedAt: string;
}

export interface EncryptedVault {
  ciphertext: string;

  iv: string;

  metadata: VaultMetadata;
}