import React from 'react';
import { useBillingCheckbox } from '@/hooks/useBillingCheckbox';
import { Tooltip } from '@mantine/core';

interface BillingCheckboxProps {
  orderId: string;
  className?: string;
}

export const BillingCheckbox: React.FC<BillingCheckboxProps> = ({ orderId, className }) => {
  const { isChecked, isLoading, error, toggleCheckbox } = useBillingCheckbox(orderId);

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
      aria-label="Billing status checkbox"
    />
  );
};
