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
  },
  'Mocha': {
    internalName: 'Chocolat'
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
