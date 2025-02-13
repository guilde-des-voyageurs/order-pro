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

export const HomePage = () => {
  const {
    openOrders,
    closedOrders,
    selected,
    setSelected,
    openOrderQuantityPerTypeStr,
  } = useHomePagePresenter();

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
