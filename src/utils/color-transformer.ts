export function transformColor(color: string): string {
  switch (color.toLowerCase()) {
    case 'bleu azur':
      return 'Bleu Azur (Stargazer)';
    case 'bleu marine':
      return 'Bleu Marine (French Navy)';
    case 'ecru':
      return 'Ecru (Raw)';
    case 'bleu nuit':
      return 'Bleu Nuit (Green Bay)';
    case 'bordeaux':
      return 'Bordeaux (Burgundy)';
    case 'crème':
      return 'Crème (Cream)';
    case 'kaki':
      return 'Kaki (Khaki)';
    case 'terra cotta':
      return 'Terra Cotta (Heritage Brown)';
    case 'vert forêt':
      return 'Vert Forêt (Glazed Green)';
    case 'vert antique':
      return 'Vert Antique (Bottle Green)';
    case 'prune':
      return 'Prune (Red Brown)';
    case 'bleu indien':
      return 'Bleu Indien (India Ink Grey)';
      
    default:
      return color;
  }
}
