export const transformProductType = (type: string, forTextile: boolean = false): string => {
  if (forTextile) {
    switch (type.toLowerCase()) {
      case 't-shirt unisexe':
        return 'Creator';
      case 'sweatshirt':
        return 'Drummer (sauf si couleur absente, alors Cruiser)';
      default:
        return type;
    }
  }
  return type;
};
