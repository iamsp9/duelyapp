import { toBase64, fromBase64 } from "./encoding";

export async function encryptData(
  key: Uint8Array | CryptoKey,
  data: unknown
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Determine if we need to convert raw bytes to a CryptoKey, 
  // or if a ready-to-use CryptoKey was passed in.
  const cryptoKey =
    key instanceof Uint8Array
      ? await crypto.subtle.importKey(
          "raw",
          key,
          "AES-GCM",
          false,
          ["encrypt"]
        )
      : key;

  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    encoded
  );

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv.buffer),
  };
}

export async function decryptData<T>(
  key: Uint8Array | CryptoKey,
  ciphertext: string,
  iv: string
): Promise<T> {
  const cryptoKey =
    key instanceof Uint8Array
      ? await crypto.subtle.importKey(
          "raw",
          key,
          "AES-GCM",
          false,
          ["decrypt"]
        )
      : key;

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(iv),
    },
    cryptoKey,
    fromBase64(ciphertext)
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}