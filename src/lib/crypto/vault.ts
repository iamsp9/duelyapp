import { deriveKey } from "./kdf";
import { encryptData, decryptData } from "./aes";
import { generateSalt, encodeSalt, decodeSalt } from "./salt";
import type { EncryptedVault, VaultMode } from "@/types/vault";

export async function createVault(
  secretOrKey: string | CryptoKey | Uint8Array,
  mode: VaultMode,
  data: unknown,
  existingSalt?: string
): Promise<EncryptedVault> {
  const salt = existingSalt ? decodeSalt(existingSalt) : generateSalt();

  const key =
    typeof secretOrKey === "string"
      ? await deriveKey(secretOrKey, salt)
      : secretOrKey;

  const encrypted = await encryptData(key, data);

  return {
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    metadata: {
      version: 1,
      mode,
      salt: encodeSalt(salt),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function unlockVault<T>(
  secretOrKey: string | CryptoKey | Uint8Array,
  vault: EncryptedVault
): Promise<T> {
  const salt = decodeSalt(vault.metadata.salt);

  const key =
    typeof secretOrKey === "string"
      ? await deriveKey(secretOrKey, salt)
      : secretOrKey;

  return decryptData<T>(key, vault.ciphertext, vault.iv);
}