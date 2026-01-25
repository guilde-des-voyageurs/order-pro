import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/client';

// Sync Shopify → Supabase (récupérer les données depuis Shopify)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, locationId } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Récupérer les informations de la boutique
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('shopify_url, shopify_token')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // 1. Récupérer les emplacements depuis Shopify
    const locationsResponse = await fetch(
      `https://${shop.shopify_url}/admin/api/2024-01/locations.json`,
      {
        headers: {
          'X-Shopify-Access-Token': shop.shopify_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (locationsResponse.ok) {
      const locationsData = await locationsResponse.json();
      
      // Batch upsert des emplacements
      const locationsToUpsert = locationsData.locations.map((location: any) => ({
        shop_id: shopId,
        shopify_id: location.id.toString(),
        name: location.name,
        address1: location.address1,
        city: location.city,
        country: location.country,
        active: location.active,
        synced_at: new Date().toISOString(),
      }));

      if (locationsToUpsert.length > 0) {
        await supabase
          .from('locations')
          .upsert(locationsToUpsert, { onConflict: 'shop_id,shopify_id' });
      }
    }

    // 2. Récupérer TOUS les produits depuis Shopify (avec pagination)
    const allProducts: any[] = [];
    let currentUrl = `https://${shop.shopify_url}/admin/api/2024-01/products.json?status=active&limit=250`;
    let hasMorePages = true;

    while (hasMorePages) {
      const productsResponse = await fetch(currentUrl, {
        headers: {
          'X-Shopify-Access-Token': shop.shopify_token,
          'Content-Type': 'application/json',
        },
      });

      if (!productsResponse.ok) {
        console.error('Shopify Products API error:', await productsResponse.text());
        break;
      }

      const productsData = await productsResponse.json();
      allProducts.push(...(productsData.products || []));

      // Vérifier s'il y a une page suivante (Link header)
      const linkHeader = productsResponse.headers.get('Link');
      hasMorePages = false;
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextMatch && nextMatch[1]) {
          currentUrl = nextMatch[1];
          hasMorePages = true;
        }
      }
    }

    console.log(`Fetched ${allProducts.length} products from Shopify`);

    // 3. Batch upsert des produits
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
      await supabase
        .from('products')
        .upsert(productsToUpsert, { onConflict: 'shop_id,shopify_id' });
    }

    // 4. Récupérer les IDs des produits insérés
    const { data: insertedProducts } = await supabase
      .from('products')
      .select('id, shopify_id')
      .eq('shop_id', shopId);

    const productIdMap: Record<string, string> = {};
    insertedProducts?.forEach(p => {
      productIdMap[p.shopify_id] = p.id;
    });

    // 5. Préparer et batch upsert des variantes
    const variantsToUpsert: any[] = [];
    const inventoryItemIds: number[] = [];
    const inventoryItemToVariantShopifyId: Record<string, string> = {};

    for (const product of allProducts) {
      const productId = productIdMap[product.id.toString()];
      if (!productId) continue;

      for (const variant of product.variants) {
        variantsToUpsert.push({
          product_id: productId,
          shopify_id: variant.id.toString(),
          title: variant.title,
          sku: variant.sku,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
          inventory_item_id: variant.inventory_item_id?.toString(),
        });

        if (variant.inventory_item_id) {
          inventoryItemIds.push(variant.inventory_item_id);
          inventoryItemToVariantShopifyId[variant.inventory_item_id.toString()] = variant.id.toString();
        }
      }
    }

    // Upsert variantes par batch de 500
    for (let i = 0; i < variantsToUpsert.length; i += 500) {
      const batch = variantsToUpsert.slice(i, i + 500);
      await supabase
        .from('product_variants')
        .upsert(batch, { onConflict: 'product_id,shopify_id' });
    }

    console.log(`Upserted ${variantsToUpsert.length} variants`);

    // 6. Récupérer les IDs des variantes insérées
    const { data: insertedVariants } = await supabase
      .from('product_variants')
      .select('id, shopify_id')
      .in('product_id', Object.values(productIdMap));

    const variantIdMap: Record<string, string> = {};
    insertedVariants?.forEach(v => {
      variantIdMap[v.shopify_id] = v.id;
    });

    // 7. Récupérer les niveaux d'inventaire
    let locationIds: string[] = [];
    if (locationId) {
      locationIds = [locationId];
    } else {
      const { data: locations } = await supabase
        .from('locations')
        .select('shopify_id')
        .eq('shop_id', shopId)
        .eq('active', true);
      
      locationIds = locations?.map(l => l.shopify_id) || [];
    }
    
    console.log('Location IDs for inventory sync:', locationIds);
    console.log('Inventory item IDs count:', inventoryItemIds.length);

    // Récupérer et batch upsert l'inventaire
    const inventoryToUpsert: any[] = [];

    for (const locId of locationIds) {
      for (let i = 0; i < inventoryItemIds.length; i += 50) {
        const batch = inventoryItemIds.slice(i, i + 50);
        const inventoryResponse = await fetch(
          `https://${shop.shopify_url}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${batch.join(',')}&location_ids=${locId}`,
          {
            headers: {
              'X-Shopify-Access-Token': shop.shopify_token,
              'Content-Type': 'application/json',
            },
          }
        );

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          
          for (const level of inventoryData.inventory_levels) {
            const variantShopifyId = inventoryItemToVariantShopifyId[level.inventory_item_id.toString()];
            const variantId = variantShopifyId ? variantIdMap[variantShopifyId] : null;
            
            if (variantId) {
              inventoryToUpsert.push({
                variant_id: variantId,
                location_id: level.location_id.toString(),
                quantity: level.available || 0,
                synced_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    // Upsert inventaire par batch de 500
    for (let i = 0; i < inventoryToUpsert.length; i += 500) {
      const batch = inventoryToUpsert.slice(i, i + 500);
      await supabase
        .from('inventory_levels')
        .upsert(batch, { onConflict: 'variant_id,location_id' });
    }

    console.log(`Upserted ${inventoryToUpsert.length} inventory levels`);

    // 8. Récupérer les metafields des variantes (optionnel - nécessite la migration 007)
    let metafieldsCount = 0;
    try {
      // Vérifier si la table existe
      const { error: tableCheckError } = await supabase
        .from('variant_metafields')
        .select('id')
        .limit(1);
      
      if (!tableCheckError) {
        const metafieldsToUpsert: any[] = [];
        
        for (let i = 0; i < allProducts.length; i += 10) {
          const productBatch = allProducts.slice(i, i + 10);
          
          for (const product of productBatch) {
            for (const variant of product.variants) {
              const variantId = variantIdMap[variant.id.toString()];
              if (!variantId) continue;
              
              try {
                const metafieldsResponse = await fetch(
                  `https://${shop.shopify_url}/admin/api/2024-01/variants/${variant.id}/metafields.json`,
                  {
                    headers: {
                      'X-Shopify-Access-Token': shop.shopify_token,
                      'Content-Type': 'application/json',
                    },
                  }
                );

                if (metafieldsResponse.ok) {
                  const metafieldsData = await metafieldsResponse.json();
                  
                  for (const metafield of metafieldsData.metafields || []) {
                    metafieldsToUpsert.push({
                      variant_id: variantId,
                      namespace: metafield.namespace,
                      key: metafield.key,
                      value: metafield.value,
                      type: metafield.type,
                      synced_at: new Date().toISOString(),
                    });
                  }
                }
              } catch (err) {
                // Ignorer les erreurs individuelles de metafields
              }
            }
          }
        }

        // Upsert metafields par batch de 500
        for (let i = 0; i < metafieldsToUpsert.length; i += 500) {
          const batch = metafieldsToUpsert.slice(i, i + 500);
          await supabase
            .from('variant_metafields')
            .upsert(batch, { onConflict: 'variant_id,namespace,key' });
        }
        
        metafieldsCount = metafieldsToUpsert.length;
        console.log(`Upserted ${metafieldsCount} variant metafields`);
      } else {
        console.log('Table variant_metafields not found, skipping metafields sync');
      }
    } catch (err) {
      console.log('Metafields sync skipped (table may not exist yet)');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Synchronisation terminée',
      stats: {
        products: allProducts.length,
        variants: variantsToUpsert.length,
        inventoryLevels: inventoryToUpsert.length,
        locations: locationIds.length,
        metafields: metafieldsCount,
      }
    });
  } catch (error) {
    console.error('Error syncing inventory:', error);
    return NextResponse.json(
      { error: 'Failed to sync inventory' },
      { status: 500 }
    );
  }
}
