'use client';

import { Box, Button, Flex, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useRef, Suspense } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Badge } from '@/components/Badge';
import { BillingCheckbox } from '@/components/BillingCheckbox';
import { OrderProduct } from '@/components/OrderProduct';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';
import { getOrderVariantsCheckedAction } from '@/actions/get-order-variants-checked-action';
import { calculateGlobalVariantIndex } from '@/utils/variant-helpers';
import styles from './OrderDetailsSection.module.scss';

interface Product {
  sku: string;
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface OrderDetail {
  id: string;
  name: string;
  products: Product[];
  status: 'OPEN' | 'CLOSED';
  displayFinancialStatus: 'PENDING' | 'PAID';
  weightInKg: number;
  createdAtFormatted: string;
}

// Composants avec fallback pour le chargement
const VariantCheckboxWithSuspense = ({ sku, color, size, quantity, orderId }: { sku: string; color: string | null; size: string | null; quantity: number; orderId: string }) => {
  const { data: response } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: () => fetchOrderDetailAction(orderId),
  });

  if (!response || response.type === 'error' || !response.data?.products) {
    return <div>Chargement...</div>;
  }

  const orderDetail = response.data;
  const products = orderDetail.products;
  const product = products.find(p => p.sku === sku);
  const productIndex = products.findIndex(p => p.sku === sku);

  if (!product || productIndex === -1) {
    return <div>Chargement...</div>;
  }

  const globalIndex = calculateGlobalVariantIndex(
    products,
    product,
    productIndex
  );

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <VariantCheckbox 
        sku={sku} 
        color={color} 
        size={size} 
        quantity={quantity} 
        orderId={orderId}
        productIndex={globalIndex}
      />
    </Suspense>
  );
};

const BillingCheckboxWithSuspense = ({ orderId, className }: { orderId: string; className?: string }) => (
  <Suspense fallback={<div>Chargement...</div>}>
    <BillingCheckbox orderId={orderId} className={className} />
  </Suspense>
);

const OrderCount = ({ orderId }: { orderId: string }) => {
  const query = useQuery({
    queryKey: ['order-variants-checked', orderId],
    queryFn: () => getOrderVariantsCheckedAction(orderId),
  });

  if (!query.data || query.data.type === 'error') {
    return <Text component="span">0/0</Text>;
  }

  const { checkedCount, totalCount } = query.data.data;
  return (
    <Text 
      component="span" 
      c={checkedCount === totalCount ? "green" : "orange"}
    >
      {checkedCount}/{totalCount}
    </Text>
  );
};

const Content = ({ id }: { id: string }) => {
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrderDetailAction(id),
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef } as any);

  if (!query.data || query.data.type === 'error') {
    return null;
  }

  const response = query.data;
  const order = response.data;

  // Ne calculer les coûts que s'il y a des produits
  const unitCostInEuros = order.products.length > 0 
    ? order.products.reduce((prev, curr) => prev + curr.unitCostInEuros + '€ + ', '').slice(0, -3)
    : '0€';

  const unitCostSum = order.products.length > 0
    ? order.products.reduce((prev, curr) => prev + curr.unitCostInEuros, 0)
    : 0;

  // Grouper les produits par SKU + taille + couleur seulement s'il y a des produits
  const groupedProducts = order.products.length > 0 
    ? order.products.reduce((acc, product) => {
      const sizeOption = product.selectedOptions?.find(
        opt => opt.name.toLowerCase().includes('taille'),
      );
      const colorOption = product.selectedOptions?.find(
        opt => opt.name.toLowerCase().includes('couleur'),
      );
      
      // Créer une clé unique qui combine SKU, taille et couleur
      const key = `${product.sku}-${sizeOption?.value || 'no-size'}-${colorOption?.value || 'no-color'}`;
      
      if (!acc[key]) {
        acc[key] = {
          ...product,
          quantity: 0,
        };
      }
      acc[key].quantity += product.quantity;
      return acc;
    }, {} as Record<string, typeof order.products[0]>) 
    : {};

  const textileDetails = order.products.length > 0
    ? Object.values(groupedProducts)
        .map((product) => {
          const sizeOption = product.selectedOptions?.find(
            opt => opt.name.toLowerCase().includes('taille'),
          );
          const colorOption = product.selectedOptions?.find(
            opt => opt.name.toLowerCase().includes('couleur'),
          );

          return (
            <Flex key={`${product.sku}-${sizeOption?.value}-${colorOption?.value}`} align="center" gap="md">
              <VariantCheckboxWithSuspense
                sku={product.sku}
                color={colorOption?.value ?? null}
                size={sizeOption?.value ?? null}
                quantity={product.quantity}
                orderId={id}
              />
              <Text size="sm">
                {product.quantity}x {product.sku}
                {colorOption?.value ? ` - ${colorOption.value}` : ''}
                {sizeOption?.value ? ` - ${sizeOption.value}` : ''}
              </Text>
            </Flex>
          );
        })
    : [];

  return (
    <div className={styles.content}>
      <Stack>
        <div className={styles.print_hidden}>
          <div className={styles.header}>
            <Title order={3}>
              <b>{order.name}</b>&nbsp;&nbsp;du&nbsp;&nbsp;{order.createdAtFormatted}
            </Title>
            {order.status === 'OPEN' && <Badge variant={'orange'}>En cours</Badge>}
            {order.status === 'CLOSED' && <Badge variant={'green'}>Traitée</Badge>}
          </div>

          <Box>
            {order.displayFinancialStatus === 'PENDING' && (
              <Text c="orange" fw={600} mt={5}>
                ⚠️ Commande en attente de paiement (ne pas commander le textile)
              </Text>
            )}
            {order.displayFinancialStatus === 'PAID' && (
              <Text c="green" fw={600} mt={5}>
                ✓ Commande approuvée
              </Text>
            )}
            {order.products.length > 0 && (
              <>
                <Text mt={5}>
                  <b>Poids</b> : {order.weightInKg}kg
                </Text>
                <Flex align="center" gap="md">
                  <Text component="div" fw={600}>
                    Textile commandé : {textileDetails.length > 0 && (
                      <Suspense fallback={<Text component="span">Chargement...</Text>}>
                        <OrderCount orderId={id} />
                      </Suspense>
                    )}
                  </Text>
                </Flex>
                <Box ml="md">
                  {order.products.length > 0 && textileDetails.map((detail) => detail)}
                </Box>
                <Flex align="center" gap="md">
                  <Text component="div">
                    <b>Facturé</b> : {unitCostInEuros} = {unitCostSum}€
                    <br />
                    <Text component="div" size="sm" mt={4}>
                      Le prix final comprend la manutention de l'envoi.
                    </Text>
                  </Text>
                  <BillingCheckboxWithSuspense 
                    orderId={id} 
                    className={styles.checkbox}
                  />
                </Flex>
              </>
            )}
          </Box>
        </div>

        {order.products.length > 0 && (
          <>
            <Box mt={32} ml={10} style={{ border: '1px dashed white' }} ref={contentRef} className={styles.print_content}>
              <Stack px={40} py={20}>
                <Title order={3} mb={12}>
                  <b className={styles.product_title}>Commande {order.name}</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className={styles.product_title}>{order.createdAtFormatted}</span>
                </Title>
                {order.products.map((product, index) => (
                  <OrderProduct key={index.toString()} product={product} />
                ))}
              </Stack>
            </Box>

            <Button mt={40} size={'lg'} onClick={() => reactToPrintFn()}>
              Imprimer le bordereau d'emballage
            </Button>
          </>
        )}
      </Stack>
    </div>
  );
};

export default Content;
