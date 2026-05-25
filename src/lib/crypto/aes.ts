import {
  toBase64,
  fromBase64,
} from "./encoding";

export async function encryptData(
  keyBytes: Uint8Array,
  data: unknown
) {
  const iv = crypto.getRandomValues(
    new Uint8Array(12)
  );

  const cryptoKey =
    await crypto.subtle.importKey(
      "raw",
      keyBytes,
      "AES-GCM",
      false,
      ["encrypt"]
    );

  const encoded = new TextEncoder().encode(
    JSON.stringify(data)
  );

  const ciphertext =
    await crypto.subtle.encrypt(
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
  keyBytes: Uint8Array,
  ciphertext: string,
  iv: string
): Promise<T> {
  const cryptoKey =
    await crypto.subtle.importKey(
      "raw",
      keyBytes,
      "AES-GCM",
      false,
      ["decrypt"]
    );

  const decrypted =
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: fromBase64(iv),
      },
      cryptoKey,
      fromBase64(ciphertext)
    );

  return JSON.parse(
    new TextDecoder().decode(decrypted)
  );
}