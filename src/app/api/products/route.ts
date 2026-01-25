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

    // Utiliser l'API REST pour les produits (moins coûteux que GraphQL pour cette opération)
    const productsResponse = await fetch(
      `https://${shop.shopify_url}/admin/api/2024-01/products.json?status=active&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': shop.shopify_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsResponse.ok) {
      console.error('Shopify Products API error:', await productsResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch products from Shopify' },
        { status: 500 }
      );
    }

    const productsData = await productsResponse.json();

    // Récupérer les niveaux d'inventaire pour l'emplacement spécifié
    let inventoryLevels: Record<string, number> = {};
    
    if (locationId) {
      // Collecter tous les inventory_item_ids
      const inventoryItemIds: number[] = [];
      for (const product of productsData.products) {
        for (const variant of product.variants) {
          if (variant.inventory_item_id) {
            inventoryItemIds.push(variant.inventory_item_id);
          }
        }
      }

      // Récupérer les niveaux d'inventaire par lots de 50
      for (let i = 0; i < inventoryItemIds.length; i += 50) {
        const batch = inventoryItemIds.slice(i, i + 50);
        const inventoryResponse = await fetch(
          `https://${shop.shopify_url}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${batch.join(',')}&location_ids=${locationId}`,
          {
            headers: {
              'X-Shopify-Access-Token': shop.shopify_token,
              'Content-Type': 'application/json',
            },
          }
        );

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          for (const level of inventoryData.inventory_levels) {
            inventoryLevels[level.inventory_item_id] = level.available || 0;
          }
        }
      }
    }

    // Transformer les données REST en format attendu
    const products = productsData.products.map((product: any) => {
      // Calculer l'inventaire par variante
      const variants = product.variants.map((variant: any) => {
        // Utiliser l'inventaire de l'emplacement si disponible, sinon utiliser inventory_quantity
        const quantity = locationId 
          ? (inventoryLevels[variant.inventory_item_id] ?? 0)
          : (variant.inventory_quantity ?? 0);

        // Extraire la taille des options
        const sizeOptionIndex = product.options?.findIndex(
          (opt: any) => opt.name.toLowerCase() === 'taille' || opt.name.toLowerCase() === 'size'
        );
        const size = sizeOptionIndex !== undefined && sizeOptionIndex >= 0 
          ? variant[`option${sizeOptionIndex + 1}`] 
          : null;

        return {
          id: `gid://shopify/ProductVariant/${variant.id}`,
          title: variant.title,
          sku: variant.sku,
          quantity,
          size,
          options: product.options?.map((opt: any, idx: number) => ({
            name: opt.name,
            value: variant[`option${idx + 1}`],
          })) || [],
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
        id: `gid://shopify/Product/${product.id}`,
        title: product.title,
        handle: product.handle,
        status: product.status?.toUpperCase() || 'ACTIVE',
        image: product.image?.src || product.images?.[0]?.src || null,
        imageAlt: product.image?.alt || product.title,
        totalQuantity,
        sizeBreakdown,
        variants,
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
