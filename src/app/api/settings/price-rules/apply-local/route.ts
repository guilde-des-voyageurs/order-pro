import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fonction pour calculer le coût d'un item selon les règles
function calculateItemCost(
  item: any,
  rules: any[]
): number | null {
  // Trouver la règle correspondant au SKU
  const rule = rules.find(r => r.sku === item.sku);
  if (!rule || !rule.is_active) return null;

  let cost = rule.base_price;

  // Appliquer les modificateurs basés sur les métachamps
  const metafields = item.variant?.metafields || [];
  
  for (const modifier of rule.modifiers || []) {
    const matchingMetafield = metafields.find(
      (mf: any) => 
        mf.namespace === modifier.metafield_namespace && 
        mf.key === modifier.metafield_key &&
        mf.value === modifier.metafield_value
    );

    if (matchingMetafield) {
      cost += modifier.modifier_amount;
    }
  }

  return cost;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ruleId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    // Récupérer les règles (une seule si ruleId fourni, sinon toutes)
    let rulesQuery = supabase
      .from('price_rules')
      .select(`
        *,
        modifiers:price_rule_modifiers(*)
      `)
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (ruleId) {
      rulesQuery = rulesQuery.eq('id', ruleId);
    }

    const { data: rules, error: rulesError } = await rulesQuery;

    if (rulesError || !rules || rules.length === 0) {
      return NextResponse.json({ 
        error: ruleId ? 'Rule not found' : 'No active rules found' 
      }, { status: 404 });
    }

    // Récupérer toutes les commandes de la boutique
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    let updatedOrdersCount = 0;
    let updatedItemsCount = 0;

    // Pour chaque commande, mettre à jour les coûts des items
    for (const order of orders || []) {
      const lineItems = order.line_items || [];
      let orderModified = false;

      const updatedLineItems = lineItems.map((item: any) => {
        const calculatedCost = calculateItemCost(item, rules);
        
        if (calculatedCost !== null) {
          // Mettre à jour le coût
          const newUnitCost = calculatedCost;
          const newTotalCost = calculatedCost * item.quantity;
          
          if (item.unitCost !== newUnitCost || item.totalCost !== newTotalCost) {
            orderModified = true;
            updatedItemsCount++;
            return {
              ...item,
              unitCost: newUnitCost,
              totalCost: newTotalCost,
            };
          }
        }
        return item;
      });

      // Sauvegarder la commande si modifiée
      if (orderModified) {
        await supabase
          .from('orders')
          .update({ line_items: updatedLineItems })
          .eq('id', order.id);
        updatedOrdersCount++;
      }
    }

    // Mettre à jour la date de dernière application si une règle spécifique
    if (ruleId) {
      await supabase
        .from('price_rules')
        .update({ last_applied_at: new Date().toISOString() })
        .eq('id', ruleId);
    }

    return NextResponse.json({
      success: true,
      updatedOrdersCount,
      updatedItemsCount,
      totalOrders: orders?.length || 0,
    });

  } catch (error) {
    console.error('Error applying price rules locally:', error);
    return NextResponse.json({ error: 'Failed to apply price rules' }, { status: 500 });
  }
}
