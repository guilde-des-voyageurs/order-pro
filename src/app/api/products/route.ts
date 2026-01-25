import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const locationId = searchParams.get('locationId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Récupérer les produits depuis Supabase (cache local)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        shopify_id,
        title,
        handle,
        image_url,
        status,
        synced_at,
        variants:product_variants(
          id,
          shopify_id,
          title,
          sku,
          option1,
          option2,
          option3,
          inventory_levels(
            quantity,
            location_id
          )
        )
      `)
      .eq('shop_id', shopId)
      .eq('status', 'active');

    if (productsError) {
      console.error('Error fetching products from Supabase:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Si pas de produits, retourner un tableau vide avec un flag indiquant qu'il faut synchroniser
    if (!productsData || productsData.length === 0) {
      return NextResponse.json({ 
        products: [], 
        needsSync: true,
        message: 'Aucun produit en cache. Veuillez synchroniser depuis Shopify.'
      });
    }

    // Transformer les données pour le frontend
    const products = productsData.map((product: any) => {
      const variants = product.variants.map((variant: any) => {
        // Trouver le niveau d'inventaire pour l'emplacement sélectionné
        let quantity = 0;
        if (locationId) {
          const level = variant.inventory_levels?.find(
            (l: any) => l.location_id === locationId
          );
          quantity = level?.quantity || 0;
        } else {
          // Additionner tous les emplacements
          quantity = variant.inventory_levels?.reduce(
            (sum: number, l: any) => sum + (l.quantity || 0), 0
          ) || 0;
        }

        // Déterminer la taille (option1 est généralement la taille)
        const size = variant.option1;

        return {
          id: `gid://shopify/ProductVariant/${variant.shopify_id}`,
          supabaseId: variant.id,
          title: variant.title,
          sku: variant.sku,
          quantity,
          size,
          options: [
            variant.option1 && { name: 'Option 1', value: variant.option1 },
            variant.option2 && { name: 'Option 2', value: variant.option2 },
            variant.option3 && { name: 'Option 3', value: variant.option3 },
          ].filter(Boolean),
        };
      });

      // Calculer le total
      const totalQuantity = variants.reduce((sum: number, v: any) => sum + v.quantity, 0);

      // Grouper par taille
      const sizeBreakdown: Record<string, number> = {};
      variants.forEach((v: any) => {
        if (v.size) {
          sizeBreakdown[v.size] = (sizeBreakdown[v.size] || 0) + v.quantity;
        }
      });

      return {
        id: `gid://shopify/Product/${product.shopify_id}`,
        supabaseId: product.id,
        title: product.title,
        handle: product.handle,
        status: product.status?.toUpperCase() || 'ACTIVE',
        image: product.image_url,
        imageAlt: product.title,
        totalQuantity,
        sizeBreakdown,
        variants,
        syncedAt: product.synced_at,
      };
    });

    return NextResponse.json({ products, needsSync: false });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
