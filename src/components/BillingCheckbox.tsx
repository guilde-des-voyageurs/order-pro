import React from 'react';
import { useBillingCheckbox } from '@/hooks/useBillingCheckbox';
import { Tooltip } from '@mantine/core';

interface BillingCheckboxProps {
  orderId: string;
  className?: string;
}

export const BillingCheckbox: React.FC<BillingCheckboxProps> = ({ orderId, className }) => {
  const { checked, loading, handleChange } = useBillingCheckbox(orderId);

  if (loading) {
    return <div className={className}>Loading...</div>;
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => handleChange(e.target.checked)}
      className={className}
      aria-label="Billing status checkbox"
    />
  );
};
