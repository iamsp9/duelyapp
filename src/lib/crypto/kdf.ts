export async function deriveKey(
  secret: string,
  salt: Uint8Array
) {
  const encoder = new TextEncoder();

  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 600000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

  return new Uint8Array(derivedBits);
}