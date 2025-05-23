import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface VariantKey {
  sku: string;
  color: string;
  size: string;
}

export function useCheckedVariants({ sku, color, size }: VariantKey) {
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    // Écouter la collection variants-ordered-v2 pour cette variante spécifique
    const variantsRef = collection(db, 'variants-ordered-v2');
    const variantQuery = query(
      variantsRef,
      where('sku', '==', sku),
      where('color', '==', color || 'no-color'),
      where('size', '==', size || 'no-size'),
      where('checked', '==', true)
    );
    
    const unsubscribe = onSnapshot(variantQuery, (snapshot) => {
      setCheckedCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [sku, color, size]);

  return checkedCount;
}
