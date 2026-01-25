import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const { orderId } = await params;

    if (!shopId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('supplier_orders')
      .select('*')
      .eq('id', orderId)
      .eq('shop_id', shopId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Récupérer les articles
    const { data: items, error: itemsError } = await supabase
      .from('supplier_order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('sku');

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
    }

    // Récupérer les règles de métachamps actives pour cette boutique
    let metafieldRules: any[] = [];
    try {
      const { data: rules } = await supabase
        .from('metafield_display_rules')
        .select('metafield_key, display_name')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('display_order');
      
      metafieldRules = rules || [];
    } catch (e) {
      // Table n'existe pas encore
    }

    // Si on a des règles de métachamps et des articles, récupérer les métachamps
    let itemsWithMetafields = items || [];
    if (metafieldRules.length > 0 && items && items.length > 0) {
      const variantIds = items.map((item: any) => item.variant_id).filter(Boolean);
      
      if (variantIds.length > 0) {
        const metafieldKeys = metafieldRules.map((r: any) => r.metafield_key);
        
        // Récupérer les métachamps pour ces variantes
        const { data: metafields } = await supabase
          .from('variant_metafields')
          .select('variant_id, key, value')
          .in('variant_id', variantIds)
          .in('key', metafieldKeys);

        // Créer un map variant_id -> { key: value }
        const metafieldMap: Record<string, Record<string, string>> = {};
        if (metafields) {
          metafields.forEach((mf: any) => {
            if (!metafieldMap[mf.variant_id]) {
              metafieldMap[mf.variant_id] = {};
            }
            metafieldMap[mf.variant_id][mf.key] = mf.value;
          });
        }

        // Ajouter les métachamps aux items
        itemsWithMetafields = items.map((item: any) => ({
          ...item,
          metafields: item.variant_id ? metafieldMap[item.variant_id] || {} : {},
        }));
      }
    }

    return NextResponse.json({ 
      order, 
      items: itemsWithMetafields,
      metafieldRules, // Envoyer les règles pour savoir quelles colonnes afficher
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
