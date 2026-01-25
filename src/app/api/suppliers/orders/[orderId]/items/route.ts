import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const body = await request.json();
    const { shopId, items } = body;
    const { orderId } = await params;

    if (!shopId || !orderId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Récupérer les infos de la boutique pour l'API Shopify
    const { data: shop } = await supabase
      .from('shops')
      .select('shopify_url, shopify_token')
      .eq('id', shopId)
      .single();

    // Récupérer les règles de prix pour calculer les prix unitaires
    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('priority');

    // Récupérer les règles de métachamps actives
    const { data: metafieldRules } = await supabase
      .from('metafield_display_rules')
      .select('metafield_key')
      .eq('shop_id', shopId)
      .eq('is_active', true);

    const metafieldKeys = metafieldRules?.map(r => r.metafield_key) || [];

    // Récupérer les shopify_id des variantes pour pouvoir chercher les métachamps
    const variantIds = items.map((item: any) => item.variant_id).filter(Boolean);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, shopify_id, option1, option2, option3')
      .in('id', variantIds);

    const variantMap: Record<string, any> = {};
    variants?.forEach((v: any) => {
      variantMap[v.id] = v;
    });

    // Fonction pour récupérer les métachamps de plusieurs variantes en un seul appel GraphQL
    const fetchAllVariantMetafields = async (shopifyVariantIds: string[]): Promise<Record<string, Record<string, string>>> => {
      if (!shop || !metafieldKeys.length || !shopifyVariantIds.length) return {};
      
      try {
        const gids = shopifyVariantIds.map(id => `gid://shopify/ProductVariant/${id}`);
        
        const query = `
          query GetVariantsMetafields($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on ProductVariant {
                id
                metafields(first: 20) {
                  edges {
                    node {
                      namespace
                      key
                      value
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch(
          `https://${shop.shopify_url}/admin/api/2024-01/graphql.json`,
          {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': shop.shopify_token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              variables: { ids: gids },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const result: Record<string, Record<string, string>> = {};
          
          data.data?.nodes?.forEach((node: any) => {
            if (!node || !node.id) return;
            
            const shopifyId = node.id.replace('gid://shopify/ProductVariant/', '');
            const metafields: Record<string, string> = {};
            
            node.metafields?.edges?.forEach((edge: any) => {
              const mf = edge.node;
              const fullKey = `${mf.namespace}.${mf.key}`;
              if (metafieldKeys.includes(fullKey) || metafieldKeys.includes(mf.key)) {
                metafields[mf.key] = mf.value;
              }
            });
            
            result[shopifyId] = metafields;
          });
          
          return result;
        }
      } catch (err) {
        console.error('Error fetching metafields:', err);
      }
      return {};
    };

    // Construire la chaîne de facturation pour un article
    const buildPricingString = (item: any, variant: any, metafields: Record<string, string>): string => {
      const parts: string[] = [];
      
      // Nom du produit
      if (item.product_title) parts.push(item.product_title);
      
      // SKU
      if (item.sku) parts.push(item.sku);
      
      // Options (taille, couleur, etc.)
      if (variant?.option1) parts.push(variant.option1);
      if (variant?.option2) parts.push(variant.option2);
      if (variant?.option3) parts.push(variant.option3);
      
      // Métachamps
      Object.values(metafields).forEach(value => {
        if (value) parts.push(value);
      });
      
      return parts.join(', ');
    };

    // Fonction pour calculer le prix unitaire basé sur la chaîne de facturation
    const calculateUnitPrice = (pricingString: string) => {
      let price = 0;
      const upperString = pricingString.toUpperCase();
      
      // Chercher le prix de base
      const baseRule = pricingRules?.find(r => r.rule_type === 'base_price');
      if (baseRule) {
        price = baseRule.price_value;
      }

      // Appliquer les majorations basées sur la chaîne de facturation
      pricingRules?.forEach(rule => {
        if (rule.rule_type === 'base_price') return;
        
        let matches = false;
        
        if (rule.condition_value) {
          // Vérifier si la condition est présente dans la chaîne de facturation
          matches = upperString.includes(rule.condition_value.toUpperCase());
        }
        
        if (matches) {
          if (rule.is_percentage) {
            price += price * (rule.price_value / 100);
          } else {
            price += rule.price_value;
          }
        }
      });

      return price;
    };

    // Récupérer tous les métachamps en un seul appel (optimisation)
    const shopifyVariantIds = items
      .map((item: any) => variantMap[item.variant_id]?.shopify_id)
      .filter(Boolean);
    
    const allMetafields = await fetchAllVariantMetafields(shopifyVariantIds);

    // Préparer les articles à insérer
    const itemsToInsert = items.map((item: any) => {
      const variant = variantMap[item.variant_id];
      const shopifyVariantId = variant?.shopify_id;
      
      // Récupérer les métachamps depuis le cache
      const metafields = shopifyVariantId ? (allMetafields[shopifyVariantId] || {}) : {};
      
      // Construire la chaîne de facturation
      const pricingString = buildPricingString(item, variant, metafields);
      
      // Calculer le prix basé sur la chaîne
      const unitPrice = calculateUnitPrice(pricingString);
      
      return {
        order_id: orderId,
        variant_id: item.variant_id,
        product_title: item.product_title,
        variant_title: item.variant_title,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: unitPrice * item.quantity,
        pricing_string: pricingString,
      };
    });

    console.log('Inserting items:', JSON.stringify(itemsToInsert, null, 2));

    const { data: insertedItems, error } = await supabase
      .from('supplier_order_items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('Error inserting items:', error);
      
      // Si l'erreur est liée à pricing_string, réessayer sans cette colonne
      if (error.message?.includes('pricing_string')) {
        console.log('Retrying without pricing_string column...');
        const itemsWithoutPricingString = itemsToInsert.map(({ pricing_string, ...rest }: any) => rest);
        
        const { data: retryItems, error: retryError } = await supabase
          .from('supplier_order_items')
          .insert(itemsWithoutPricingString)
          .select();
        
        if (retryError) {
          console.error('Retry error:', retryError);
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
        
        await updateOrderTotals(orderId, shopId);
        return NextResponse.json({ items: retryItems });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mettre à jour les totaux de la commande
    await updateOrderTotals(orderId, shopId);

    // Passer la commande en "in_progress" si elle était en "draft"
    await supabase
      .from('supplier_orders')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'draft');

    return NextResponse.json({ items: insertedItems });
  } catch (error) {
    console.error('Error adding items:', error);
    return NextResponse.json({ error: 'Failed to add items' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const body = await request.json();
    const { shopId, itemId, is_validated, quantity, unit_price } = body;
    const { orderId } = await params;

    if (!shopId || !orderId || !itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (is_validated !== undefined) {
      updateData.is_validated = is_validated;
      updateData.validated_at = is_validated ? new Date().toISOString() : null;
    }
    
    if (quantity !== undefined) {
      updateData.quantity = quantity;
      // Recalculer le total de la ligne
      const { data: item } = await supabase
        .from('supplier_order_items')
        .select('unit_price')
        .eq('id', itemId)
        .single();
      
      if (item) {
        updateData.line_total = (unit_price || item.unit_price) * quantity;
      }
    }
    
    if (unit_price !== undefined) {
      updateData.unit_price = unit_price;
      // Recalculer le total de la ligne
      const { data: item } = await supabase
        .from('supplier_order_items')
        .select('quantity')
        .eq('id', itemId)
        .single();
      
      if (item) {
        updateData.line_total = unit_price * (quantity || item.quantity);
      }
    }

    const { data: updatedItem, error } = await supabase
      .from('supplier_order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mettre à jour les totaux de la commande si nécessaire
    if (quantity !== undefined || unit_price !== undefined) {
      await updateOrderTotals(orderId, shopId);
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const shopId = searchParams.get('shopId');
    const { orderId } = await params;

    if (!shopId || !orderId || !itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('supplier_order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mettre à jour les totaux de la commande
    await updateOrderTotals(orderId, shopId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

async function updateOrderTotals(orderId: string, shopId: string) {
  // Calculer le sous-total
  const { data: items } = await supabase
    .from('supplier_order_items')
    .select('line_total')
    .eq('order_id', orderId);

  const subtotal = items?.reduce((sum, item) => sum + (item.line_total || 0), 0) || 0;

  // Récupérer la balance actuelle
  const { data: order } = await supabase
    .from('supplier_orders')
    .select('balance_adjustment')
    .eq('id', orderId)
    .single();

  const balanceAdjustment = order?.balance_adjustment || 0;
  const totalHt = subtotal + balanceAdjustment;
  const totalTtc = totalHt * 1.2;

  // Mettre à jour la commande
  await supabase
    .from('supplier_orders')
    .update({
      subtotal,
      total_ht: totalHt,
      total_ttc: totalTtc,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('shop_id', shopId);
}
