'use client';

import {
  QueryClient,
  QueryClientProvider as Provider,
} from '@tanstack/react-query';
import { useState } from 'react';

export const QueryClientProvider = ({ children }: { children: any }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {},
      }),
  );

  return <Provider client={queryClient}>{children}</Provider>;
};
