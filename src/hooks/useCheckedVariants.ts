import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { generateVariantId } from '@/utils/variant-helpers';

interface UseCheckedVariantsProps {
  orderId: string;
  sku?: string;
  color: string;
  size: string;
  quantity: number;
  productIndex: number;
  lineItems: Array<{
    sku?: string;
    variantTitle?: string;
    quantity: number;
    variant?: {
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
    };
  }>;
}

export function useCheckedVariants({ orderId, sku = '', color, size, quantity, productIndex, lineItems }: UseCheckedVariantsProps) {
  const [checkedCount, setCheckedCount] = useState(0);
  const checkedVariantsRef = useRef(new Set<string>());

  useEffect(() => {
    console.log('useCheckedVariants effect running for:', { orderId, sku, color, size, productIndex });
    
    // Vérifier que l'orderId est valide
    if (!orderId) {
      console.log('No orderId, setting count to 0');
      setCheckedCount(0);
      return;
    }

    // Générer les IDs pour tous les variants de cette combinaison
    const variantIds = Array.from({ length: quantity }).map((_, quantityIndex) => {
      return generateVariantId(
        orderId,  // orderId est déjà encodé
        sku,
        color,
        size,
        productIndex,
        quantityIndex
      );
    });

    console.log('Generated variant IDs:', variantIds);

    const unsubscribes = variantIds.map(variantId => {
      const variantRef = doc(db, 'variants-ordered-v2', variantId);
      
      return onSnapshot(variantRef, (snapshot) => {
        console.log('Snapshot for variant:', variantId, snapshot.exists(), snapshot.data());
        
        if (snapshot.exists()) {
          const isChecked = snapshot.data()?.checked || false;
          console.log('Variant state:', { variantId, isChecked });
          
          if (isChecked) {
            checkedVariantsRef.current.add(variantId);
          } else {
            checkedVariantsRef.current.delete(variantId);
          }
          
          console.log('Updated checked variants:', { count: checkedVariantsRef.current.size, variants: Array.from(checkedVariantsRef.current) });
          setCheckedCount(checkedVariantsRef.current.size);
        }
      });
    });
    
    return () => {
      console.log('Cleanup running for:', { orderId, sku, color, size, productIndex });
      unsubscribes.forEach(unsubscribe => unsubscribe());
      checkedVariantsRef.current.clear();
      setCheckedCount(0);
    };
  }, [orderId, sku, color, size, productIndex]);

  console.log('Current checked count:', checkedCount);
  return checkedCount;
}
