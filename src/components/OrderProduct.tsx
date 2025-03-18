import { Box, Flex, Image, Text, Title } from '@mantine/core';
import styles from './OrderProduct.module.scss';
import { transformColor } from '@/utils/color-transformer';

type OrderProductProps = {
  product: {
    imageUrl: string | null;
    title: string;
    type: string | null;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
    weightInKg: number;
    quantity: number;
    sku: string;
  };
};

const DEFAULT_PRODUCT_IMAGE = '/images/product-placeholder.png';

export const OrderProduct = ({ product }: OrderProductProps) => {
  return (
    <Flex gap="md" align="center" direction="row" wrap="wrap">
      <Image 
        h={70} 
        w={70} 
        src={product.imageUrl || DEFAULT_PRODUCT_IMAGE}
        fallbackSrc={DEFAULT_PRODUCT_IMAGE}
      />
      <Box flex={1} ml={20}>
        <Title order={3} className={styles.product_title}>
          {product.title}
        </Title>
        <Text mt={5}>
          {product.selectedOptions.map((option) => {
            const isColor = option.name.toLowerCase().includes('couleur');
            return (
              <span key={option.name}>
                <b>{option.name}</b> : {isColor ? transformColor(option.value) : option.value}
                <br />
              </span>
            );
          })}
          <span className={styles.print_hidden}>
            <b>SKU</b> : {product.sku}
            <br />
          </span>
          <b>Poids</b> : {product.weightInKg} kg
        </Text>
      </Box>
      <Text size={'xl'}>x{product.quantity}</Text>
    </Flex>
  );
};
