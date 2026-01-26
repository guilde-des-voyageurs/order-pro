import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminApiClient } from '@shopify/admin-api-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { shopId, ruleId } = body;

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (message: string, type: 'info' | 'success' | 'error' | 'progress' = 'info') => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message, type, timestamp: new Date().toISOString() })}\n\n`));
      };

      try {
        send('🚀 Démarrage de l\'application des règles...', 'info');

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
          .select(`*, modifiers:price_rule_modifiers(*)`)
          .eq('id', ruleId)
          .single();

        if (ruleError || !rule) {
          send('❌ Règle non trouvée', 'error');
          controller.close();
          return;
        }

        send(`✓ Règle: ${rule.sku} (base: ${rule.base_price}€)`, 'success');
        
        if (rule.modifiers?.length > 0) {
          send(`  └─ ${rule.modifiers.length} modificateur(s) configuré(s)`, 'info');
        }

        // Créer le client Shopify
        const shopifyClient = createAdminApiClient({
          storeDomain: shop.shopify_url,
          apiVersion: '2024-10',
          accessToken: shop.shopify_token,
        });

        // Récupérer toutes les variantes
        send('📦 Récupération des variantes Shopify...', 'info');
        
        let allVariants: any[] = [];
        let cursor: string | null = null;
        let hasNextPage = true;
        let pageNum = 0;

        while (hasNextPage) {
          pageNum++;
          const variantsResult: any = await shopifyClient.request(GET_VARIANTS_BY_SKU_QUERY, {
            variables: { query: `sku:${rule.sku}`, cursor },
          });

          const pageData: any = variantsResult.data?.productVariants;
          const pageVariants = pageData?.nodes || [];
          allVariants = [...allVariants, ...pageVariants];
          
          hasNextPage = pageData?.pageInfo?.hasNextPage || false;
          cursor = pageData?.pageInfo?.endCursor || null;
          
          send(`  └─ Page ${pageNum}: ${pageVariants.length} variantes (total: ${allVariants.length})`, 'info');
        }

        if (allVariants.length === 0) {
          send('⚠️ Aucune variante trouvée avec ce SKU', 'error');
          controller.close();
          return;
        }

        send(`✓ ${allVariants.length} variante(s) trouvée(s)`, 'success');
        send('', 'info');
        send('🔄 Application des modifications...', 'info');

        let updatedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < allVariants.length; i++) {
          const variant = allVariants[i];
          
          try {
            // Calculer le coût
            let cost = rule.base_price;
            const metafields = variant.metafields?.nodes || [];
            const appliedModifiers: string[] = [];
            
            for (const modifier of rule.modifiers || []) {
              const match = metafields.find(
                (mf: any) => 
                  mf.namespace === modifier.metafield_namespace && 
                  mf.key === modifier.metafield_key &&
                  mf.value === modifier.metafield_value
              );

              if (match) {
                cost += modifier.modifier_amount;
                appliedModifiers.push(`+${modifier.modifier_amount}€ (${modifier.metafield_value})`);
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
              const err = updateResult.data.inventoryItemUpdate.userErrors[0].message;
              send(`  ❌ [${i + 1}/${allVariants.length}] ${variant.sku} - ${variant.title}: ${err}`, 'error');
              errorCount++;
            } else {
              const modifiersStr = appliedModifiers.length > 0 ? ` ${appliedModifiers.join(' ')}` : '';
              send(`  ✓ [${i + 1}/${allVariants.length}] ${variant.sku} - ${variant.title} → ${cost.toFixed(2)}€${modifiersStr}`, 'progress');
              updatedCount++;
            }

            // Petite pause pour éviter le rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));

          } catch (err) {
            send(`  ❌ [${i + 1}/${allVariants.length}] ${variant.sku}: Erreur`, 'error');
            errorCount++;
          }
        }

        send('', 'info');
        send('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        send(`✅ Terminé: ${updatedCount} mise(s) à jour, ${errorCount} erreur(s)`, 'success');

        // Mettre à jour la date de dernière application
        await supabase
          .from('price_rules')
          .update({ last_applied_at: new Date().toISOString() })
          .eq('id', ruleId);

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
