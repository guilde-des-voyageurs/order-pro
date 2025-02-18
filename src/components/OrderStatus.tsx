import React from 'react';
import { useOrderProgress } from '@/hooks/useOrderProgress';
import { Text } from '@mantine/core';

interface OrderStatusProps {
  orderId: string;
  className?: string;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({ orderId, className }) => {
  const { progress, isLoading, error } = useOrderProgress(orderId);

  if (isLoading) {
    return <div className={className}>...</div>;
  }

  if (error) {
    return <div className={className}>⚠️</div>;
  }

  // Afficher NEW si totalCount est 0
  if (progress.totalCount === 0) {
    return (
      <Text 
        c="violet" 
        fw={700}
        className={className} 
        size="sm"
      >
        NEW
      </Text>
    );
  }

  const isComplete = progress.checkedCount === progress.totalCount;

  return (
    <Text 
      c={isComplete ? 'green' : 'dimmed'} 
      fw={isComplete ? 700 : 400}
      className={className} 
      size="sm"
    >
      {progress.checkedCount}/{progress.totalCount}
    </Text>
  );
};
