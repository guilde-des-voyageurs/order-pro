'use client';

import styles from './OrderDetailsSection.module.scss';
import { clsx } from 'clsx';
import { Badge } from '@/components/Badge';
import { Box, Button, Flex, Image, Stack, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export const OrderDetailsSection = ({
  visible,
  onRequestClose,
}: {
  visible: boolean;
  onRequestClose: () => void;
}) => {
  return (
    <div className={clsx(styles.view, visible === true && styles.view_visible)}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Title order={3}>
            <b>#1194</b>&nbsp;&nbsp;
            <span>Mélanie POULAIN</span>&nbsp;&nbsp;
            <span>03-01-2024</span>
          </Title>
          <Badge variant={'orange'}>En cours</Badge>
        </div>
        <Box>
          <Text c={'gray.7'}>Numéro Boxtal: #1994</Text>
          <Text>
            Poids: 0.5kg - Si deux commandes similaires, prendre la seconde.
          </Text>
        </Box>
        <Button mt={60} size={'lg'}>
          Imprimer le bordereau d'emballage
        </Button>
        <Stack mt={60}>
          <Flex gap="md" align="center" direction="row" wrap="wrap">
            <Image
              height={200}
              src={
                'https://runesdechene.com/cdn/shop/files/svarrun_blanc_tshirt_RedBrown_720x.webp?v=1732846183'
              }
            />
            <Box flex={1} ml={20}>
              <Title order={3}>Svarrun</Title>
              <Text>
                Couleur : kaki
                <br />
                Taille : L<br />
                Type : Creator
              </Text>
            </Box>
            <Text>x1</Text>
          </Flex>
        </Stack>
      </div>
      <div className={styles.cross_container} onClick={() => onRequestClose()}>
        <IconX size={40} />
      </div>
    </div>
  );
};
