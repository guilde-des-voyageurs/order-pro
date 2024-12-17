'use client';

import styles from './OrderDetailsSection.module.scss';
import { clsx } from 'clsx';
import { Badge } from '@/components/Badge';
import { Box, Button, Flex, Image, Stack, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderDetailAction } from '@/actions/fetch-order-detail-action';

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

  if (!query.data || query.data.type === 'error') {
    return null;
  }

  const order = query.data.data;

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <Title order={3}>
          <b>{order.name}</b>&nbsp;&nbsp;
          <span>{order.createdAtFormatted}</span>
        </Title>
        {order.status === 'OPEN' && <Badge variant={'orange'}>En cours</Badge>}
        {order.status === 'CLOSED' && <Badge variant={'green'}>Traitée</Badge>}
      </div>
      <Box>
        <Text c={'gray.7'}>Numéro Boxtal: {order.name}</Text>
        <Text>
          Poids: {order.weightInKg}kg - Si deux commandes similaires, prendre la
          seconde.
        </Text>
      </Box>
      <Button mt={60} size={'lg'}>
        Imprimer le bordereau d'emballage
      </Button>
      <Stack mt={60}>
        {order.products.map((product) => (
          <Flex
            key={product.id}
            gap="md"
            align="center"
            direction="row"
            wrap="wrap"
          >
            <Image h={200} w={200} src={product.imageUrl} />
            <Box flex={1} ml={20}>
              <Title order={3}>{product.title}</Title>
              <Text>
                {product.selectedOptions.map((option) => (
                  <span key={option.name}>
                    {option.name}: {option.value}
                    <br />
                  </span>
                ))}
                Type : {product.type || 'Non défini'}
              </Text>
            </Box>
            <Text>x{product.quantity}</Text>
          </Flex>
        ))}
      </Stack>
    </div>
  );
};
