import { supabase } from '../client';
import type { PriceRule } from '../types';

/**
 * Récupère toutes les règles de prix d'une boutique
 */
export async function getPriceRules(shopId: string) {
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('rule_name', { ascending: true });

  if (error) throw error;
  
  // Convertir vers le format attendu pour compatibilité
  return (data || []).map(rule => ({
    id: rule.id,
    shop_id: rule.shop_id,
    search_string: rule.condition_value || rule.rule_name,
    price: rule.price_value,
  })) as PriceRule[];
}

/**
 * Crée une nouvelle règle de prix
 */
export async function createPriceRule(shopId: string, searchString: string, price: number) {
  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({
      shop_id: shopId,
      rule_name: searchString,
      rule_type: 'sku_markup',
      condition_field: 'sku',
      condition_value: searchString,
      price_value: price,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    shop_id: data.shop_id,
    search_string: data.condition_value || data.rule_name,
    price: data.price_value,
  } as PriceRule;
}

/**
 * Met à jour une règle de prix
 */
export async function updatePriceRule(ruleId: string, updates: { search_string?: string; price?: number }) {
  const updateData: any = {};
  if (updates.search_string) {
    updateData.rule_name = updates.search_string;
    updateData.condition_value = updates.search_string;
  }
  if (updates.price !== undefined) {
    updateData.price_value = updates.price;
  }

  const { data, error } = await supabase
    .from('pricing_rules')
    .update(updateData)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    shop_id: data.shop_id,
    search_string: data.condition_value || data.rule_name,
    price: data.price_value,
  } as PriceRule;
}

/**
 * Supprime une règle de prix
 */
export async function deletePriceRule(ruleId: string) {
  const { error } = await supabase
    .from('pricing_rules')
    .delete()
    .eq('id', ruleId);

  if (error) throw error;
}

/**
 * Calcule le prix d'un article en fonction des règles
 */
export function calculateItemPrice(itemDescription: string, rules: PriceRule[]): number {
  let totalPrice = 0;
  const matchedRules: PriceRule[] = [];

  for (const rule of rules) {
    if (itemDescription.toLowerCase().includes(rule.search_string.toLowerCase())) {
      totalPrice += rule.price;
      matchedRules.push(rule);
    }
  }

  return totalPrice;
}

/**
 * Calcule le prix d'un article et retourne les règles appliquées
 */
export function calculateItemPriceWithDetails(
  itemDescription: string, 
  rules: PriceRule[]
): { total: number; appliedRules: PriceRule[] } {
  const appliedRules: PriceRule[] = [];

  for (const rule of rules) {
    if (itemDescription.toLowerCase().includes(rule.search_string.toLowerCase())) {
      appliedRules.push(rule);
    }
  }

  const total = appliedRules.reduce((sum, rule) => sum + rule.price, 0);

  return { total, appliedRules };
}
