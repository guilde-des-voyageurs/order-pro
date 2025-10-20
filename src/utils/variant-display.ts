/**
 * Utilitaires pour l'affichage des variantes
 */

import { transformColor } from './color-transformer';

/**
 * Formate un variantTitle pour l'affichage en appliquant la transformation de couleur
 * Supporte N niveaux de variantes (couleur, taille, matière, etc.)
 * 
 * @param variantTitle - Le titre de la variante au format "Couleur / Taille / Matière / ..."
 * @param separator - Le séparateur à utiliser (par défaut " / ")
 * @returns Le titre formaté avec la couleur transformée
 * 
 * @example
 * formatVariantTitle("terra cotta / XS / Coton")
 * // Returns: "Terra Cotta / XS / Coton"
 */
export const formatVariantTitle = (variantTitle?: string, separator: string = ' / '): string => {
  if (!variantTitle) return '';
  
  return variantTitle
    .split(' / ')
    .map((variant, index) => {
      // Transformer la couleur (première partie) avec transformColor
      if (index === 0) {
        return transformColor(variant);
      }
      // Garder les autres parties telles quelles
      return variant;
    })
    .join(separator);
};

/**
 * Formate un variantTitle pour l'affichage compact (avec tirets)
 * 
 * @param variantTitle - Le titre de la variante
 * @returns Le titre formaté avec des tirets
 * 
 * @example
 * formatVariantCompact("terra cotta / XS / Coton")
 * // Returns: "Terra Cotta - XS - Coton"
 */
export const formatVariantCompact = (variantTitle?: string): string => {
  return formatVariantTitle(variantTitle, ' - ');
};

/**
 * Extrait et formate uniquement la couleur depuis un variantTitle
 * 
 * @param variantTitle - Le titre de la variante
 * @returns La couleur formatée
 */
export const extractColor = (variantTitle?: string): string => {
  if (!variantTitle) return '';
  const color = variantTitle.split(' / ')[0];
  return transformColor(color);
};

/**
 * Extrait la taille depuis un variantTitle
 * 
 * @param variantTitle - Le titre de la variante
 * @returns La taille
 */
export const extractSize = (variantTitle?: string): string => {
  if (!variantTitle) return '';
  const parts = variantTitle.split(' / ');
  return parts[1] || '';
};

/**
 * Extrait toutes les options de variantes sous forme de tableau
 * 
 * @param variantTitle - Le titre de la variante
 * @returns Un tableau des options
 */
export const extractVariantOptions = (variantTitle?: string): string[] => {
  if (!variantTitle) return [];
  return variantTitle.split(' / ');
};
