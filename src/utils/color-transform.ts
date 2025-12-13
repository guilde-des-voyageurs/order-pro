export function transformFirebaseColor(shopifyColor: string): string {
  // Nettoyer la couleur (enlever les parenthèses et leur contenu)
  const cleanColor = shopifyColor.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Normaliser la couleur (minuscules, sans accents)
  const normalizedColor = cleanColor.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return normalizedColor;
}
