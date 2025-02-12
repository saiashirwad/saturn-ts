export function hashCode(code: string): string {
  let hash = 5381;
  for (let i = 0; i < code.length; i++) {
    // djb2 algorithm
    hash = (hash << 5) + hash + code.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit integer
  }
  return hash.toString(36); // Convert to base36 for shorter string representation
}
