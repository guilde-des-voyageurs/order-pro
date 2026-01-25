import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, colors } = body;

    if (!shopId || !colors || !Array.isArray(colors)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Préparer les données pour l'insertion
    const colorRules = colors.map((c: { color_name: string; hex_value: string }) => ({
      shop_id: shopId,
      color_name: c.color_name.toLowerCase().trim(),
      hex_value: c.hex_value,
    }));

    // Insérer en batch avec upsert pour éviter les doublons
    const { error } = await supabase
      .from('color_rules')
      .upsert(colorRules, { onConflict: 'shop_id,color_name' });

    if (error) {
      console.error('Error initializing color rules:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: colorRules.length });
  } catch (error) {
    console.error('Error initializing color rules:', error);
    return NextResponse.json({ error: 'Failed to initialize color rules' }, { status: 500 });
  }
}
