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

      <Stack mt={60} ml={10} mr={32} ref={contentRef}>
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
                    <b>{option.name}</b> : {option.value}
                    <br />
                  </span>
                ))}
                <b>Type</b> : {product.type || 'Non défini'}
              </Text>
            </Box>
            <Text size={'xl'}>x{product.quantity}</Text>
          </Flex>
        ))}
      </Stack>
      <Button mt={40} size={'lg'} onClick={() => reactToPrintFn()}>
        Imprimer le bordereau d'emballage
      </Button>
    </div>
  );
};
