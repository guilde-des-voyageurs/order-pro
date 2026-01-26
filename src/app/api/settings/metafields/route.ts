import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer les configurations de métachamps
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('metafield_config')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      console.error('Error fetching metafield config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ metafields: data || [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch metafield config' }, { status: 500 });
  }
}

// POST - Créer une configuration de métachamp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, namespace, key, displayName } = body;

    if (!shopId || !namespace || !key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vérifier si le métachamp existe déjà
    const { data: existing } = await supabase
      .from('metafield_config')
      .select('id')
      .eq('shop_id', shopId)
      .eq('namespace', namespace)
      .eq('key', key)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Ce métachamp existe déjà' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('metafield_config')
      .insert({
        shop_id: shopId,
        namespace,
        key,
        display_name: displayName || `${namespace}.${key}`,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating metafield config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ metafield: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create metafield config' }, { status: 500 });
  }
}

// PUT - Mettre à jour une configuration de métachamp
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopId, namespace, key, displayName, isActive } = body;

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = {};
    if (namespace !== undefined) updateData.namespace = namespace;
    if (key !== undefined) updateData.key = key;
    if (displayName !== undefined) updateData.display_name = displayName;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('metafield_config')
      .update(updateData)
      .eq('id', id)
      .eq('shop_id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error updating metafield config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ metafield: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update metafield config' }, { status: 500 });
  }
}

// DELETE - Supprimer une configuration de métachamp
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const shopId = searchParams.get('shopId');

    if (!id || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('metafield_config')
      .delete()
      .eq('id', id)
      .eq('shop_id', shopId);

    if (error) {
      console.error('Error deleting metafield config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete metafield config' }, { status: 500 });
  }
}
