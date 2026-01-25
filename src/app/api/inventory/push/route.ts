import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/client';

// Sync Supabase → Shopify (envoyer les données vers Shopify)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, locationId } = body;

    if (!shopId || !locationId) {
      return NextResponse.json(
        { error: 'Shop ID and Location ID are required' },
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

    // Récupérer tous les niveaux d'inventaire locaux pour cet emplacement
    const { data: inventoryLevels, error: inventoryError } = await supabase
      .from('inventory_levels')
      .select(`
        id,
        quantity,
        location_id,
        variant:product_variants(
          id,
          inventory_item_id
        )
      `)
      .eq('location_id', locationId);

    if (inventoryError) {
      console.error('Error fetching local inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch local inventory' },
        { status: 500 }
      );
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Mettre à jour chaque niveau d'inventaire sur Shopify
    for (const level of inventoryLevels || []) {
      // variant est retourné comme un objet unique grâce à la relation
      const variant = Array.isArray(level.variant) ? level.variant[0] : level.variant;
      const inventoryItemId = variant?.inventory_item_id;
      if (!inventoryItemId) continue;

      try {
        const response = await fetch(
          `https://${shop.shopify_url}/admin/api/2024-01/inventory_levels/set.json`,
          {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': shop.shopify_token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location_id: parseInt(locationId),
              inventory_item_id: parseInt(inventoryItemId),
              available: level.quantity,
            }),
          }
        );

        if (response.ok) {
          updatedCount++;
          
          // Mettre à jour synced_at
          await supabase
            .from('inventory_levels')
            .update({ synced_at: new Date().toISOString() })
            .eq('id', level.id);
        } else {
          const errorText = await response.text();
          console.error('Shopify API error:', errorText);
          errorCount++;
        }

        // Respecter le rate limit de Shopify (2 requêtes par seconde pour être safe)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('Error updating inventory item:', err);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation vers Shopify terminée`,
      stats: {
        updated: updatedCount,
        errors: errorCount,
        total: inventoryLevels?.length || 0,
      }
    });
  } catch (error) {
    console.error('Error pushing inventory to Shopify:', error);
    return NextResponse.json(
      { error: 'Failed to push inventory to Shopify' },
      { status: 500 }
    );
  }
}
