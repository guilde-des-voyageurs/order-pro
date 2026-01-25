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

    // Récupérer les règles de prix pour calculer les prix unitaires
    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('priority');

    // Fonction pour calculer le prix unitaire
    const calculateUnitPrice = (item: any) => {
      let price = 0;
      
      // Chercher le prix de base
      const baseRule = pricingRules?.find(r => r.rule_type === 'base_price');
      if (baseRule) {
        price = baseRule.price_value;
      }

      // Appliquer les majorations
      pricingRules?.forEach(rule => {
        if (rule.rule_type === 'base_price') return;
        
        let matches = false;
        
        if (rule.rule_type === 'sku_markup' && rule.condition_value) {
          matches = item.sku?.toUpperCase().startsWith(rule.condition_value.toUpperCase());
        }
        
        if (matches) {
          if (rule.is_percentage) {
            price += price * (rule.price_value / 100);
          } else {
            price += rule.price_value;
          }
        }
      });

      return price;
    };

    // Préparer les articles à insérer
    const itemsToInsert = items.map((item: any) => {
      const unitPrice = calculateUnitPrice(item);
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
    const { shopId, itemId, is_validated, quantity, unit_price } = body;
    const { orderId } = await params;

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
