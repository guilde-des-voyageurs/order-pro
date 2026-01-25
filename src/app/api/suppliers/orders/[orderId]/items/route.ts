import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const body = await request.json();
    const { shopId, items } = body;
    const { orderId } = await params;

    if (!shopId || !orderId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Récupérer les variantes avec leur coût Shopify
    const variantIds = items.map((item: any) => item.variant_id).filter(Boolean);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, cost')
      .in('id', variantIds);

    const variantCostMap: Record<string, number> = {};
    variants?.forEach((v: any) => {
      variantCostMap[v.id] = v.cost || 0;
    });

    // Préparer les articles à insérer (utilise le coût Shopify)
    const itemsToInsert = items.map((item: any) => {
      const unitPrice = variantCostMap[item.variant_id] || 0;
      
      return {
        order_id: orderId,
        variant_id: item.variant_id,
        product_title: item.product_title,
        variant_title: item.variant_title,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: unitPrice * item.quantity,
      };
    });

    const { data: insertedItems, error } = await supabase
      .from('supplier_order_items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('Error inserting items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mettre à jour les totaux de la commande
    await updateOrderTotals(orderId, shopId);

    // Passer la commande en "in_progress" si elle était en "draft"
    await supabase
      .from('supplier_orders')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'draft');

    return NextResponse.json({ items: insertedItems });
  } catch (error) {
    console.error('Error adding items:', error);
    return NextResponse.json({ error: 'Failed to add items' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const body = await request.json();
    const { shopId, itemId, is_validated, quantity, unit_price, action } = body;
    const { orderId } = await params;

    // Action spéciale : recalculer tous les prix basés sur les coûts actuels
    if (action === 'recalculate_prices') {
      if (!shopId || !orderId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Récupérer tous les articles de la commande
      const { data: orderItems } = await supabase
        .from('supplier_order_items')
        .select('id, variant_id, quantity')
        .eq('order_id', orderId);

      if (!orderItems || orderItems.length === 0) {
        return NextResponse.json({ message: 'No items to update' });
      }

      // Récupérer les coûts des variantes
      const variantIds = orderItems.map(i => i.variant_id).filter(Boolean);
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, cost')
        .in('id', variantIds);

      const costMap: Record<string, number> = {};
      variants?.forEach(v => {
        costMap[v.id] = v.cost || 0;
      });

      // Mettre à jour chaque article
      let updatedCount = 0;
      for (const item of orderItems) {
        const cost = item.variant_id ? (costMap[item.variant_id] || 0) : 0;
        const lineTotal = cost * item.quantity;

        await supabase
          .from('supplier_order_items')
          .update({ 
            unit_price: cost, 
            line_total: lineTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        updatedCount++;
      }

      // Mettre à jour les totaux de la commande
      await updateOrderTotals(orderId, shopId);

      return NextResponse.json({ 
        message: `${updatedCount} articles mis à jour`,
        updatedCount 
      });
    }

    if (!shopId || !orderId || !itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (is_validated !== undefined) {
      updateData.is_validated = is_validated;
      updateData.validated_at = is_validated ? new Date().toISOString() : null;
    }
    
    if (quantity !== undefined) {
      updateData.quantity = quantity;
      // Recalculer le total de la ligne
      const { data: item } = await supabase
        .from('supplier_order_items')
        .select('unit_price')
        .eq('id', itemId)
        .single();
      
      if (item) {
        updateData.line_total = (unit_price || item.unit_price) * quantity;
      }
    }
    
    if (unit_price !== undefined) {
      updateData.unit_price = unit_price;
      // Recalculer le total de la ligne
      const { data: item } = await supabase
        .from('supplier_order_items')
        .select('quantity')
        .eq('id', itemId)
        .single();
      
      if (item) {
        updateData.line_total = unit_price * (quantity || item.quantity);
      }
    }

    const { data: updatedItem, error } = await supabase
      .from('supplier_order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mettre à jour les totaux de la commande si nécessaire
    if (quantity !== undefined || unit_price !== undefined) {
      await updateOrderTotals(orderId, shopId);
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const shopId = searchParams.get('shopId');
    const { orderId } = await params;

    if (!shopId || !orderId || !itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('supplier_order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mettre à jour les totaux de la commande
    await updateOrderTotals(orderId, shopId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

async function updateOrderTotals(orderId: string, shopId: string) {
  // Calculer le sous-total
  const { data: items } = await supabase
    .from('supplier_order_items')
    .select('line_total')
    .eq('order_id', orderId);

  const subtotal = items?.reduce((sum, item) => sum + (item.line_total || 0), 0) || 0;

  // Récupérer la balance actuelle
  const { data: order } = await supabase
    .from('supplier_orders')
    .select('balance_adjustment')
    .eq('id', orderId)
    .single();

  const balanceAdjustment = order?.balance_adjustment || 0;
  const totalHt = subtotal + balanceAdjustment;
  const totalTtc = totalHt * 1.2;

  // Mettre à jour la commande
  await supabase
    .from('supplier_orders')
    .update({
      subtotal,
      total_ht: totalHt,
      total_ttc: totalTtc,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('shop_id', shopId);
}
