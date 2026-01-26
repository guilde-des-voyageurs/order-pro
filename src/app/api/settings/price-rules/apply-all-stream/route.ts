import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminApiClient } from '@shopify/admin-api-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GET_VARIANTS_BY_SKU_QUERY = `
  query getVariantsBySku($query: String!, $cursor: String) {
    productVariants(first: 100, query: $query, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        sku
        title
        selectedOptions {
          name
          value
        }
        product {
          productType
        }
        inventoryItem {
          id
        }
        metafields(first: 20) {
          nodes {
            namespace
            key
            value
          }
        }
      }
    }
  }
`;

const UPDATE_INVENTORY_COST_MUTATION = `
  mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
    inventoryItemUpdate(id: $id, input: $input) {
      inventoryItem {
        id
        unitCost {
          amount
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const target = searchParams.get('target'); // 'shopify' or 'local'

  if (!shopId || !target) {
    return new Response('Missing shopId or target', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const send = (message: string, type: string = 'info') => {
        const data = JSON.stringify({ message, type, timestamp: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        send('🚀 Démarrage de l\'application de toutes les règles actives...', 'info');
        send('', 'info');

        // Récupérer la boutique
        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('id', shopId)
          .single();

        if (shopError || !shop) {
          send('❌ Boutique non trouvée', 'error');
          controller.close();
          return;
        }

        send(`✓ Boutique: ${shop.name || shop.shopify_url}`, 'success');

        // Récupérer toutes les règles actives
        const { data: rules, error: rulesError } = await supabase
          .from('price_rules')
          .select(`*, modifiers:price_rule_modifiers(*), option_modifiers:price_rule_option_modifiers(*)`)
          .eq('shop_id', shopId)
          .eq('is_active', true);

        if (rulesError || !rules || rules.length === 0) {
          send('❌ Aucune règle active trouvée', 'error');
          controller.close();
          return;
        }

        send(`✓ ${rules.length} règle(s) active(s) trouvée(s)`, 'success');
        send('', 'info');

        if (target === 'shopify') {
          await applyAllOnShopify(shop, rules, send);
        } else {
          await applyAllLocal(shop, rules, send, shopId);
        }

        send('DONE', 'success');

      } catch (error) {
        send(`❌ Erreur: ${error}`, 'error');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function applyAllOnShopify(
  shop: any, 
  rules: any[], 
  send: (message: string, type?: string) => void
) {
  const shopifyClient = createAdminApiClient({
    storeDomain: shop.shopify_url,
    apiVersion: '2024-10',
    accessToken: shop.shopify_token,
  });

  let totalUpdated = 0;
  let totalErrors = 0;

  for (const rule of rules) {
    send(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
    send(`📋 Règle: ${rule.sku} (base: ${rule.base_price}€)`, 'info');
    
    if (rule.product_type) {
      send(`  └─ Type de produit: ${rule.product_type}`, 'info');
    }

    // Récupérer les variantes
    let allVariants: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const result: any = await shopifyClient.request(GET_VARIANTS_BY_SKU_QUERY, {
        variables: {
          query: `sku:${rule.sku}*`,
          cursor,
        },
      });

      const pageData = result.data?.productVariants;
      const pageVariants = pageData?.nodes || [];
      allVariants = [...allVariants, ...pageVariants];
      
      hasNextPage = pageData?.pageInfo?.hasNextPage || false;
      cursor = pageData?.pageInfo?.endCursor || null;
    }

    // Filtrer par type de produit si spécifié
    let filteredVariants = allVariants;
    if (rule.product_type) {
      filteredVariants = allVariants.filter((v: any) => 
        v.product?.productType?.toLowerCase() === rule.product_type.toLowerCase()
      );
    }

    if (filteredVariants.length === 0) {
      send(`  ⚠️ Aucune variante trouvée`, 'warning');
      continue;
    }

    send(`  └─ ${filteredVariants.length} variante(s) à traiter`, 'info');

    for (let i = 0; i < filteredVariants.length; i++) {
      const variant = filteredVariants[i];
      
      try {
        let cost = rule.base_price;
        const metafields = variant.metafields?.nodes || [];
        const selectedOptions = variant.selectedOptions || [];
        const appliedModifiers: string[] = [];

        // Appliquer les modificateurs de métachamps
        for (const modifier of rule.modifiers || []) {
          const match = metafields.find(
            (mf: any) => 
              mf.namespace === modifier.metafield_namespace && 
              mf.key === modifier.metafield_key &&
              mf.value === modifier.metafield_value
          );

          if (match) {
            cost += modifier.modifier_amount;
            appliedModifiers.push(`+${modifier.modifier_amount}€`);
          }
        }

        // Appliquer les modificateurs d'options
        for (const optMod of rule.option_modifiers || []) {
          const match = selectedOptions.find(
            (opt: any) => 
              opt.name.toLowerCase() === optMod.option_name.toLowerCase() &&
              opt.value.toLowerCase() === optMod.option_value.toLowerCase()
          );

          if (match) {
            cost += optMod.modifier_amount;
            const sign = optMod.modifier_amount >= 0 ? '+' : '';
            appliedModifiers.push(`${sign}${optMod.modifier_amount}€`);
          }
        }

        // Mettre à jour sur Shopify
        const updateResult: any = await shopifyClient.request(UPDATE_INVENTORY_COST_MUTATION, {
          variables: {
            id: variant.inventoryItem.id,
            input: { cost: cost.toFixed(2) },
          },
        });

        if (updateResult.data?.inventoryItemUpdate?.userErrors?.length > 0) {
          send(`    ❌ ${variant.sku} - ${variant.title}`, 'error');
          totalErrors++;
        } else {
          const modStr = appliedModifiers.length > 0 ? ` ${appliedModifiers.join(' ')}` : '';
          send(`    ✓ ${variant.sku} → ${cost.toFixed(2)}€${modStr}`, 'progress');
          totalUpdated++;
        }

        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (err) {
        send(`    ❌ ${variant.sku}: Erreur`, 'error');
        totalErrors++;
      }
    }

    // Mettre à jour la date de dernière application
    await supabase
      .from('price_rules')
      .update({ last_applied_at: new Date().toISOString() })
      .eq('id', rule.id);
  }

  send('', 'info');
  send('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  send(`✅ Terminé: ${totalUpdated} mise(s) à jour, ${totalErrors} erreur(s)`, 'success');
}

async function applyAllLocal(
  shop: any, 
  rules: any[], 
  send: (message: string, type?: string) => void,
  shopId: string
) {
  let totalOrderItemsUpdated = 0;
  let totalOrders = 0;

  send('📋 Mise à jour des commandes...', 'info');

  // Récupérer toutes les commandes avec leurs line_items
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, name, line_items')
    .eq('shop_id', shopId);

  if (ordersError || !orders) {
    send('❌ Erreur lors de la récupération des commandes', 'error');
    return;
  }

  send(`  └─ ${orders.length} commande(s) à analyser`, 'info');

  for (const order of orders) {
    const lineItems = order.line_items || [];
    let orderUpdated = false;
    const updatedLineItems = [...lineItems];

    for (let i = 0; i < updatedLineItems.length; i++) {
      const item = updatedLineItems[i];
      const itemSku = item.sku || '';

      // Trouver la règle applicable
      const matchingRule = rules.find(rule => 
        itemSku.toUpperCase().startsWith(rule.sku.toUpperCase())
      );

      if (matchingRule) {
        let cost = matchingRule.base_price;

        // Appliquer les modificateurs de métachamps si disponibles
        const itemMetafields = item.metafields || [];
        for (const modifier of matchingRule.modifiers || []) {
          const match = itemMetafields.find(
            (mf: any) => 
              mf.namespace === modifier.metafield_namespace && 
              mf.key === modifier.metafield_key &&
              mf.value === modifier.metafield_value
          );

          if (match) {
            cost += modifier.modifier_amount;
          }
        }

        // Appliquer les modificateurs d'options
        const itemOptions = item.variant_title?.split(' / ') || [];
        for (const optMod of matchingRule.option_modifiers || []) {
          const match = itemOptions.some(
            (opt: string) => opt.toLowerCase() === optMod.option_value.toLowerCase()
          );

          if (match) {
            cost += optMod.modifier_amount;
          }
        }

        if (item.unitCost !== cost) {
          updatedLineItems[i] = {
            ...item,
            unitCost: cost,
            totalCost: cost * (item.quantity || 1),
          };
          orderUpdated = true;
          totalOrderItemsUpdated++;
        }
      }
    }

    if (orderUpdated) {
      await supabase
        .from('orders')
        .update({ line_items: updatedLineItems })
        .eq('id', order.id);
      
      totalOrders++;
      send(`  ✓ ${order.name}: articles mis à jour`, 'progress');
    }
  }

  // Mettre à jour les dates de dernière application
  for (const rule of rules) {
    await supabase
      .from('price_rules')
      .update({ last_applied_at: new Date().toISOString() })
      .eq('id', rule.id);
  }

  send('', 'info');
  send('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  send(`✅ Terminé: ${totalOrderItemsUpdated} article(s) mis à jour dans ${totalOrders} commande(s)`, 'success');
}
