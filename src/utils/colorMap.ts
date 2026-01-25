/**
 * Mapping des noms de couleurs français/anglais vers des codes hexadécimaux
 * Utilisé pour afficher une bille de couleur à côté des options de type "Couleur"
 */

export const colorMap: Record<string, string> = {
  // Blancs et gris
  'blanc': '#FFFFFF',
  'white': '#FFFFFF',
  'ecru': '#FFFFF0',
  'ivory': '#FFFFF0',
  'crème': '#FFFDD0',
  'cream': '#FFFDD0',
  'beige': '#F5F5DC',
  'écru': '#F5F5DC',
  'gris': '#808080',
  'gray': '#808080',
  'grey': '#808080',
  'gris clair': '#D3D3D3',
  'light gray': '#D3D3D3',
  'gris foncé': '#404040',
  'dark gray': '#404040',
  'anthracite': '#2F4F4F',
  'charbon': '#36454F',
  'charcoal': '#36454F',
  'terra cotta': '#E2725B',
  
  // Noirs
  'noir': '#000000',
  'black': '#000000',
  
  // Rouges
  'rouge': '#E53935',
  'red': '#E53935',
  'bordeaux': '#800020',
  'burgundy': '#800020',
  'bourgogne': '#800020',
  'carmin': '#960018',
  'cerise': '#DE3163',
  'cherry': '#DE3163',
  'corail': '#FF7F50',
  'coral': '#FF7F50',
  'framboise': '#E30B5C',
  'raspberry': '#E30B5C',
  'grenat': '#6C3461',
  'garnet': '#6C3461',
  'vermillon': '#E34234',
  'vermilion': '#E34234',
  'terracotta': '#E2725B',
  'terre cuite': '#E2725B',
  
  // Roses
  'rose': '#FFC0CB',
  'pink': '#FFC0CB',
  'rose pâle': '#FFD1DC',
  'light pink': '#FFD1DC',
  'rose foncé': '#FF1493',
  'hot pink': '#FF1493',
  'fuchsia': '#FF00FF',
  'magenta': '#FF00FF',
  'saumon': '#FA8072',
  'salmon': '#FA8072',
  'pêche': '#FFCBA4',
  'peach': '#FFCBA4',
  
  // Oranges
  'orange': '#FF9800',
  'abricot': '#FBCEB1',
  'apricot': '#FBCEB1',
  'mandarine': '#FF8243',
  'tangerine': '#FF8243',
  'rouille': '#B7410E',
  'rust': '#B7410E',
  'cuivre': '#B87333',
  'copper': '#B87333',
  'caramel': '#FFD59A',
  
  // Jaunes
  'jaune': '#FFEB3B',
  'yellow': '#FFEB3B',
  'or': '#FFD700',
  'gold': '#FFD700',
  'doré': '#FFD700',
  'golden': '#FFD700',
  'moutarde': '#FFDB58',
  'mustard': '#FFDB58',
  'citron': '#FFF44F',
  'lemon': '#FFF44F',
  'vanille': '#F3E5AB',
  'vanilla': '#F3E5AB',
  'safran': '#F4C430',
  'saffron': '#F4C430',
  'ambre': '#FFBF00',
  'amber': '#FFBF00',
  
  // Verts
  'vert': '#4CAF50',
  'green': '#4CAF50',
  'vert clair': '#90EE90',
  'light green': '#90EE90',
  'vert foncé': '#006400',
  'dark green': '#006400',
  'olive': '#808000',
  'kaki': '#C3B091',
  'khaki': '#C3B091',
  'menthe': '#98FF98',
  'mint': '#98FF98',
  'émeraude': '#50C878',
  'emerald': '#50C878',
  'jade': '#00A86B',
  'sapin': '#01796F',
  'forêt': '#228B22',
  'forest': '#228B22',
  'sauge': '#9DC183',
  'sage': '#9DC183',
  'pistache': '#93C572',
  'pistachio': '#93C572',
  'tilleul': '#A5D152',
  'lime': '#32CD32',
  'citron vert': '#32CD32',
  
  // Bleus
  'bleu': '#2196F3',
  'blue': '#2196F3',
  'bleu clair': '#ADD8E6',
  'light blue': '#ADD8E6',
  'bleu foncé': '#00008B',
  'dark blue': '#00008B',
  'bleu marine': '#000080',
  'navy': '#000080',
  'marine': '#000080',
  'bleu ciel': '#87CEEB',
  'sky blue': '#87CEEB',
  'bleu roi': '#4169E1',
  'royal blue': '#4169E1',
  'turquoise': '#40E0D0',
  'cyan': '#00FFFF',
  'aqua': '#00FFFF',
  'sarcelle': '#008080',
  'teal': '#008080',
  'pétrole': '#1B4D5C',
  'cobalt': '#0047AB',
  'indigo': '#4B0082',
  'azur': '#007FFF',
  'azure': '#007FFF',
  'canard': '#048B9A',
  'bleu canard': '#048B9A',
  
  // Violets
  'violet': '#9C27B0',
  'purple': '#9C27B0',
  'mauve': '#E0B0FF',
  'lavande': '#E6E6FA',
  'lavender': '#E6E6FA',
  'lilas': '#C8A2C8',
  'lilac': '#C8A2C8',
  'prune': '#8E4585',
  'plum': '#8E4585',
  'aubergine': '#614051',
  'eggplant': '#614051',
  'améthyste': '#9966CC',
  'amethyst': '#9966CC',
  'parme': '#CFA0E9',
  
  // Marrons
  'marron': '#8B4513',
  'brown': '#8B4513',
  'brun': '#8B4513',
  'chocolat': '#7B3F00',
  'chocolate': '#7B3F00',
  'café': '#6F4E37',
  'coffee': '#6F4E37',
  'noisette': '#A67B5B',
  'hazelnut': '#A67B5B',
  'châtain': '#8B6914',
  'chestnut': '#954535',
  'cognac': '#9A463D',
  'camel': '#C19A6B',
  'chameau': '#C19A6B',
  'taupe': '#483C32',
  'sable': '#F4A460',
  'sand': '#F4A460',
  'tan': '#D2B48C',
  'cannelle': '#D2691E',
  'cinnamon': '#D2691E',
  
  // Métalliques
  'argent': '#C0C0C0',
  'silver': '#C0C0C0',
  'argenté': '#C0C0C0',
  'bronze': '#CD7F32',
  'laiton': '#B5A642',
  'brass': '#B5A642',
  
  // Multicolores / Motifs
  'multicolore': 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)',
  'multicolor': 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)',
  'arc-en-ciel': 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)',
  'rainbow': 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)',
};

/**
 * Récupère la couleur hex pour un nom de couleur donné
 * @param colorName - Le nom de la couleur (insensible à la casse)
 * @returns Le code hex ou null si non trouvé
 */
export function getColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalizedName = colorName.toLowerCase().trim();
  
  // Recherche exacte
  if (colorMap[normalizedName]) {
    return colorMap[normalizedName];
  }
  
  // Recherche partielle (si le nom contient une couleur connue)
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Vérifie si un nom d'option correspond à une option de type couleur
 */
export function isColorOption(optionName: string): boolean {
  if (!optionName) return false;
  const normalized = optionName.toLowerCase().trim();
  return normalized === 'couleur' || normalized === 'color' || normalized === 'colour';
}
