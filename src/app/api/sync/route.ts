import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/client';
import { fetchOrdersApiAction } from '@/actions/fetch-orders-api-action';

export async function POST(request: Request) {
  try {
    const { shopId } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Récupérer les informations de la boutique pour les credentials Shopify
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Créer un enregistrement de synchronisation
    const { data: syncRecord, error: syncError } = await supabase
      .from('syncs')
      .insert({
        shop_id: shopId,
        status: 'running',
      })
      .select()
      .single();

    if (syncError) {
      console.error('Error creating sync record:', syncError);
    }

    // Récupérer les commandes depuis Shopify via l'API GraphQL
    // On passe les credentials de la boutique
    const allOrders = await fetchOrdersApiAction(shop.shopify_url, shop.shopify_token);

    // Filtrer les commandes avec le tag "no-order-pro"
    const orders = allOrders.filter(order => 
      !order.tags?.some((tag: string) => tag.toLowerCase() === 'no-order-pro')
    );

    // Identifier les commandes "no-order-pro" à supprimer de la base
    const noOrderProIds = allOrders
      .filter(order => order.tags?.some((tag: string) => tag.toLowerCase() === 'no-order-pro'))
      .map(order => order.id);

    if (noOrderProIds.length > 0) {
      // Supprimer les commandes "no-order-pro" existantes de Supabase
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('shop_id', shopId)
        .in('shopify_id', noOrderProIds);

      if (deleteError) {
        console.error('Error deleting no-order-pro orders:', deleteError);
      } else {
        console.log(`Deleted ${noOrderProIds.length} orders with "no-order-pro" tag`);
      }
    }

    console.log(`Syncing ${orders.length} orders (filtered ${allOrders.length - orders.length} with "no-order-pro" tag)`);

    // Transformer et sauvegarder les commandes dans Supabase
    const ordersToInsert = orders.map(order => ({
      shop_id: shopId,
      shopify_id: order.id,
      name: order.name,
      order_number: order.orderNumber || order.name.replace('#', ''),
      created_at: order.createdAt,
      cancelled_at: order.cancelledAt || null,
      display_fulfillment_status: order.displayFulfillmentStatus,
      display_financial_status: order.displayFinancialStatus,
      total_price: order.totalPrice,
      total_price_currency: order.totalPriceCurrency || 'EUR',
      note: order.note || null,
      tags: order.tags || [],
      line_items: order.lineItems || [],
      synced_at: new Date().toISOString(),
    }));

    // Upsert des commandes (insert ou update si existe déjà)
    const { error: upsertError } = await supabase
      .from('orders')
      .upsert(ordersToInsert, { onConflict: 'shop_id,shopify_id' });

    if (upsertError) {
      throw upsertError;
    }

    // Initialiser la progression pour chaque commande
    for (const order of orders) {
      const totalCount = order.lineItems?.reduce((sum: number, item: any) => {
        return sum + (item.isCancelled ? 0 : item.quantity);
      }, 0) || 0;

      if (totalCount > 0) {
        await supabase
          .from('order_progress')
          .upsert({
            shop_id: shopId,
            order_id: order.id,
            total_count: totalCount,
            checked_count: 0,
          }, { onConflict: 'shop_id,order_id' });
      }
    }

    // Mettre à jour le statut de la synchronisation
    if (syncRecord) {
      await supabase
        .from('syncs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          orders_count: orders.length,
        })
        .eq('id', syncRecord.id);
    }

    return NextResponse.json({ success: true, ordersCount: orders.length });
  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: 'Failed to sync orders' },
      { status: 500 }
    );
  }
}
