const idMap = {
  order: `gid://shopify/Order/`,
} as const;

export class ShopifyIds {
  static fromUri(uri: string) {
    const parts = uri.split('/');
    return parts[parts.length - 1];
  }

  static ensureUri(idOrUri: string, type: keyof typeof idMap) {
    if (idOrUri.startsWith('gid://')) {
      return idOrUri;
    }

    return `${idMap[type]}${idOrUri}`;
  }
}
