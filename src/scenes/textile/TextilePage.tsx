'use client';

import styles from './TextilePage.module.scss';
import { Box, Card, Stack, Text, Title } from '@mantine/core';
import { useTextilePagePresenter } from './TextilePage.presenter';

export const TextilePage = () => {
  const { orders, isLoading } = useTextilePagePresenter();

  if (isLoading) {
    return (
      <div className={styles.view}>
        <div className={styles.main_content}>
          <Title order={2}>Textile</Title>
          <Text>Chargement des commandes...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Textile</Title>
        <Stack spacing="lg">
          {orders.map((orderDetail) => {
            if (orderDetail.type !== 'success') return null;
            
            return (
              <Card 
                key={orderDetail.data.id} 
                shadow="sm" 
                p="lg"
                radius="md"
                withBorder
              >
                <Title order={3} mb="md">
                  Commande {orderDetail.data.name}
                </Title>
                <Stack spacing="xs">
                  {orderDetail.data.products.map((product, index) => (
                    <Box key={index}>
                      <Text>
                        {product.quantity}x {product.sku} - {
                          product.selectedOptions
                            .filter(opt => 
                              opt.name.toLowerCase().includes('taille') || 
                              opt.name.toLowerCase().includes('couleur')
                            )
                            .map(opt => opt.value)
                            .join(' - ')
                        }
                      </Text>
                    </Box>
                  ))}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </div>
    </div>
  );
};
