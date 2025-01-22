import React from 'react';
import { useBillingCheckbox } from '@/hooks/useBillingCheckbox';

interface BillingStatusProps {
  orderId: string;
  className?: string;
}

export const BillingStatus: React.FC<BillingStatusProps> = ({ orderId, className }) => {
  const { isChecked, isLoading, error } = useBillingCheckbox(orderId);

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
