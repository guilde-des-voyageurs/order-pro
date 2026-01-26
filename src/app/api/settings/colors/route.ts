import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, reception_name, display_name, hex_value } = body;

    if (!shopId || !reception_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Essayer d'abord avec le nouveau schéma (reception_name)
    let result = await supabase
      .from('color_rules')
      .insert({
        shop_id: shopId,
        reception_name: reception_name.trim(),
        display_name: display_name?.trim() || null,
        hex_value: hex_value || '#808080',
      })
      .select()
      .single();

    // Si erreur (colonne n'existe pas), essayer avec l'ancien schéma (color_name)
    if (result.error && result.error.code === '42703') {
      console.log('Fallback to old schema (color_name)');
      result = await supabase
        .from('color_rules')
        .insert({
          shop_id: shopId,
          color_name: reception_name.trim(),
          hex_value: display_name?.trim() || hex_value || '#808080',
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error creating color rule:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating color rule:', error);
    return NextResponse.json({ error: 'Failed to create color rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopId, reception_name, display_name, hex_value } = body;

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = {};
    if (reception_name !== undefined) updateData.reception_name = reception_name.trim();
    if (display_name !== undefined) updateData.display_name = display_name?.trim() || null;
    if (hex_value !== undefined) updateData.hex_value = hex_value;

    const { data, error } = await supabase
      .from('color_rules')
      .update(updateData)
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
