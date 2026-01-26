import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const ruleId = searchParams.get('ruleId');

  if (!shopId || !ruleId) {
    return new Response('Missing shopId or ruleId', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const send = (message: string, type: string = 'info') => {
        const data = JSON.stringify({ message, type, timestamp: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        send('🚀 Démarrage de l\'application locale...', 'info');
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

        // Récupérer la règle
        const { data: rule, error: ruleError } = await supabase
          .from('price_rules')
          .select(`*, modifiers:price_rule_modifiers(*), option_modifiers:price_rule_option_modifiers(*)`)
          .eq('id', ruleId)
          .single();

        if (ruleError || !rule) {
          send('❌ Règle non trouvée', 'error');
          controller.close();
          return;
        }

        send(`✓ Règle: ${rule.sku} (base: ${rule.base_price}€)`, 'success');
        
        if (rule.product_type) {
          send(`  └─ Type de produit: ${rule.product_type}`, 'info');
        }
        
        if (rule.modifiers?.length > 0) {
          send(`  └─ ${rule.modifiers.length} modificateur(s) métachamp`, 'info');
        }
        
        if (rule.option_modifiers?.length > 0) {
          send(`  └─ ${rule.option_modifiers.length} modificateur(s) d'option`, 'info');
        }

        send('', 'info');
        
        // 1. Mettre à jour les coûts dans product_variants (pour l'Inventaire)
        send('📦 Mise à jour des coûts produits...', 'info');
        
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, shopify_id, sku, option1, option2, option3, cost')
          .ilike('sku', `${rule.sku}%`);

        let variantsUpdated = 0;
        if (variants && variants.length > 0) {
          for (const variant of variants) {
            let cost = rule.base_price;
            
            // Appliquer les modificateurs d'options
            const variantOptions = [variant.option1, variant.option2, variant.option3].filter(Boolean);
            for (const optMod of rule.option_modifiers || []) {
              const match = variantOptions.some(
                (opt: string) => opt.toLowerCase() === optMod.option_value.toLowerCase()
              );
              if (match) {
                cost += optMod.modifier_amount;
              }
            }

            if (variant.cost !== cost) {
              await supabase
                .from('product_variants')
                .update({ cost: cost })
                .eq('id', variant.id);
              variantsUpdated++;
              send(`  ✓ ${variant.sku} → ${cost.toFixed(2)}€`, 'progress');
            }
          }
        }
        send(`✓ ${variantsUpdated} variante(s) mise(s) à jour`, 'success');

        send('', 'info');
        send('📋 Mise à jour des commandes...', 'info');

        // 2. Récupérer toutes les commandes avec leurs line_items
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, name, line_items')
          .eq('shop_id', shopId);

        if (ordersError || !orders) {
          send('❌ Erreur lors de la récupération des commandes', 'error');
          controller.close();
          return;
        }

        send(`  └─ ${orders.length} commande(s) à analyser`, 'info');

        let totalUpdated = 0;
        let totalOrders = 0;

        for (const order of orders) {
          const lineItems = order.line_items || [];
          let orderUpdated = false;
          const updatedLineItems = [...lineItems];

          for (let i = 0; i < updatedLineItems.length; i++) {
            const item = updatedLineItems[i];
            const itemSku = item.sku || '';

            // Vérifier si le SKU correspond à la règle
            if (!itemSku.toUpperCase().startsWith(rule.sku.toUpperCase())) {
              continue;
            }

            let cost = rule.base_price;
            const appliedModifiers: string[] = [];

            // Appliquer les modificateurs de métachamps si disponibles
            const itemMetafields = item.metafields || [];
            for (const modifier of rule.modifiers || []) {
              const match = itemMetafields.find(
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
            const itemOptions = item.variant_title?.split(' / ') || [];
            for (const optMod of rule.option_modifiers || []) {
              const match = itemOptions.some(
                (opt: string) => opt.toLowerCase() === optMod.option_value.toLowerCase()
              );

              if (match) {
                cost += optMod.modifier_amount;
                const sign = optMod.modifier_amount >= 0 ? '+' : '';
                appliedModifiers.push(`${sign}${optMod.modifier_amount}€`);
              }
            }

            if (item.unitCost !== cost) {
              updatedLineItems[i] = {
                ...item,
                unitCost: cost,
                totalCost: cost * (item.quantity || 1),
              };
              orderUpdated = true;
              totalUpdated++;
              
              const modStr = appliedModifiers.length > 0 ? ` ${appliedModifiers.join(' ')}` : '';
              send(`  ✓ ${order.name} - ${itemSku} → ${cost.toFixed(2)}€${modStr}`, 'progress');
            }
          }

          if (orderUpdated) {
            await supabase
              .from('orders')
              .update({ line_items: updatedLineItems })
              .eq('id', order.id);
            
            totalOrders++;
          }
        }

        // Mettre à jour la date de dernière application
        await supabase
          .from('price_rules')
          .update({ last_applied_at: new Date().toISOString() })
          .eq('id', ruleId);

        send('', 'info');
        send('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        send(`✅ Terminé: ${totalUpdated} article(s) mis à jour dans ${totalOrders} commande(s)`, 'success');
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
