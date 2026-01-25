import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Récupérer les informations de la boutique
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('shopify_url, shopify_token')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Récupérer les emplacements depuis Shopify
    const response = await fetch(
      `https://${shop.shopify_url}/admin/api/2024-01/locations.json`,
      {
        headers: {
          'X-Shopify-Access-Token': shop.shopify_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Shopify API error:', await response.text());
      return NextResponse.json(
        { error: 'Failed to fetch locations from Shopify' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Transformer les données
    const locations = data.locations.map((location: any) => ({
      id: location.id.toString(),
      name: location.name,
      address1: location.address1,
      city: location.city,
      country: location.country,
      active: location.active,
    }));

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
