type StatusType = 'display_fulfillment_status' | 'display_financial_status';

const STATUS_COLORS: Record<string, string> = {
  // Statuts de fulfillment
  'FULFILLED': 'green',
  'IN_PROGRESS': 'yellow',
  'UNFULFILLED': 'red',
  'PARTIALLY_FULFILLED': 'orange',
  'SCHEDULED': 'blue',
  'ON_HOLD': 'gray',
  'PENDING_FULFILLMENT': 'yellow',
  'OPEN': 'yellow',
  'IN_TRANSIT': 'blue',
  'OUT_FOR_DELIVERY': 'teal',
  'ATTEMPTED_DELIVERY': 'orange',
  'DELIVERED': 'green',
  'PICKED_UP': 'green',
  'READY_FOR_PICKUP': 'teal',

  // Statuts financiers
  'AUTHORIZED': 'blue',
  'PAID': 'green',
  'PARTIALLY_PAID': 'yellow',
  'PARTIALLY_REFUNDED': 'orange',
  'PENDING': 'yellow',
  'REFUNDED': 'red',
  'VOIDED': 'gray',
  'EXPIRED': 'gray',
  'UNPAID': 'red',
};

/**
 * Retourne la couleur associée à un statut
 */
export function getStatusColor(status: string | null | undefined): string {
  if (!status) return 'gray';
  
  const normalizedStatus = status.toUpperCase();
  return STATUS_COLORS[normalizedStatus] || 'gray';
}

/**
 * Vérifie si une commande est considérée comme active
 */
export function isOrderActive(fulfillmentStatus: string | null | undefined, financialStatus: string | null | undefined): boolean {
  if (!fulfillmentStatus || !financialStatus) return false;

  const normalizedFulfillment = fulfillmentStatus.toUpperCase();
  const normalizedFinancial = financialStatus.toUpperCase();

  // Une commande est active si :
  // 1. Elle n'est pas complètement expédiée
  const isUnfulfilled = ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'IN_PROGRESS', 'PENDING_FULFILLMENT'].includes(normalizedFulfillment);
  
  // 2. Et elle a un statut de paiement valide
  const hasValidPayment = ['PAID', 'PARTIALLY_PAID', 'AUTHORIZED', 'PENDING'].includes(normalizedFinancial);

  return isUnfulfilled && hasValidPayment;
}

/**
 * Vérifie si une commande est en attente de paiement
 */
export function isPaymentPending(financialStatus: string | null | undefined): boolean {
  if (!financialStatus) return false;
  
  const normalizedStatus = financialStatus.toUpperCase();
  return ['PENDING', 'AUTHORIZED'].includes(normalizedStatus);
}

/**
 * Vérifie si une commande nécessite une action
 */
export function needsAction(fulfillmentStatus: string | null | undefined, financialStatus: string | null | undefined): boolean {
  if (!fulfillmentStatus || !financialStatus) return false;

  // Une action est nécessaire si :
  // 1. La commande est active
  const active = isOrderActive(fulfillmentStatus, financialStatus);
  
  // 2. Ou si elle est en attente de paiement
  const pendingPayment = isPaymentPending(financialStatus);

  return active || pendingPayment;
}
