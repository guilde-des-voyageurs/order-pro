import React from 'react';
import { useOrderCheckbox } from '@/hooks/useOrderCheckbox';
import { Tooltip } from '@mantine/core';

interface OrderCheckboxProps {
  orderId: string;
  className?: string;
}

export const OrderCheckbox: React.FC<OrderCheckboxProps> = ({ orderId, className }) => {
  const { isChecked, isLoading, error, toggleCheckbox } = useOrderCheckbox(orderId);

  if (isLoading) {
    return <div className={className}>Loading...</div>;
  }

  if (error) {
    return (
      <Tooltip label={error} color="red">
        <div className={className}>⚠️</div>
      </Tooltip>
    );
  }

  return (
    <input
      type="checkbox"
      checked={isChecked}
      onChange={toggleCheckbox}
      className={className}
      aria-label="Order status checkbox"
    />
  );
};
