interface ColorMapping {
  internalName: string;
}

export const colorMappings: { [key: string]: ColorMapping } = {
  'Bleu Azur': {
    internalName: 'Stargazer'
  },
  'Bleu Marine': {
    internalName: 'French Navy'
  },
  'Blanc ancien': {
    internalName: 'Vintage white'
  },
  'Ecru': {
    internalName: 'Raw'
  },
  'Bleu Nuit': {
    internalName: 'Green Bay'
  },
  'Bordeaux': {
    internalName: 'Burgundy'
  },
  'Crème': {
    internalName: 'Cream'
  },
  'Nocturne': {
    internalName: 'Dusk'
  },
  'Kaki': {
    internalName: 'Khaki'
  },
  'Terra Cotta': {
    internalName: 'Heritage Brown'
  },
  'Vert Forêt': {
    internalName: 'Glazed Green'
  },
  'Vert Antique': {
    internalName: 'Bottle Green'
  },
  'Prune': {
    internalName: 'Red Brown'
  },
  'Chocolat': {
    internalName: 'Mocha'
  },
  // Note: Shopify traduit parfois "Chocolat" en "Mocha" dans les variantTitle
  // On garde les deux mappings pour assurer la cohérence
  'Bleu Indien': {
    internalName: 'India Ink Grey'
  },
  'Noir': {
    internalName: 'Black'
  },
  'Mocha': {
    internalName: 'Mocha'
  }
};

/**
 * Transforme le nom d'une couleur en ajoutant son nom interne
 * @param color - Le nom de la couleur à transformer
 * @returns Le nom formaté avec le nom interne entre parenthèses
 */
export function transformColor(color: string): string {
  if (!color) return 'Sans couleur';
  
  // Chercher une correspondance directe
  if (colorMappings[color]) {
    return colorMappings[color].internalName;
  }

  // Nettoyer la couleur (enlever les parenthèses et leur contenu)
  const cleanColor = color.replace(/\s*\([^)]*\)/g, '').trim();

  // Chercher une correspondance avec la couleur nettoyée
  if (colorMappings[cleanColor]) {
    return colorMappings[cleanColor].internalName;
  }

  // Si toujours pas de correspondance, essayer avec la normalisation
  const normalizedInput = cleanColor.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const foundColor = Object.entries(colorMappings).find(([key]) => {
    const normalizedKey = key.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return normalizedKey === normalizedInput;
  });

  if (foundColor) {
    return foundColor[1].internalName;
  }

  // Si aucune correspondance n'est trouvée, retourner la couleur originale
  return cleanColor;
}

/**
 * Transforme le nom anglais d'une couleur vers son nom français
 * Utilisé pour la génération des strings de facturation (règles en français)
 * @param englishColor - Le nom anglais de la couleur
 * @returns Le nom français correspondant
 */
export function reverseTransformColor(englishColor: string): string {
  if (!englishColor) return '';
  
  // Chercher la correspondance inverse (anglais → français)
  const foundEntry = Object.entries(colorMappings).find(([_, mapping]) => 
    mapping.internalName.toLowerCase() === englishColor.toLowerCase()
  );
  
  if (foundEntry) {
    return foundEntry[0]; // Retourner le nom français
  }
  
  // Si pas de correspondance, retourner la couleur telle quelle
  return englishColor;
}
