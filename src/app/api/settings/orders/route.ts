import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer les paramètres de commandes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('order_settings')
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retourner les paramètres par défaut si non trouvés
    return NextResponse.json({
      settings: data || {
        printer_notes: [],
        sync_location_ids: [],
        handling_fee: 0,
      }
    });

  } catch (error) {
    console.error('Error fetching order settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Mettre à jour les paramètres de commandes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, printerNotes, syncLocationIds, handlingFee } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    const updateData: any = {
      shop_id: shopId,
      updated_at: new Date().toISOString(),
    };

    if (printerNotes !== undefined) {
      updateData.printer_notes = printerNotes;
    }

    if (syncLocationIds !== undefined) {
      updateData.sync_location_ids = syncLocationIds;
    }

    if (handlingFee !== undefined) {
      updateData.handling_fee = handlingFee;
    }

    const { data, error } = await supabase
      .from('order_settings')
      .upsert(updateData, { onConflict: 'shop_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });

  } catch (error) {
    console.error('Error updating order settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
