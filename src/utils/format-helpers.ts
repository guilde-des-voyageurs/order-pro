/**
 * Formate un montant avec 2 décimales maximum
 * @param amount Le montant à formater (string ou number)
 * @returns Le montant formaté
 */
export const formatAmount = (amount: string | number): string => {
  // Convertir en nombre si c'est une string
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Vérifier que c'est un nombre valide
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  // Formater avec 2 décimales maximum
  return num.toFixed(2).replace(/\.?0+$/, '');
};
