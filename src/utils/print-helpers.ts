import type { ShopifyOrder } from '@/types/shopify';

interface PrintOptions {
  content: string;
}

export function printInIframe({ content }: PrintOptions): void {
  // Créer un iframe temporaire
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.srcdoc = content;
  
  // Attendre que l'iframe soit chargé avant d'imprimer
  iframe.onload = () => {
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = () => {
        document.body.removeChild(iframe);
      };
      
      iframe.contentWindow.print();
    }
  };

  document.body.appendChild(iframe);
}
