'use client';

import { FinancialStatus } from '@/components/FinancialStatus';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { generateVariantId } from '@/utils/variant-helpers';
import type { ShopifyOrder } from '@/types/shopify';
import styles from './OrderDrawer.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface OrderDrawerContentProps {
  order: ShopifyOrder;
}

export function OrderDrawerContent({ order }: OrderDrawerContentProps) {
  const encodedOrderId = encodeFirestoreId(order.id);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
        <h3 className={styles.drawer_title}>{order.name}</h3>
        <FinancialStatus status={order.displayFinancialStatus} />
      </div>

      <div>
        <span style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>Textile commandé</span>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <TextileProgress orderId={encodedOrderId} />
        </div>
      </div>

      <div>
        <span style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>Total à facturer</span>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 500 }}>
            {order.lineItems?.reduce((total, item) => 
              total + (item.isCancelled ? 0 : (item.unitCost * item.quantity)),
              0
            ) ?? 0} {order.totalPriceCurrency}
          </span>
          <InvoiceCheckbox orderId={encodedOrderId} />
        </div>
      </div>

      <div>
        <span style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>Produits</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          {order.lineItems?.map((item) => (
            <div key={item.id} className={`${styles.product_item} ${item.isCancelled ? styles.cancelled : ''}`}>
              {item.image && (
                <img
                  src={item.image.url}
                  alt={item.image.altText || item.title}
                  width={60}
                  height={60}
                  style={{ objectFit: 'contain' }}
                />
              )}
              <div className={styles.product_info}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                      Coût unitaire: {item.unitCost} {order.totalPriceCurrency}
                    </span>
                    {item.variantTitle && (
                      <span style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                        {item.variantTitle}
                      </span>
                    )}
                    {item.sku && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--mantine-color-dimmed)' }}>
                        SKU: {item.sku}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {!item.isCancelled && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {Array.from({ length: item.quantity }).map((_, index) => {
                          const color = item.variantTitle?.split(' / ')[0] || '';
                          const size = item.variantTitle?.split(' / ')[1] || '';
                          const variantId = generateVariantId(encodedOrderId, item.sku || '', color, size, index);
                          return (
                            <VariantCheckbox
                              key={variantId}
                              sku={item.sku || ''}
                              color={color}
                              size={size}
                              quantity={1}
                              orderId={encodedOrderId}
                              productIndex={index}
                              variantId={variantId}
                            />
                          );
                        })}
                      </div>
                    )}
                    <span style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                      × {item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
