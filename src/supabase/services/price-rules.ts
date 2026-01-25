import { supabase } from '../client';
import type { PriceRule } from '../types';

/**
 * Récupère toutes les règles de prix d'une boutique
 */
export async function getPriceRules(shopId: string) {
  const { data, error } = await supabase
    .from('price_rules')
    .select('*')
    .eq('shop_id', shopId)
    .order('search_string', { ascending: true });

  if (error) throw error;
  return data as PriceRule[];
}

/**
 * Crée une nouvelle règle de prix
 */
export async function createPriceRule(shopId: string, searchString: string, price: number) {
  const { data, error } = await supabase
    .from('price_rules')
    .insert({
      shop_id: shopId,
      search_string: searchString,
      price,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PriceRule;
}

/**
 * Met à jour une règle de prix
 */
export async function updatePriceRule(ruleId: string, updates: { search_string?: string; price?: number }) {
  const { data, error } = await supabase
    .from('price_rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) throw error;
  return data as PriceRule;
}

/**
 * Supprime une règle de prix
 */
export async function deletePriceRule(ruleId: string) {
  const { error } = await supabase
    .from('price_rules')
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
