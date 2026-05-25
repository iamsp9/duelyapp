export function toBase64(
  buffer: ArrayBuffer
) {
  return btoa(
    String.fromCharCode(
      ...new Uint8Array(buffer)
    )
  );
}

export function fromBase64(
  base64: string
) {
  return Uint8Array.from(
    atob(base64),
    (c) => c.charCodeAt(0)
  );
}