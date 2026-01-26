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

    // Récupérer les règles de couleurs
    const { data: colorRules, error: colorError } = await supabase
      .from('color_rules')
      .select('*')
      .eq('shop_id', shopId);

    if (colorError) {
      console.error('Error fetching color rules:', colorError);
    }

    // Normaliser les données pour supporter les deux schémas
    const normalizedRules = (colorRules || []).map((rule: any) => ({
      id: rule.id,
      reception_name: rule.reception_name || rule.color_name,
      display_name: rule.display_name || null,
      hex_value: rule.hex_value,
    }));

    return NextResponse.json({
      colorRules: normalizedRules,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
