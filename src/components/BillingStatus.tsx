import React from 'react';
import { useBillingCheckbox } from '@/hooks/useBillingCheckbox';
import { Badge } from '@mantine/core';

interface BillingStatusProps {
  orderId: string;
  className?: string;
}

export const BillingStatus: React.FC<BillingStatusProps> = ({ orderId, className }) => {
  const { checked, loading } = useBillingCheckbox(orderId);

  if (loading) {
    return <Badge color="gray">Chargement...</Badge>;
  }

  return (
    <Badge color={checked ? "green" : "red"}>
      {checked ? "Facturé" : "Non facturé"}
    </Badge>
  );
};
