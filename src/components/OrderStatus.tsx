import React from 'react';
import { useOrderCheckbox } from '@/hooks/useOrderCheckbox';

interface OrderStatusProps {
  orderId: string;
  className?: string;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({ orderId, className }) => {
  const { isChecked, isLoading, error } = useOrderCheckbox(orderId);

  if (isLoading) {
    return <div className={className}>Loading...</div>;
  }

  if (error) {
    return <div className={className}>⚠️</div>;
  }

  return (
    <div className={className}>
      {isChecked ? '✓' : ''}
    </div>
  );
};
