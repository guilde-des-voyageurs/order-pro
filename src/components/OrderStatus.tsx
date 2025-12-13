import React from 'react';
import { Badge } from '@mantine/core';

interface OrderStatusProps {
  orderId: string;
  status: string;
}

export function OrderStatus({ status }: OrderStatusProps) {
  const getColor = () => {
    switch (status) {
      case 'fulfilled':
        return 'green';
      case 'unfulfilled':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'fulfilled':
        return 'Complété';
      case 'unfulfilled':
        return 'En cours';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <Badge color={getColor()}>
      {getLabel()}
    </Badge>
  );
}
