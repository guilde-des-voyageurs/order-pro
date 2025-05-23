import { colorMappings } from '@/constants/colors';

export function transformFirebaseColor(shopifyColor: string): string {
  // Nettoyer la couleur (enlever les parenthèses et leur contenu)
  const cleanColor = shopifyColor.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Normaliser la couleur (minuscules, sans accents)
  const normalizedColor = cleanColor.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Chercher dans notre mapping
  const mapping = colorMappings[normalizedColor];
  
  // Si on trouve un mapping, on retourne la couleur standardisée
  // Sinon on retourne la couleur d'origine sans modification
  return mapping ? mapping.internalName : shopifyColor;
}
