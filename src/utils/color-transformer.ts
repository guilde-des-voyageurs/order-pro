export function transformColor(color: string): string {
  switch (color.toLowerCase()) {
    case 'bleu azur':
      return 'Bleu Azur (Stargazer)';
    case 'bleu marine':
      return 'Bleu Marine (French Navy)';
    case 'ecru':
      return 'Ecru (Raw)';
    case 'bleu nuit':
      return 'Noir (Black)';
    case 'bleu nuit':
      return 'Bleu nuit (Green Bay)';
    case 'bordeaux':
      return 'Bordeaux (Burgundy)';
    case 'crème':
      return 'Crème (Burgundy)';
    case 'kaki':
      return 'Kaki';
    case 'terra cotta':
      return 'Terra Cotta (Heritage Brown)';
    case 'vert forêt':
      return 'Vert forêt (Glazed Green)';
    case 'vert antique':
      return 'Vert antique (Bottle Green)';
    case 'prune':
      return 'Prune (Red Brown)';
    case 'bleu indien':
      return 'bleu indien (India Ink Grey)';
      
    default:
      return color;
  }
}
