// Fichier conservé pour compatibilité avec les anciennes pages
// La table pricing_rules a été supprimée

export interface PriceRule {
  id: string;
  shop_id: string;
  search_string: string;
  price: number;
}

export async function getPriceRules(shopId: string): Promise<PriceRule[]> {
  return [];
}

export async function createPriceRule(shopId: string, searchString: string, price: number): Promise<PriceRule> {
  throw new Error('pricing_rules table has been removed');
}

export async function updatePriceRule(ruleId: string, updates: { search_string?: string; price?: number }): Promise<PriceRule> {
  throw new Error('pricing_rules table has been removed');
}

export async function deletePriceRule(ruleId: string): Promise<void> {
  throw new Error('pricing_rules table has been removed');
}

export function calculateItemPrice(itemDescription: string, rules: PriceRule[]): number {
  return 0;
}

export function calculateItemPriceWithDetails(
  itemDescription: string, 
  rules: PriceRule[]
): { total: number; appliedRules: PriceRule[] } {
  return { total: 0, appliedRules: [] };
}
