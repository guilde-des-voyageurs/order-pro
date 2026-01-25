import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    // Récupérer les commandes avec le comptage des articles
    const { data: orders, error } = await supabase
      .from('supplier_orders')
      .select(`
        *,
        items:supplier_order_items(count),
        validated_items:supplier_order_items(count)
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformer les données pour inclure les comptages
    const ordersWithCounts = await Promise.all((orders || []).map(async (order) => {
      // Compter les articles
      const { count: itemsCount } = await supabase
        .from('supplier_order_items')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id);

      // Compter les articles validés
      const { count: validatedCount } = await supabase
        .from('supplier_order_items')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id)
        .eq('is_validated', true);

      return {
        ...order,
        items_count: itemsCount || 0,
        validated_count: validatedCount || 0,
      };
    }));

    return NextResponse.json({ orders: ordersWithCounts });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, note } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    // Générer un numéro de commande unique
    const { count } = await supabase
      .from('supplier_orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);

    const orderNumber = `BATCH-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data: order, error } = await supabase
      .from('supplier_orders')
      .insert({
        shop_id: shopId,
        order_number: orderNumber,
        status: 'draft',
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopId, status, note, balance_adjustment } = body;

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.closed_at = new Date().toISOString();
      }
    }
    if (note !== undefined) updateData.note = note;
    if (balance_adjustment !== undefined) updateData.balance_adjustment = balance_adjustment;

    // Recalculer les totaux si nécessaire
    if (balance_adjustment !== undefined) {
      const { data: items } = await supabase
        .from('supplier_order_items')
        .select('line_total')
        .eq('order_id', id);

      const subtotal = items?.reduce((sum, item) => sum + (item.line_total || 0), 0) || 0;
      const totalHt = subtotal + (balance_adjustment || 0);
      const totalTtc = totalHt * 1.2;

      updateData.subtotal = subtotal;
      updateData.total_ht = totalHt;
      updateData.total_ttc = totalTtc;
    }

    const { data: order, error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const shopId = searchParams.get('shopId');

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('supplier_orders')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error deleting order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
