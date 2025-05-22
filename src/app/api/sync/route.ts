import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { fetchOrdersApiAction } from '@/actions/fetch-orders-api-action';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

export async function POST() {
  try {
    const syncRef = await addDoc(collection(db, 'syncs'), {
      startedAt: serverTimestamp(),
      status: 'running'
    });

    // Récupérer les commandes depuis Shopify via l'API GraphQL
    const orders = await fetchOrdersApiAction();

    // Sauvegarder les commandes dans Firestore
    for (const order of orders) {
      console.log('\n💾 Données avant sauvegarde dans Firebase:', JSON.stringify({
        order,
        tags: order.tags
      }, null, 2));

      const orderId = encodeFirestoreId(order.id);
      const orderData = {
        ...order,
        synced_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'orders-v2', orderId), orderData);
    }

    // Mettre à jour le statut de la synchronisation
    await updateDoc(doc(db, 'syncs', syncRef.id), {
      status: 'completed',
      completedAt: serverTimestamp(),
      ordersCount: orders.length
    });

    return NextResponse.json({ success: true, ordersCount: orders.length });
  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: 'Failed to sync orders' },
      { status: 500 }
    );
  }
}
