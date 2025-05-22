import { PriceRule, VariantPriceInfo } from './types';
import { priceRules } from './rules';

function matchesCondition(value: string | undefined, condition: string | RegExp | undefined): boolean {
  if (!condition) return true; // Si pas de condition, c'est un match
  if (!value) return false;   // Si pas de valeur mais une condition, pas de match
  
  if (condition instanceof RegExp) {
    return condition.test(value);
  }
  
  return value.toLowerCase() === condition.toLowerCase();
}

export function calculateVariantPrice(variant: VariantPriceInfo): number | null {
  // Parcourir toutes les règles dans l'ordre
  for (const rule of priceRules) {
    // Vérifier si toutes les conditions de la règle sont remplies
    const skuMatches = matchesCondition(variant.sku, rule.sku);
    const colorMatches = matchesCondition(variant.color, rule.color);
    const printFileMatches = matchesCondition(variant.printFile, rule.printFile);

    // Si toutes les conditions sont remplies, retourner le prix
    if (skuMatches && colorMatches && printFileMatches) {
      return rule.price;
    }
  }

  // Si aucune règle ne correspond, retourner null
  return null;
}

// Fonction utilitaire pour formater le prix
export function formatPrice(price: number | null): string {
  if (price === null) return 'N/A';
  return `${price.toFixed(2)}€`;
}
