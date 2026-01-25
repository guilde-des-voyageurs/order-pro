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

    return NextResponse.json({ order, items: items || [] });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
