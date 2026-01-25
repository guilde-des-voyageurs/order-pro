import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, color_name, hex_value } = body;

    if (!shopId || !color_name || !hex_value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('color_rules')
      .insert({
        shop_id: shopId,
        color_name: color_name.toLowerCase().trim(),
        hex_value,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating color rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating color rule:', error);
    return NextResponse.json({ error: 'Failed to create color rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopId, color_name, hex_value } = body;

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('color_rules')
      .update({
        color_name: color_name.toLowerCase().trim(),
        hex_value,
      })
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error updating color rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating color rule:', error);
    return NextResponse.json({ error: 'Failed to update color rule' }, { status: 500 });
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
      .from('color_rules')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error deleting color rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting color rule:', error);
    return NextResponse.json({ error: 'Failed to delete color rule' }, { status: 500 });
  }
}
