import { supabase } from '@/lib/supabase';

interface ProductVariant {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  inventory_quantity: number;
  unit_cost: string | null;
}

interface Product {
  id: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
  handle: string | null;
  status: string;
  variants: ProductVariant[];
  options: Array<{
    name: string;
    values: string[];
  }>;
  images: Array<{
    url: string;
    alt: string | null;
  }>;
  tags: string[];
}

export const productsService = {
  /**
   * Synchronise les produits avec Supabase
   */
  async syncProducts(products: Product[]): Promise<void> {
    const { error } = await supabase
      .from('products')
      .upsert(
        products.map(product => ({
          ...product,
          synced_at: new Date().toISOString(),
        })),
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Error syncing products:', error);
      throw error;
    }

    // Log de synchronisation
    await supabase
      .from('sync_logs')
      .insert({
        type: 'products',
        status: 'success',
        items_processed: products.length,
        items_succeeded: products.length,
        completed_at: new Date().toISOString(),
      });
  },

  /**
   * Récupère tous les produits
   */
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('title');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Récupère un produit par son ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data;
  },

  /**
   * Recherche des produits
   */
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .textSearch('title', query)
      .limit(20);

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Met à jour le stock d'un produit
   */
  async updateInventory(productId: string, variantId: string, quantity: number): Promise<void> {
    const { data: product } = await supabase
      .from('products')
      .select('variants')
      .eq('id', productId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    const updatedVariants = product.variants.map(variant => 
      variant.id === variantId 
        ? { ...variant, inventory_quantity: quantity }
        : variant
    );

    const { error } = await supabase
      .from('products')
      .update({ variants: updatedVariants })
      .eq('id', productId);

    if (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques des produits
   */
  async getProductStats(): Promise<{
    totalProducts: number;
    totalVariants: number;
    lowStock: number;
    outOfStock: number;
  }> {
    const { data: products, error } = await supabase
      .from('products')
      .select('variants');

    if (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }

    const stats = (products || []).reduce((acc, product) => {
      const variants = product.variants || [];
      acc.totalVariants += variants.length;
      
      variants.forEach(variant => {
        if (variant.inventory_quantity === 0) {
          acc.outOfStock++;
        } else if (variant.inventory_quantity < 5) {
          acc.lowStock++;
        }
      });

      return acc;
    }, {
      totalProducts: products?.length || 0,
      totalVariants: 0,
      lowStock: 0,
      outOfStock: 0,
    });

    return stats;
  }
};
