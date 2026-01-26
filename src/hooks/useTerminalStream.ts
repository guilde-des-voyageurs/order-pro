'use client';

import { useCallback } from 'react';
import { useTerminal, TerminalAction } from '@/contexts/TerminalContext';

export function useTerminalStream() {
  const terminal = useTerminal();

  const streamFromUrl = useCallback(async (
    url: string,
    options?: {
      title?: string;
      onComplete?: () => void;
      actions?: TerminalAction[];
    }
  ) => {
    terminal.startSync(options?.title || 'Synchronisation');

    try {
      const response = await fetch(url);
      
      if (!response.body) {
        terminal.log('❌ Erreur: Pas de réponse du serveur', 'error');
        terminal.endSync();
        return false;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.message === 'DONE') {
              terminal.endSync(options?.actions);
              options?.onComplete?.();
              return true;
            } else if (data.message) {
              terminal.log(data.message, data.type || 'info');
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      terminal.endSync(options?.actions);
      options?.onComplete?.();
      return true;
    } catch (err) {
      terminal.log(`❌ Erreur: ${err}`, 'error');
      terminal.endSync();
      return false;
    }
  }, [terminal]);

  return {
    ...terminal,
    streamFromUrl,
  };
}
