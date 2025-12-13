export function encodeFirestoreId(id: string): string {
  return id.replace(/\//g, '_');
}
