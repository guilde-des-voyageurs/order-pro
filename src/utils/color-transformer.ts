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
  'Bleu Indien': {
    internalName: 'India Ink Grey'
  },
  'Noir': {
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
    return normalizedColor;
  }

  // Si aucune correspondance n'est trouvée, retourner la couleur avec une majuscule
  return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
}
