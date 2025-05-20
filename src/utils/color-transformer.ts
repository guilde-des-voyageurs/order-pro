interface ColorMapping {
  displayName: string;
  internalName: string;
}

export const colorMappings: { [key: string]: ColorMapping } = {
  'bleu azur': {
    displayName: 'Bleu Azur',
    internalName: 'Stargazer'
  },
  'bleu marine': {
    displayName: 'Bleu Marine',
    internalName: 'French Navy'
  },
  'blanc antique': {
    displayName: 'Blanc antique',
    internalName: 'Vintage white'
  },
  'ecru': {
    displayName: 'Ecru',
    internalName: 'Raw'
  },
  'bleu nuit': {
    displayName: 'Bleu Nuit',
    internalName: 'Green Bay'
  },
  'bordeaux': {
    displayName: 'Bordeaux',
    internalName: 'Burgundy'
  },
  'crème': {
    displayName: 'Crème',
    internalName: 'Cream'
  },
  'nocturne': {
    displayName: 'Nocturne',
    internalName: 'Dusk'
  },
  'kaki': {
    displayName: 'Kaki',
    internalName: 'Khaki'
  },
  'terra cotta': {
    displayName: 'Terra Cotta',
    internalName: 'Heritage Brown'
  },
  'vert forêt': {
    displayName: 'Vert Forêt',
    internalName: 'Glazed Green'
  },
  'vert antique': {
    displayName: 'Vert Antique',
    internalName: 'Bottle Green'
  },
  'prune': {
    displayName: 'Prune',
    internalName: 'Red Brown'
  },
  'bleu indien': {
    displayName: 'Bleu Indien',
    internalName: 'India Ink Grey'
  },
  'noir': {
    displayName: 'Noir',
    internalName: 'Black'
  }
};

/**
 * Transforme le nom d'une couleur en ajoutant son nom interne
 * @param color - Le nom de la couleur à transformer
 * @returns Le nom formaté avec le nom interne entre parenthèses
 */
export function transformColor(color: string): string {
  if (!color) return 'Sans couleur';
  
  // Normaliser la couleur en minuscules et sans accents
  const normalizedColor = color.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Chercher la correspondance dans le mapping
  const mapping = colorMappings[normalizedColor] || 
                 Object.entries(colorMappings)
                   .find(([key]) => key.normalize('NFD')
                     .replace(/[\u0300-\u036f]/g, '') === normalizedColor)?.[1];

  if (mapping) {
    return `${mapping.displayName} (${mapping.internalName})`;
  }

  // Si aucune correspondance n'est trouvée, retourner la couleur avec une majuscule
  return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
}
