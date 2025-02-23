import { Badge } from '@mantine/core';

interface FinancialStatusProps {
  status: string;
}

export function FinancialStatus({ status }: FinancialStatusProps) {
  const getColor = () => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#e3e8e7';
      case 'pending':
        return 'yellow';
      case 'refunded':
        return 'red';
      case 'partially_refunded':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getLabel = () => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Payé par le client';
      case 'pending':
        return 'En attente';
      case 'refunded':
        return 'Remboursé';
      case 'partially_refunded':
        return 'Partiellement remboursé';
      default:
        return status || 'Inconnu';
    }
  };

  return (
    <Badge color={getColor()} c="#646d6c">
      {getLabel()}
    </Badge>
  );
}
