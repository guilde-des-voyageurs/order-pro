import { supabase } from '@/lib/supabase';

export interface Variant {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  sku: string | null;
  quantity: number;
  price: string;
  textile_status: 'pending' | 'in_progress' | 'completed';
  billing_status: 'pending' | 'completed';
  checked_by?: string;
  checked_at?: string;
  textile_completed_by?: string;
  textile_completed_at?: string;
  billing_completed_by?: string;
  billing_completed_at?: string;
}

export const variantsService = {
  /**
   * Récupère tous les variants d'une commande
   */
  async getOrderVariants(orderId: string): Promise<Variant[]> {
    const { data, error } = await supabase
      .from('variants')
      .select('*')
      .eq('order_id', orderId)
      .order('title');

    if (error) {
      console.error('Error fetching variants:', error);
      throw error;
    }

    return data;
  },

  /**
   * Met à jour le statut textile d'un variant
   */
  async updateTextileStatus(
    variantId: string,
    status: Variant['textile_status'],
    userId: string
  ): Promise<void> {
    const updates: Partial<Variant> = {
      textile_status: status,
    };

    if (status === 'completed') {
      updates.textile_completed_by = userId;
      updates.textile_completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('variants')
      .update(updates)
      .eq('id', variantId);

    if (error) {
      console.error('Error updating textile status:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut de facturation d'un variant
   */
  async updateBillingStatus(
    variantId: string,
    status: Variant['billing_status'],
    userId: string
  ): Promise<void> {
    const updates: Partial<Variant> = {
      billing_status: status,
    };

    if (status === 'completed') {
      updates.billing_completed_by = userId;
      updates.billing_completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('variants')
      .update(updates)
      .eq('id', variantId);

    if (error) {
      console.error('Error updating billing status:', error);
      throw error;
    }
  },

  /**
   * Marque un variant comme vérifié
   */
  async checkVariant(variantId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('variants')
      .update({
        checked_by: userId,
        checked_at: new Date().toISOString(),
      })
      .eq('id', variantId);

    if (error) {
      console.error('Error checking variant:', error);
      throw error;
    }
  },

  /**
   * Démarque un variant comme vérifié
   */
  async uncheckVariant(variantId: string): Promise<void> {
    const { error } = await supabase
      .from('variants')
      .update({
        checked_by: null,
        checked_at: null,
      })
      .eq('id', variantId);

    if (error) {
      console.error('Error unchecking variant:', error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques des variants
   */
  async getVariantsStats(orderId: string): Promise<{
    total: number;
    checked: number;
    textileCompleted: number;
    billingCompleted: number;
  }> {
    const { data: variants, error } = await supabase
      .from('variants')
      .select('checked_by, textile_status, billing_status')
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching variants stats:', error);
      throw error;
    }

    return variants.reduce((acc, variant) => ({
      total: acc.total + 1,
      checked: acc.checked + (variant.checked_by ? 1 : 0),
      textileCompleted: acc.textileCompleted + (variant.textile_status === 'completed' ? 1 : 0),
      billingCompleted: acc.billingCompleted + (variant.billing_status === 'completed' ? 1 : 0),
    }), {
      total: 0,
      checked: 0,
      textileCompleted: 0,
      billingCompleted: 0,
    });
  }
};
