import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';

/**
 * Hook pour gérer la rétrocompatibilité des IDs de variantes
 * Vérifie si un ancien ID existe dans Firebase (avec le simple split)
 * et l'utilise si c'est le cas, sinon utilise le nouvel ID
 */
export function useLegacyVariantId(
  orderId: string,
  sku: string,
  correctColor: string,
  correctSize: string,
  productIndex: number,
  quantityIndex: number,
  variantTitle?: string
): string {
  const [finalVariantId, setFinalVariantId] = useState<string>('');

  // Nouvel ID (correct)
  const newId = `${orderId}--${sku}--${correctColor}--${correctSize}--${productIndex}--${quantityIndex}`;

  useEffect(() => {
    const checkLegacyId = async () => {
      // Si pas de variantTitle, utiliser le nouvel ID
      if (!variantTitle) {
        setFinalVariantId(newId);
        return;
      }

      // Générer l'ancien ID (avec simple split)
      const parts = variantTitle.split(' / ');
      const legacyColor = parts[0] || '';
      const legacySize = parts[1] || '';
      const legacyId = `${orderId}--${sku}--${legacyColor}--${legacySize}--${productIndex}--${quantityIndex}`;

      // Si l'ancien ID est identique au nouveau, pas besoin de vérifier
      if (legacyId === newId) {
        setFinalVariantId(newId);
        return;
      }

      // Vérifier si l'ancien ID existe dans Firebase
      try {
        const legacyDocRef = doc(db, 'variants-ordered-v2', legacyId);
        const legacyDoc = await getDoc(legacyDocRef);

        if (legacyDoc.exists()) {
          // L'ancien ID existe, l'utiliser pour la rétrocompatibilité
          setFinalVariantId(legacyId);
        } else {
          // L'ancien ID n'existe pas, utiliser le nouveau
          setFinalVariantId(newId);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'ancien ID:', error);
        // En cas d'erreur, utiliser le nouvel ID
        setFinalVariantId(newId);
      }
    };

    checkLegacyId();
  }, [orderId, sku, correctColor, correctSize, productIndex, quantityIndex, variantTitle, newId]);

  return finalVariantId || newId;
}
