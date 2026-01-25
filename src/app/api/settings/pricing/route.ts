import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, rule_name, rule_type, condition_field, condition_value, price_value, is_percentage, priority, is_active } = body;

    if (!shopId || !rule_name || !rule_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        shop_id: shopId,
        rule_name,
        rule_type,
        condition_field,
        condition_value,
        price_value: price_value || 0,
        is_percentage: is_percentage || false,
        priority: priority || 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json({ error: 'Failed to create pricing rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopId, rule_name, rule_type, condition_field, condition_value, price_value, is_percentage, priority, is_active } = body;

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .update({
        rule_name,
        rule_type,
        condition_field,
        condition_value,
        price_value,
        is_percentage,
        priority,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json({ error: 'Failed to update pricing rule' }, { status: 500 });
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
      .from('pricing_rules')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error deleting pricing rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    return NextResponse.json({ error: 'Failed to delete pricing rule' }, { status: 500 });
  }
}
