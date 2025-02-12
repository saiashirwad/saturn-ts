// djb2 algorithm
export function hashCode(code: string): string {
  let hash = 5381;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) + hash + code.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(36);
}
