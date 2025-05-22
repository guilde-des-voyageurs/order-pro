import { PriceRule } from './types';

export const priceRules: PriceRule[] = [
  {
    sku: 'Creator 2.0',
    color: 'Noir',
    printFile: 'VR2',
    price: 14,
    description: 'T-shirt Creator 2.0 Noir avec impression VR2'
  },
  // Ajoutez d'autres règles ici au format :
  // {
  //   sku: string | RegExp,     // SKU exact ou expression régulière
  //   color?: string | RegExp,  // Couleur exacte ou expression régulière (optionnel)
  //   printFile?: string | RegExp, // Fichier d'impression exact ou expression régulière (optionnel)
  //   size?: string | RegExp,   // Taille exacte ou expression régulière (optionnel)
  //   price: number,           // Prix en euros
  //   description?: string     // Description de la règle (optionnel)
  // }
];
