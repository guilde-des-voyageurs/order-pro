import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminApiClient } from '@shopify/admin-api-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mutation GraphQL pour mettre à jour le coût d'un inventaire
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

// Query pour récupérer les variantes par SKU avec pagination
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
  try {
    const body = await request.json();
    const { shopId, ruleId } = body;

    if (!shopId || !ruleId) {
      return NextResponse.json({ error: 'Missing shopId or ruleId' }, { status: 400 });
    }

    // Récupérer la boutique
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Récupérer la règle avec ses modificateurs
    const { data: rule, error: ruleError } = await supabase
      .from('price_rules')
      .select(`
        *,
        modifiers:price_rule_modifiers(*)
      `)
      .eq('id', ruleId)
      .single();

    if (ruleError || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Créer le client Shopify
    const shopifyClient = createAdminApiClient({
      storeDomain: shop.shopify_url,
      apiVersion: '2024-10',
      accessToken: shop.shopify_token,
    });

    // Récupérer TOUTES les variantes avec ce SKU depuis Shopify (avec pagination)
    let allVariants: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const variantsResult: any = await shopifyClient.request(GET_VARIANTS_BY_SKU_QUERY, {
        variables: {
          query: `sku:${rule.sku}`,
          cursor,
        },
      });

      const pageData: any = variantsResult.data?.productVariants;
      const pageVariants = pageData?.nodes || [];
      allVariants = [...allVariants, ...pageVariants];
      
      hasNextPage = pageData?.pageInfo?.hasNextPage || false;
      cursor = pageData?.pageInfo?.endCursor || null;
      
      console.log(`Fetched ${pageVariants.length} variants (total: ${allVariants.length})`);
    }

    const variants = allVariants;
    console.log(`Found ${variants.length} total variants with SKU ${rule.sku}`);

    if (variants.length === 0) {
      return NextResponse.json({ 
        success: true, 
        updatedCount: 0,
        message: 'Aucune variante trouvée avec ce SKU'
      });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Pour chaque variante, calculer le coût et le mettre à jour
    for (const variant of variants) {
      try {
        // Calculer le coût basé sur les modificateurs
        let cost = rule.base_price;

        // Appliquer les modificateurs basés sur les métachamps
        const metafields = variant.metafields?.nodes || [];
        
        for (const modifier of rule.modifiers) {
          const matchingMetafield = metafields.find(
            (mf: any) => 
              mf.namespace === modifier.metafield_namespace && 
              mf.key === modifier.metafield_key &&
              mf.value === modifier.metafield_value
          );

          if (matchingMetafield) {
            cost += modifier.modifier_amount;
            console.log(`  + ${modifier.modifier_amount}€ for ${modifier.metafield_namespace}.${modifier.metafield_key}=${modifier.metafield_value}`);
          }
        }

        console.log(`Variant ${variant.sku}: calculated cost = ${cost}€`);

        // Mettre à jour le coût sur Shopify
        const updateResult = await shopifyClient.request(UPDATE_INVENTORY_COST_MUTATION, {
          variables: {
            id: variant.inventoryItem.id,
            input: {
              cost: cost.toFixed(2),
            },
          },
        });

        if (updateResult.data?.inventoryItemUpdate?.userErrors?.length > 0) {
          const errorMessages = updateResult.data.inventoryItemUpdate.userErrors
            .map((e: any) => e.message)
            .join(', ');
          errors.push(`${variant.sku}: ${errorMessages}`);
        } else {
          updatedCount++;
        }

        // Petite pause pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (variantError) {
        console.error(`Error updating variant ${variant.id}:`, variantError);
        errors.push(`${variant.sku}: ${variantError}`);
      }
    }

    // Mettre à jour la date de dernière application
    await supabase
      .from('price_rules')
      .update({ last_applied_at: new Date().toISOString() })
      .eq('id', ruleId);

    return NextResponse.json({
      success: true,
      updatedCount,
      totalVariants: variants.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error applying price rule:', error);
    return NextResponse.json({ error: 'Failed to apply price rule' }, { status: 500 });
  }
}
