interface ColorMapping {
  internalName: string;
}

// Mapping statique par défaut (fallback si Supabase non disponible)
export const colorMappings: { [key: string]: ColorMapping } = {
  'Bleu Azur': { internalName: 'Stargazer' },
  'Bleu Marine': { internalName: 'French Navy' },
  'Blanc ancien': { internalName: 'Vintage white' },
  'Ecru': { internalName: 'Raw' },
  'Bleu Nuit': { internalName: 'Green Bay' },
  'Bordeaux': { internalName: 'Burgundy' },
  'Crème': { internalName: 'Cream' },
  'Nocturne': { internalName: 'Dusk' },
  'Kaki': { internalName: 'Khaki' },
  'Terra Cotta': { internalName: 'Heritage Brown' },
  'Vert Forêt': { internalName: 'Glazed Green' },
  'Vert Antique': { internalName: 'Bottle Green' },
  'Prune': { internalName: 'Red Brown' },
  'Chocolat': { internalName: 'Mocha' },
  'Bleu Indien': { internalName: 'India Ink Grey' },
  'Noir': { internalName: 'Black' },
  'Mocha': { internalName: 'Mocha' }
};

// Cache pour les mappings dynamiques depuis Supabase
let dynamicColorMappings: { [key: string]: ColorMapping } | null = null;

/**
 * Charge les mappings de couleurs depuis Supabase
 */
export async function loadColorMappingsFromSupabase(shopId: string): Promise<void> {
  try {
    const response = await fetch(`/api/settings?shopId=${shopId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.colorRules && data.colorRules.length > 0) {
        dynamicColorMappings = {};
        data.colorRules.forEach((rule: { color_name: string; hex_value: string }) => {
          // color_name = français, hex_value = anglais (dans le contexte des mappings)
          dynamicColorMappings![rule.color_name] = { internalName: rule.hex_value };
        });
      }
    }
  } catch (err) {
    console.error('Error loading color mappings from Supabase:', err);
  }
}

/**
 * Retourne les mappings actifs (dynamiques si disponibles, sinon statiques)
 */
export function getActiveColorMappings(): { [key: string]: ColorMapping } {
  return dynamicColorMappings || colorMappings;
}

/**
 * Transforme le nom d'une couleur en ajoutant son nom interne
 * @param color - Le nom de la couleur à transformer
 * @returns Le nom formaté avec le nom interne entre parenthèses
 */
export function transformColor(color: string): string {
  if (!color) return 'Sans couleur';
  
  const activeMappings = getActiveColorMappings();
  
  // Chercher une correspondance directe
  if (activeMappings[color]) {
    return activeMappings[color].internalName;
  }

  // Nettoyer la couleur (enlever les parenthèses et leur contenu)
  const cleanColor = color.replace(/\s*\([^)]*\)/g, '').trim();

  // Chercher une correspondance avec la couleur nettoyée
  if (activeMappings[cleanColor]) {
    return activeMappings[cleanColor].internalName;
  }

  // Si toujours pas de correspondance, essayer avec la normalisation
  const normalizedInput = cleanColor.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const foundColor = Object.entries(activeMappings).find(([key]) => {
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
  
  const activeMappings = getActiveColorMappings();
  
  // Chercher la correspondance inverse (anglais → français)
  const foundEntry = Object.entries(activeMappings).find(([_, mapping]) => 
    mapping.internalName.toLowerCase() === englishColor.toLowerCase()
  );
  
  if (foundEntry) {
    return foundEntry[0]; // Retourner le nom français
  }
  
  // Si pas de correspondance, retourner la couleur telle quelle
  return englishColor;
}
