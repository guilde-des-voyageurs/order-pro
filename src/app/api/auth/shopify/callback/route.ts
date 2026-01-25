import { NextRequest, NextResponse } from 'next/server';

// Callback OAuth - échange le code contre un access token
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop parameter' }, { status: 400 });
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing Shopify credentials in env' }, { status: 500 });
  }

  try {
    // Échanger le code contre un access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Afficher le token pour que l'utilisateur puisse le copier
    // En production, on sauvegarderait directement dans Supabase
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopify Token - Ivy</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
            .token-box { background: #f5f5f5; padding: 15px; border-radius: 8px; word-break: break-all; margin: 20px 0; }
            .success { color: #22c55e; }
            button { background: #000; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #333; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ Connexion réussie !</h1>
          <p>Boutique : <strong>${shop}</strong></p>
          <p>Voici ton Access Token Admin API :</p>
          <div class="token-box">
            <code id="token">${accessToken}</code>
          </div>
          <button onclick="navigator.clipboard.writeText('${accessToken}'); this.textContent='Copié !';">
            Copier le token
          </button>
          <p style="margin-top: 30px; color: #666;">
            Utilise ce token lors de l'onboarding d'Ivy pour connecter ta boutique.
          </p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
}
