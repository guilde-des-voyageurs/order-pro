/**
 * Script pour nettoyer les anciennes variantes d'une commande
 * Utilise le nouveau format d'IDs de variantes
 */

import { db } from '@/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

/**
 * Nettoie les anciennes variantes d'une commande spécifique
 * @param orderId - L'ID encodé de la commande (ex: "6178076459275")
 */
export async function cleanOldVariants(orderId: string) {
  console.log(`🧹 Nettoyage des anciennes variantes pour la commande ${orderId}...`);
  
  try {
    // 1. Récupérer toutes les variantes de cette commande
    const variantsRef = collection(db, 'variants-ordered-v2');
    const q = query(variantsRef, where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    
    console.log(`📦 ${snapshot.size} variantes trouvées`);
    
    // 2. Supprimer toutes les variantes
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ ${snapshot.size} variantes supprimées`);
    
    // 3. Réinitialiser le compteur dans textile-progress-v2
    const progressRef = doc(db, 'textile-progress-v2', orderId);
    await updateDoc(progressRef, {
      checkedCount: 0
    });
    
    console.log(`✅ Compteur réinitialisé à 0`);
    console.log(`🎉 Nettoyage terminé !`);
    
    return {
      success: true,
      deletedCount: snapshot.size
    };
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage:`, error);
    throw error;
  }
}

/**
 * Nettoie les anciennes variantes de plusieurs commandes
 * @param orderIds - Array d'IDs encodés de commandes
 */
export async function cleanMultipleOrders(orderIds: string[]) {
  console.log(`🧹 Nettoyage de ${orderIds.length} commandes...`);
  
  const results = [];
  
  for (const orderId of orderIds) {
    try {
      const result = await cleanOldVariants(orderId);
      results.push({ orderId, ...result });
    } catch (error) {
      results.push({ orderId, success: false, error });
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`✅ Réussies: ${results.filter(r => r.success).length}`);
  console.log(`❌ Échouées: ${results.filter(r => !r.success).length}`);
  
  return results;
}

// Exemple d'utilisation
// cleanOldVariants('6178076459275');
