import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, metafield_key, display_name, is_active, display_order } = body;

    if (!shopId || !metafield_key) {
      return NextResponse.json({ error: 'Shop ID and metafield_key required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('metafield_display_rules')
      .insert({
        shop_id: shopId,
        metafield_key,
        display_name: display_name || null,
        is_active: is_active ?? true,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating metafield rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error('Error creating metafield rule:', error);
    return NextResponse.json({ error: 'Failed to create metafield rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopId, metafield_key, display_name, is_active, display_order } = body;

    if (!id || !shopId) {
      return NextResponse.json({ error: 'ID and Shop ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('metafield_display_rules')
      .update({
        metafield_key,
        display_name: display_name || null,
        is_active,
        display_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error updating metafield rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error('Error updating metafield rule:', error);
    return NextResponse.json({ error: 'Failed to update metafield rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const shopId = searchParams.get('shopId');

    if (!id || !shopId) {
      return NextResponse.json({ error: 'ID and Shop ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('metafield_display_rules')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error deleting metafield rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting metafield rule:', error);
    return NextResponse.json({ error: 'Failed to delete metafield rule' }, { status: 500 });
  }
}
