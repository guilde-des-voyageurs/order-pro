import { Badge } from '@mantine/core';

interface FinancialStatusProps {
  status: string;
}

export function FinancialStatus({ status }: FinancialStatusProps) {
  let color: string;
  let label: string;

  switch (status?.toLowerCase()) {
    case 'paid':
      color = 'green';
      label = 'Payé';
      break;
    case 'pending':
      color = 'yellow';
      label = 'En attente';
      break;
    case 'refunded':
      color = 'red';
      label = 'Remboursé';
      break;
    case 'partially_refunded':
      color = 'orange';
      label = 'Partiellement remboursé';
      break;
    default:
      color = 'gray';
      label = status || 'Inconnu';
  }

  return <Badge color={color}>{label}</Badge>;
}
