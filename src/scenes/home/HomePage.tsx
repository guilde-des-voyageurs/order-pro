'use client';

import styles from './HomePage.module.scss';
import { clsx } from 'clsx';
import { OrderDetailsSection } from '@/scenes/home/OrderDetailsSection';
import { Badge } from '@/components/Badge';
import { Text, Title, Tooltip } from '@mantine/core';
import { useHomePagePresenter } from '@/scenes/home/HomePage.presenter';
import { OrderStatus } from '@/components/OrderStatus';
import { BillingStatus } from '@/components/BillingStatus';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { encodeFirestoreId } from '@/utils/firestore-helpers';

export const HomePage = () => {
  const {
    openOrders,
    closedOrders,
    selected,
    setSelected,
    openOrderQuantityPerTypeStr,
    isLoading
  } = useHomePagePresenter();

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No user logged in');
      return;
    }

    if (isLoading) {
      console.log('Data still loading...');
      return;
    }

    // Initialiser le totalCount pour toutes les commandes
    const initializeOrderProgress = async () => {
      const allOrders = [...openOrders, ...closedOrders];
      console.log('All orders:', allOrders);
      console.log('First order example:', allOrders[0]);
      console.log('Initializing progress for', allOrders.length, 'orders');
      
      for (const order of allOrders) {
        console.log('Processing order:', {
          id: order.id,
          name: order.name,
          products: order.products,
          lineItems: order.lineItems,
          fulfillmentOrders: order.fulfillmentOrders
        });

        // Vérifier si on a des line items
        const lineItems = order.lineItems?.nodes || [];
        const total = lineItems.reduce((acc, item) => acc + (item.totalQuantity || 0), 0);
        
        console.log('Order', order.id, 'has', total, 'items from lineItems');
        
        if (total === 0) {
          console.log('Skipping order', order.id, 'with no items');
          continue;
        }

        const encodedOrderId = encodeFirestoreId(order.id);
        const orderRef = doc(db, 'orders-progress', encodedOrderId);
        
        try {
          await setDoc(orderRef, {
            totalCount: total,
            userId: auth.currentUser!.uid,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          console.log('Successfully initialized order', order.id);
        } catch (error) {
          console.error('Error initializing order', order.id, error);
        }
      }
    };

    initializeOrderProgress().catch(console.error);
  }, [openOrders, closedOrders, isLoading]);

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Commandes</Title>
        <Text size="sm" color="dimmed" mt="xs">
          Commandes depuis le 16 janvier 2025
        </Text>
        <section className={styles.section}>
          <Badge variant={'orange'}>En cours ({openOrders.length})</Badge>
          <Text className={styles.section_subtitle}>
            <b>Total</b> : {openOrderQuantityPerTypeStr}
          </Text>
          <div className={styles.row_headers}>
            <Text className={styles.row_id}>Commande</Text>
            <Text className={styles.row_date}>Date</Text>
            <Text className={styles.row_quantity}>Quantité</Text>
            <Text className={styles.row_status}>Textile</Text>
            <Text className={styles.row_status}>Facturé</Text>
          </div>
          <div className={styles.rows}>
            {openOrders.map((order) => (
              <div
                key={order.id}
                className={clsx(
                  styles.row,
                  selected === order.id && styles.row_active,
                )}
                onClick={() => setSelected(order.id)}
              >
                <Text className={styles.row_id}>
                  {order.name}
                  {order.displayFinancialStatus === 'PENDING' && (
                    <Tooltip label="En attente de paiement">
                      <IconAlertTriangle 
                        size={16} 
                        style={{ marginLeft: 8, color: '#fd7e14' }} 
                      />
                    </Tooltip>
                  )}
                </Text>
                <Text className={styles.row_date}>
                  {order.createdAtFormatted}
                </Text>
                <Text className={styles.row_quantity}>
                  {order.quantity} article(s) à la demande
                </Text>
                <div className={styles.row_status}>
                  <OrderStatus orderId={order.id} className={styles.checkbox} />
                </div>
                <div className={styles.row_status}>
                  <BillingStatus orderId={order.id} className={styles.checkbox} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <Badge variant={'green'}>Expédiées ({closedOrders.length})</Badge>
          <div className={styles.row_headers}>
            <Text className={styles.row_id}>Commande</Text>
            <Text className={styles.row_date}>Date</Text>
            <Text className={styles.row_quantity}>Quantité</Text>
            <Text className={styles.row_status}>Textile</Text>
            <Text className={styles.row_status}>Facturé</Text>
          </div>
          <div className={styles.rows}>
            {closedOrders.map((order) => (
              <div
                key={order.id}
                className={clsx(
                  styles.row,
                  selected === order.id && styles.row_active,
                )}
                onClick={() => setSelected(order.id)}
              >
                <Text className={styles.row_id}>
                  {order.name}
                  {order.displayFinancialStatus === 'PENDING' && (
                    <Tooltip label="En attente de paiement">
                      <IconAlertTriangle 
                        size={16} 
                        style={{ marginLeft: 8, color: '#fd7e14' }} 
                      />
                    </Tooltip>
                  )}
                </Text>
                <Text className={styles.row_date}>
                  {order.createdAtFormatted}
                </Text>
                <Text className={styles.row_quantity}>
                  {order.quantity} article(s) à la demande
                </Text>
                <div className={styles.row_status}>
                  <OrderStatus orderId={order.id} className={styles.checkbox} />
                </div>
                <div className={styles.row_status}>
                  <BillingStatus orderId={order.id} className={styles.checkbox} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <OrderDetailsSection
        selected={selected}
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
      />
    </div>
  );
};
