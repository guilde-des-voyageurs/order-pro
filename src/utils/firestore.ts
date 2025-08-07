/**
 * Encode un ID pour qu'il soit valide dans Firestore
 * Remplace les caractères invalides par des caractères valides
 */
export function encodeFirestoreId(id: string): string {
  return id.replace(/[/]/g, '_');
}
