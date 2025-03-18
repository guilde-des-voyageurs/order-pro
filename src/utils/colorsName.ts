interface ColorMapping {
  displayName: string;  // Nom affiché dans l'interface
  internalName: string; // Nom interne à afficher entre parenthèses
}

type ColorMappings = {
  [key: string]: ColorMapping;
};

export const colorMappings: ColorMappings = {
  'Vert Forêt': {
    displayName: 'Vert Forêt',
    internalName: 'Glazed Green'
  },
  // Ajoutez d'autres mappings de couleurs ici
  'Bleu Marine': {
    displayName: 'Bleu Marine',
    internalName: 'Navy Blue'
  },
  'Rouge Bordeaux': {
    displayName: 'Rouge Bordeaux',
    internalName: 'Wine Red'
  }
};

/**
 * Formate le nom d'une couleur en ajoutant son nom interne si disponible
 * @param colorName - Le nom de la couleur à formater
 * @returns Le nom formaté avec le nom interne entre parenthèses si disponible
 */
export const formatColorName = (colorName: string): string => {
  const mapping = colorMappings[colorName];
  if (mapping) {
    return `${mapping.displayName} (${mapping.internalName})`;
  }
  return colorName; // Retourne le nom original si pas de mapping
};
