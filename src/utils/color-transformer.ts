interface ColorMapping {
  displayName: string;
  internalName: string;
}

const colorMappings: { [key: string]: ColorMapping } = {
  'bleu azur': {
    displayName: 'Bleu Azur',
    internalName: 'Stargazer'
  },
  'bleu marine': {
    displayName: 'Bleu Marine',
    internalName: 'French Navy'
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
  }
};

/**
 * Transforme le nom d'une couleur en ajoutant son nom interne
 * @param color - Le nom de la couleur à transformer
 * @returns Le nom formaté avec le nom interne entre parenthèses
 */
export function transformColor(color: string): string {
  const mapping = colorMappings[color.toLowerCase()];
  if (mapping) {
    return `${mapping.displayName} (${mapping.internalName})`;
  }
  return color;
}
