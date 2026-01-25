'use client';

import { ActionIcon, Image, Text, Badge, Group, Stack, Table, ScrollArea } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { ProductData } from './ProductCard';
import styles from './ProductDetailPanel.module.scss';

interface ProductDetailPanelProps {
  product: ProductData;
  onClose: () => void;
}

export function ProductDetailPanel({ product, onClose }: ProductDetailPanelProps) {
  // Trier les variantes par taille
  const sortedVariants = [...product.variants].sort((a, b) => {
    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
    const aIndex = a.size ? sizeOrder.indexOf(a.size.toUpperCase()) : 999;
    const bIndex = b.size ? sizeOrder.indexOf(b.size.toUpperCase()) : 999;
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return (a.size || '').localeCompare(b.size || '');
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <ActionIcon 
            variant="subtle" 
            color="gray" 
            size="lg"
            onClick={onClose}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Text fw={600} size="lg">Détails du produit</Text>
        </div>

        <ScrollArea className={styles.content}>
          <div className={styles.productInfo}>
            <div className={styles.imageSection}>
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  radius="md"
                  h={250}
                  fit="contain"
                />
              ) : (
                <div className={styles.noImage}>
                  <Text c="dimmed">Pas d'image</Text>
                </div>
              )}
            </div>

            <Stack gap="md" className={styles.infoSection}>
              <div>
                <Text size="xl" fw={700}>{product.title}</Text>
                <Text size="sm" c="dimmed">{product.handle}</Text>
              </div>

              <Group gap="md">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase">Stock total</Text>
                  <Badge 
                    size="xl" 
                    color={product.totalQuantity > 0 ? 'green' : 'red'}
                    variant="light"
                  >
                    {product.totalQuantity} unités
                  </Badge>
                </div>
              </Group>

              <div>
                <Text size="sm" fw={600} mb="xs">Répartition par taille</Text>
                <Group gap="xs">
                  {Object.entries(product.sizeBreakdown).map(([size, qty]) => (
                    <Badge 
                      key={size} 
                      variant="outline" 
                      color={qty > 0 ? 'gray' : 'red'}
                      size="lg"
                    >
                      {size}: {qty}
                    </Badge>
                  ))}
                </Group>
              </div>
            </Stack>
          </div>

          <div className={styles.variantsSection}>
            <Text size="sm" fw={600} mb="md">Détail des variantes</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Variante</Table.Th>
                  <Table.Th>SKU</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Quantité</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedVariants.map((variant) => (
                  <Table.Tr key={variant.id}>
                    <Table.Td>
                      <Text size="sm">{variant.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{variant.sku || '-'}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Badge 
                        color={variant.quantity > 0 ? 'green' : 'red'} 
                        variant="light"
                      >
                        {variant.quantity}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
