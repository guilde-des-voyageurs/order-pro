import { NextRequest, NextResponse } from 'next/server';

// Redirige vers Shopify pour l'autorisation OAuth
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  // Credentials de l'app Ivy depuis le Dev Dashboard
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/shopify/callback`;
  const scopes = 'read_orders,read_products,read_inventory,read_locations';

  if (!clientId) {
    return NextResponse.json({ error: 'Missing SHOPIFY_CLIENT_ID in env' }, { status: 500 });
  }

  // Construire l'URL d'autorisation Shopify
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
