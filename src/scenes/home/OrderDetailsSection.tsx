'use client';

import styles from './OrderDetailsSection.module.scss';
import { clsx } from 'clsx';
import { Badge } from '@/components/Badge';
import { Box, Button, Flex, Image, Stack, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { OrderCheckbox } from '@/components/OrderCheckbox';
import { BillingCheckbox } from '@/components/BillingCheckbox';
import { OrderProduct } from '@/components/OrderProduct';
import { OrderVariantList } from '@/components/OrderVariantList';

export const OrderDetailsSection = ({
  selected,
  visible,
  onRequestClose,
}: {
  selected: string | null;
  visible: boolean;
  onRequestClose: () => void;
}) => {
  return (
    <div className={clsx(styles.view, visible === true && styles.view_visible)}>
      {selected !== null && <Content id={selected} />}
      <div className={styles.cross_container} onClick={() => onRequestClose()}>
        <IconX size={40} />
      </div>
    </div>
  );
};

const Content = ({ id }: { id: string }) => {
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrderDetailAction(id),
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef } as any);

  console.log('Query result:', query);

  if (!query.data || query.data.type === 'error') {
    console.log('Error or no data:', query.data);
    return null;
  }

  const order = query.data.data;
  console.log('Order data:', order);

  // Ne calculer les coûts que s'il y a des produits
  const unitCostInEuros = order.products.length > 0 
    ? order.products.reduce((prev, curr) => prev + curr.unitCostInEuros + '€ + ', '').slice(0, -3)
    : '0€';

  const unitCostSum = order.products.length > 0
    ? order.products.reduce((prev, curr) => prev + curr.unitCostInEuros, 0)
    : 0;

  // Formater le détail de chaque article textile
  const getProductDetails = (product: typeof order.products[0]) => {
    // Récupérer les options dans le bon format
    const sizeOption = product.selectedOptions?.find(
      opt => opt.name.toLowerCase().includes('taille'),
    );
    const colorOption = product.selectedOptions?.find(
      opt => opt.name.toLowerCase().includes('couleur'),
    );

    return `${product.quantity}x ${product.sku} - ${sizeOption?.value || ''} - ${colorOption?.value || ''}`;
  };

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
        .map(getProductDetails)
        .join('\n')
    : '';

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
                  <div>
                    <b>Textile commandé</b> : 
                  </div>
                  <OrderCheckbox 
                    orderId={id} 
                    className={styles.checkbox}
                  />
                </Flex>
                <Box ml="md">
                  <OrderVariantList 
                    orderId={id}
                    products={order.products}
                  />
                </Box>
                <Flex align="center" gap="md">
                  <Text>
                    <b>Facturé</b> : {unitCostInEuros} = {unitCostSum}€
                    <br />
                    <p>Le prix final comprend la manutention de l'envoi.</p>
                  </Text>
                  <BillingCheckbox 
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
