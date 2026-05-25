export function generateSalt() {
  return crypto.getRandomValues(
    new Uint8Array(16)
  );
}

export function encodeSalt(
  salt: Uint8Array
) {
  return btoa(
    String.fromCharCode(...salt)
  );
}

export function decodeSalt(
  encoded: string
) {
  return Uint8Array.from(
    atob(encoded),
    (c) => c.charCodeAt(0)
  );
}