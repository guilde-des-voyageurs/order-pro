'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { useAuth } from './AuthContext';
import type { Shop, UserShop } from '@/supabase/types';

interface ShopContextType {
  currentShop: Shop | null;
  shops: Shop[];
  userShops: UserShop[];
  loading: boolean;
  setCurrentShop: (shop: Shop) => void;
  refreshShops: () => Promise<void>;
  createShop: (shop: { name: string; shopify_url: string; shopify_token: string; shopify_location_id?: string }) => Promise<{ shop: Shop | null; error: Error | null }>;
  hasShops: boolean;
}

const ShopContext = createContext<ShopContextType>({
  currentShop: null,
  shops: [],
  userShops: [],
  loading: true,
  setCurrentShop: () => {},
  refreshShops: async () => {},
  createShop: async () => ({ shop: null, error: null }),
  hasShops: false,
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [userShops, setUserShops] = useState<UserShop[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshShops = useCallback(async () => {
    if (!user) {
      setShops([]);
      setUserShops([]);
      setCurrentShopState(null);
      setLoading(false);
      return;
    }

    try {
      // Récupérer les liaisons user_shops pour l'utilisateur
      const { data: userShopsData, error: userShopsError } = await supabase
        .from('user_shops')
        .select('*')
        .eq('user_id', user.id);

      if (userShopsError) throw userShopsError;

      setUserShops(userShopsData || []);

      if (!userShopsData || userShopsData.length === 0) {
        setShops([]);
        setCurrentShopState(null);
        setLoading(false);
        return;
      }

      // Récupérer les boutiques
      const shopIds = userShopsData.map(us => us.shop_id);
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .in('id', shopIds);

      if (shopsError) throw shopsError;

      setShops(shopsData || []);

      // Définir la boutique courante
      if (shopsData && shopsData.length > 0) {
        // Chercher la boutique par défaut
        const defaultUserShop = userShopsData.find(us => us.is_default);
        if (defaultUserShop) {
          const defaultShop = shopsData.find(s => s.id === defaultUserShop.shop_id);
          if (defaultShop) {
            setCurrentShopState(defaultShop);
          } else {
            setCurrentShopState(shopsData[0]);
          }
        } else {
          // Sinon prendre la première
          setCurrentShopState(shopsData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshShops();
  }, [refreshShops]);

  const setCurrentShop = useCallback(async (shop: Shop) => {
    setCurrentShopState(shop);
    
    // Mettre à jour la boutique par défaut dans la base
    if (user) {
      // D'abord, retirer is_default de toutes les boutiques de l'utilisateur
      await supabase
        .from('user_shops')
        .update({ is_default: false })
        .eq('user_id', user.id);
      
      // Puis définir la nouvelle boutique par défaut
      await supabase
        .from('user_shops')
        .update({ is_default: true })
        .eq('user_id', user.id)
        .eq('shop_id', shop.id);
    }
  }, [user]);

  const createShop = useCallback(async (shopData: { 
    name: string; 
    shopify_url: string; 
    shopify_token: string; 
    shopify_location_id?: string 
  }) => {
    if (!user) {
      return { shop: null, error: new Error('User not authenticated') };
    }

    try {
      // Créer la boutique
      const { data: newShop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: shopData.name,
          shopify_url: shopData.shopify_url,
          shopify_token: shopData.shopify_token,
          shopify_location_id: shopData.shopify_location_id || null,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // Créer la liaison user_shop avec le rôle owner
      const { error: userShopError } = await supabase
        .from('user_shops')
        .insert({
          user_id: user.id,
          shop_id: newShop.id,
          role: 'owner',
          is_default: shops.length === 0, // Par défaut si c'est la première boutique
        });

      if (userShopError) throw userShopError;

      // Rafraîchir la liste des boutiques
      await refreshShops();

      return { shop: newShop, error: null };
    } catch (error) {
      console.error('Error creating shop:', error);
      return { shop: null, error: error as Error };
    }
  }, [user, shops.length, refreshShops]);

  return (
    <ShopContext.Provider value={{ 
      currentShop, 
      shops, 
      userShops,
      loading, 
      setCurrentShop, 
      refreshShops,
      createShop,
      hasShops: shops.length > 0,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
