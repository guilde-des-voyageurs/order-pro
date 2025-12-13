export interface PriceRule {
  // Conditions
  sku?: string | RegExp;
  color?: string | RegExp;
  printFile?: string | RegExp;

  // Prix en euros
  price: number;

  // Description optionnelle de la règle
  description?: string;
}

export interface VariantPriceInfo {
  sku: string;
  color: string;
  printFile?: string;
}
