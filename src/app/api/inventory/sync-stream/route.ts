import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const locationId = searchParams.get('locationId');

  if (!shopId) {
    return new Response('Missing shopId', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const send = (message: string, type: string = 'info') => {
        const data = JSON.stringify({ message, type, timestamp: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        send('🚀 Démarrage de la synchronisation...', 'info');
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

        // Récupérer les produits depuis Shopify (API REST)
        send('📦 Récupération des produits depuis Shopify...', 'info');
        
        let allProducts: any[] = [];
        let currentUrl = `https://${shop.shopify_url}/admin/api/2024-01/products.json?status=active&limit=250`;
        let hasMorePages = true;
        let pageNum = 1;

        while (hasMorePages) {
          const response = await fetch(currentUrl, {
            headers: {
              'X-Shopify-Access-Token': shop.shopify_token,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            send(`❌ Erreur API Shopify (page ${pageNum})`, 'error');
            break;
          }

          const data = await response.json();
          const products = data.products || [];
          allProducts = allProducts.concat(products);
          
          send(`  └─ Page ${pageNum}: ${products.length} produits`, 'progress');
          pageNum++;

          // Vérifier s'il y a une page suivante (Link header)
          const linkHeader = response.headers.get('Link');
          hasMorePages = false;
          if (linkHeader) {
            const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            if (nextMatch && nextMatch[1]) {
              currentUrl = nextMatch[1];
              hasMorePages = true;
            }
          }
        }

        send(`✓ ${allProducts.length} produits récupérés`, 'success');

        // Upsert des produits
        send('', 'info');
        send('💾 Sauvegarde des produits...', 'info');

        const productsToUpsert = allProducts.map((product: any) => ({
          shop_id: shopId,
          shopify_id: product.id.toString(),
          title: product.title,
          handle: product.handle,
          image_url: product.image?.src || product.images?.[0]?.src || null,
          status: product.status,
          option1_name: product.options?.[0]?.name || null,
          option2_name: product.options?.[1]?.name || null,
          option3_name: product.options?.[2]?.name || null,
          synced_at: new Date().toISOString(),
        }));

        if (productsToUpsert.length > 0) {
          const { error: productsError } = await supabase
            .from('products')
            .upsert(productsToUpsert, { onConflict: 'shop_id,shopify_id' });
          
          if (productsError) {
            send(`❌ Erreur sauvegarde produits: ${productsError.message}`, 'error');
          }
        }

        // Récupérer les IDs des produits pour les variantes
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, shopify_id')
          .eq('shop_id', shopId);

        const productIdMap: Record<string, string> = {};
        dbProducts?.forEach((p: any) => {
          productIdMap[p.shopify_id] = p.id;
        });

        send(`✓ ${productsToUpsert.length} produits sauvegardés`, 'success');

        // Upsert des variantes
        send('', 'info');
        send('📋 Sauvegarde des variantes...', 'info');

        const variantsToUpsert: any[] = [];
        const inventoryItemIds: number[] = [];
        const inventoryItemToVariantShopifyId: Record<string, string> = {};

        for (const product of allProducts) {
          const productId = productIdMap[product.id.toString()];
          if (!productId) continue;

          for (const variant of product.variants || []) {
            variantsToUpsert.push({
              product_id: productId,
              shopify_id: variant.id.toString(),
              title: variant.title,
              sku: variant.sku,
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
              inventory_item_id: variant.inventory_item_id?.toString(),
              cost: variant.cost ? parseFloat(variant.cost) : 0,
            });

            if (variant.inventory_item_id) {
              inventoryItemIds.push(variant.inventory_item_id);
              inventoryItemToVariantShopifyId[variant.inventory_item_id.toString()] = variant.id.toString();
            }
          }
        }

        // Upsert par batch
        for (let i = 0; i < variantsToUpsert.length; i += 500) {
          const batch = variantsToUpsert.slice(i, i + 500);
          await supabase
            .from('product_variants')
            .upsert(batch, { onConflict: 'product_id,shopify_id' });
        }

        send(`✓ ${variantsToUpsert.length} variantes sauvegardées`, 'success');

        // Récupérer les coûts depuis inventory_items
        send('', 'info');
        send('💰 Récupération des coûts...', 'info');

        const inventoryItemToCost: Record<string, number> = {};
        for (let i = 0; i < inventoryItemIds.length; i += 50) {
          const batch = inventoryItemIds.slice(i, i + 50);
          const inventoryResponse = await fetch(
            `https://${shop.shopify_url}/admin/api/2024-01/inventory_items.json?ids=${batch.join(',')}`,
            {
              headers: {
                'X-Shopify-Access-Token': shop.shopify_token,
                'Content-Type': 'application/json',
              },
            }
          );

          if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            for (const item of inventoryData.inventory_items || []) {
              if (item.cost) {
                inventoryItemToCost[item.id.toString()] = parseFloat(item.cost);
              }
            }
          }
        }

        // Mettre à jour les coûts
        for (const [inventoryItemId, cost] of Object.entries(inventoryItemToCost)) {
          const variantShopifyId = inventoryItemToVariantShopifyId[inventoryItemId];
          if (variantShopifyId) {
            await supabase
              .from('product_variants')
              .update({ cost })
              .eq('shopify_id', variantShopifyId);
          }
        }

        send(`✓ ${Object.keys(inventoryItemToCost).length} coûts mis à jour`, 'success');

        // Récupérer les IDs des variantes pour l'inventaire
        const { data: dbVariants } = await supabase
          .from('product_variants')
          .select('id, shopify_id, inventory_item_id')
          .in('product_id', Object.values(productIdMap));

        const variantIdMap: Record<string, string> = {};
        const inventoryItemToVariantUuid: Record<string, string> = {};
        dbVariants?.forEach((v: any) => {
          variantIdMap[v.shopify_id] = v.id;
          if (v.inventory_item_id) {
            inventoryItemToVariantUuid[v.inventory_item_id] = v.id;
          }
        });

        // Récupérer les niveaux d'inventaire
        send('', 'info');
        send('📊 Mise à jour des niveaux d\'inventaire...', 'info');

        const inventoryToUpsert: any[] = [];
        for (let i = 0; i < inventoryItemIds.length; i += 50) {
          const batch = inventoryItemIds.slice(i, i + 50);
          const levelsResponse = await fetch(
            `https://${shop.shopify_url}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${batch.join(',')}`,
            {
              headers: {
                'X-Shopify-Access-Token': shop.shopify_token,
                'Content-Type': 'application/json',
              },
            }
          );

          if (levelsResponse.ok) {
            const levelsData = await levelsResponse.json();
            for (const level of levelsData.inventory_levels || []) {
              const variantUuid = inventoryItemToVariantUuid[level.inventory_item_id.toString()];
              if (variantUuid) {
                inventoryToUpsert.push({
                  variant_id: variantUuid,
                  location_id: level.location_id.toString(),
                  quantity: level.available || 0,
                  synced_at: new Date().toISOString(),
                });
              }
            }
          }
        }

        // Upsert inventaire par batch
        for (let i = 0; i < inventoryToUpsert.length; i += 500) {
          const batch = inventoryToUpsert.slice(i, i + 500);
          await supabase
            .from('inventory_levels')
            .upsert(batch, { onConflict: 'variant_id,location_id' });
        }

        send(`✓ ${inventoryToUpsert.length} niveaux d'inventaire mis à jour`, 'success');

        send('', 'info');
        send('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        send(`✅ Synchronisation terminée!`, 'success');
        send(`   ${allProducts.length} produits, ${variantsToUpsert.length} variantes`, 'info');
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
