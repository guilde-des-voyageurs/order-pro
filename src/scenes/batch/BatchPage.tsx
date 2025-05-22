'use client';

import { Title, Text, Loader, Paper, Stack, Container, Image, Modal, Group } from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { BatchPageProps } from './BatchPage.types'
import { useBatchPresenter } from './BatchPage.presenter'
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer'
import { TextileProgress } from '@/components/TextileProgress/TextileProgress'
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed'
import { FinancialStatus } from '@/components/FinancialStatus'
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox'
import { encodeFirestoreId } from '@/utils/firebase-helpers'
import styles from './BatchPage.module.scss'
import { useState } from 'react'
import type { ShopifyOrder } from '@/types/shopify'

interface OrderRowProps {
  order: ShopifyOrder
}

function OrderRow({ order }: OrderRowProps) {
  const clipboard = useClipboard()
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null)

  return (
    <Paper className={styles.orderRow} withBorder>
      <Stack gap="md">
        <div className={styles.orderInfo}>
          <div className={styles.orderHeader}>
            <div className={styles.orderTitle}>
              <Text fw={500}>{order.name}</Text>
              <FinancialStatus status={order.displayFinancialStatus} />
            </div>
            <div className={styles.orderWaiting}>
              <DaysElapsed 
                createdAt={order.createdAt} 
                isFulfilled={order.displayFulfillmentStatus === 'FULFILLED'} 
              />
              <TextileProgress orderId={encodeFirestoreId(order.id)} />
            </div>
          </div>

          <div className={styles.orderDetails}>
            <InvoiceCheckbox orderId={encodeFirestoreId(order.id)} readOnly />
          </div>
        </div>

        <div className={styles.orderItems}>
          <div className={styles.productList}>
            {order.lineItems?.map((item) => (
              <Paper 
                key={item.id} 
                className={styles.productItem}
                withBorder
                p="md"
              >
                <div className={styles.productContent}>
                  <div className={styles.productImageContainer}>
                    {item.image && (
                      <>
                        <Image
                          className={styles.productImage}
                          src={item.image.url}
                          alt={item.image.altText || item.title}
                          w={100}
                          h={100}
                          fit="contain"
                          style={{ cursor: 'pointer' }}
                          onClick={() => item.image && setSelectedImage({ 
                            url: item.image.url, 
                            alt: item.image.altText || item.title 
                          })}
                        />
                        <Modal 
                          opened={selectedImage?.url === item.image.url} 
                          onClose={() => setSelectedImage(null)}
                          size="auto"
                          padding="xs"
                          centered
                        >
                          <Image
                            src={item.image.url}
                            alt={item.image.altText || item.title}
                            fit="contain"
                            maw="90vw"
                            mah="90vh"
                          />
                        </Modal>
                      </>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <Text fw={500}>{item.title}</Text>
                    <Group gap="xs">
                      {item.sku && (
                        <Text size="sm" c="dimmed">
                          SKU: {item.sku}
                        </Text>
                      )}
                      <Text size="sm" c="dimmed">
                        Quantité: {item.quantity}
                      </Text>
                    </Group>
                  </div>
                </div>
              </Paper>
            ))}
          </div>
        </div>
      </Stack>
    </Paper>
  )
}

export default function BatchPage({}: BatchPageProps) {
  const { batchOrders, isLoading } = useBatchPresenter()
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | undefined>()

  if (isLoading) {
    return (
      <Container>
        <Loader />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack>
        <Title order={2}>Commandes de stock ({batchOrders.length})</Title>
        {batchOrders.map((order) => (
          <OrderRow 
            key={order.id} 
            order={order} 
          />
        ))}
      </Stack>
      <OrderDrawer
        opened={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(undefined)}
      />
    </Container>
  )
}
