'use client';

import { Button, Title, Text, Badge, Group, Stack, Table, Image } from '@mantine/core';
import { IconArrowLeft, IconPhoto } from '@tabler/icons-react';
import { ProductData } from './ProductCard';
import styles from './ProductDetailView.module.scss';

interface ProductDetailViewProps {
  product: ProductData;
  onBack: () => void;
  locationName?: string;
}

export function ProductDetailView({ product, onBack, locationName }: ProductDetailViewProps) {
  // Trier les variantes par taille
  const sortedVariants = [...product.variants].sort((a, b) => {
    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
    const aIndex = sizeOrder.indexOf(a.size || '');
    const bIndex = sizeOrder.indexOf(b.size || '');
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return (a.title || '').localeCompare(b.title || '');
  });

  return (
    <div className={styles.container}>
      {/* Header avec bouton retour */}
      <div className={styles.header}>
        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={18} />}
          onClick={onBack}
          className={styles.backButton}
        >
          Retour à l'inventaire
        </Button>
         {/* Image */}
        <div className={styles.imageSection}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.imageAlt || product.title}
              className={styles.productImage}
              fit="contain"
            />
          ) : (
            <div className={styles.noImage}>
              <IconPhoto size={48} stroke={1.5} />
            </div>
          )}
        </div>
        {/* Title */}
        <Title order={2} className={styles.productTitle}>
        {product.title}
        </Title>
        {/* handle */}
        {product.handle && (
          <Text size="sm" c="dimmed" className={styles.productHandle}>
            {product.handle}
          </Text>
        )}
            
      </div>

      {/* Contenu principal */}
      <div className={styles.content}>
        {/* Section info produit */}
        <div className={styles.productInfo}>

          {/* Informations */}
          <div className={styles.infoSection}>

            {/* Stock total */}
            <div className={styles.stockTotal}>
              <Text size="sm" fw={500} className={styles.stockLabel}>
                Stock total : {locationName && `${locationName}`}
              </Text>
              <Badge
                size="xl"
                color={product.totalQuantity > 0 ? 'green' : 'red'}
                variant="light"
                className={styles.stockBadge}
              >
                {product.totalQuantity} unité{product.totalQuantity > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Répartition par taille */}
            {Object.keys(product.sizeBreakdown).length > 0 && (
              <div className={styles.sizeBreakdown}>
                <Group gap="xs" className={styles.sizeBreakdownBadges}>
                  {Object.entries(product.sizeBreakdown).map(([size, qty]) => (
                    <Badge
                      key={size}
                      variant="outline"
                      color={qty > 0 ? 'gray' : 'red'}
                      className={`${styles.sizeBadge} ${qty > 0 ? styles.inStock : styles.outOfStock}`}
                    >
                      {size}: {qty}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}
          </div>
        </div>

        {/* Tableau des variantes */}
        <div className={styles.variantsSection}>
          <Text size="sm" fw={600} mb="md" className={styles.variantsTitle}>
            Détail des variantes ({sortedVariants.length})
          </Text>
          
          <Table striped highlightOnHover className={styles.variantsTable}>
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
                  <Table.Td className={styles.variantName}>
                    {variant.title || 'Default'}
                  </Table.Td>
                  <Table.Td className={styles.variantSku}>
                    {variant.sku || '-'}
                  </Table.Td>
                  <Table.Td className={styles.variantQuantity}>
                    <Badge
                      color={variant.quantity > 0 ? 'green' : 'red'}
                      variant="light"
                      className={`${styles.quantityBadge} ${variant.quantity > 0 ? styles.inStock : styles.outOfStock}`}
                    >
                      {variant.quantity}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
