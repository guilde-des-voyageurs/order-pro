import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

export async function POST() {
  try {
    const ordersRef = collection(db, 'orders');
    const syncRef = await addDoc(collection(db, 'syncs'), {
      startedAt: serverTimestamp(),
      status: 'running'
    });

    // Récupérer les commandes depuis Shopify
    const shopifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SHOPIFY_API_URL}/admin/api/2024-01/orders.json`, {
      headers: {
        'X-Shopify-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN || '',
        'Content-Type': 'application/json',
      },
    });

    if (!shopifyResponse.ok) {
      const error = await shopifyResponse.text();
      throw new Error(`Shopify API error: ${error}`);
    }

    const { orders } = await shopifyResponse.json();

    // Préparer les commandes pour Firestore
    const formattedOrders = orders.map((order: any) => ({
      id: order.id.toString(),
      name: order.name,
      created_at: order.created_at,
      closed_at: order.closed_at,
      cancelled_at: order.cancelled_at,
      display_fulfillment_status: order.fulfillment_status || 'unfulfilled',
      display_financial_status: order.financial_status,
      note: order.note,
      total_price: order.total_price,
      total_price_currency: order.currency,
      customer: order.customer ? {
        first_name: order.customer.first_name,
        last_name: order.customer.last_name,
        email: order.customer.email,
      } : null,
      shipping_address: order.shipping_address ? {
        address1: order.shipping_address.address1,
        address2: order.shipping_address.address2,
        city: order.shipping_address.city,
        zip: order.shipping_address.zip,
        country: order.shipping_address.country,
      } : null,
      line_items: order.line_items?.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        quantity: item.quantity,
        refundable_quantity: item.refundable_quantity,
        price: item.price,
        sku: item.sku,
        variant_title: item.variant_title,
        vendor: item.vendor,
        product_id: item.product_id.toString(),
        requires_shipping: item.requires_shipping,
        taxable: item.taxable,
        image: item.image?.src,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        is_cancelled: item.is_cancelled,
      })),
    }));

    // Sauvegarder les commandes dans Firestore
    for (const order of formattedOrders) {
      await addDoc(ordersRef, order);
    }

    // Mettre à jour le statut de la synchronisation
    await updateDoc(doc(db, 'syncs', syncRef.id), {
      status: 'completed',
      completedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: 'Failed to sync orders' },
      { status: 500 }
    );
  }
}
