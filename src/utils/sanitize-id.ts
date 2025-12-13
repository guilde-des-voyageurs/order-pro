/**
 * Sanitize a Shopify ID or SKU for use in Firestore paths
 * Replaces all non-alphanumeric characters with underscores
 */
export function sanitizeId(id: string): string {
  // First replace gid://shopify/Order/ with empty string
  const withoutPrefix = id.replace('gid://shopify/Order/', '');
  // Then replace all non-alphanumeric characters with underscore
  return withoutPrefix.replace(/[^a-zA-Z0-9]/g, '_');
}
