import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer le statut de facturation d'un mois
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const monthKey = searchParams.get('monthKey');

    if (!shopId || !monthKey) {
      return NextResponse.json({ error: 'Missing shopId or monthKey' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('monthly_billing_status')
      .select('*')
      .eq('shop_id', shopId)
      .eq('month_key', monthKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: data || {
        is_invoiced: false,
        is_paid: false,
      }
    });

  } catch (error) {
    console.error('Error fetching monthly billing status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// PUT - Mettre à jour le statut de facturation d'un mois
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, monthKey, isInvoiced, isPaid } = body;

    if (!shopId || !monthKey) {
      return NextResponse.json({ error: 'Missing shopId or monthKey' }, { status: 400 });
    }

    const updateData: any = {
      shop_id: shopId,
      month_key: monthKey,
      updated_at: new Date().toISOString(),
    };

    if (isInvoiced !== undefined) {
      updateData.is_invoiced = isInvoiced;
      if (isInvoiced) {
        updateData.invoiced_at = new Date().toISOString();
      }
    }

    if (isPaid !== undefined) {
      updateData.is_paid = isPaid;
      if (isPaid) {
        updateData.paid_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('monthly_billing_status')
      .upsert(updateData, { onConflict: 'shop_id,month_key' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: data });

  } catch (error) {
    console.error('Error updating monthly billing status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
