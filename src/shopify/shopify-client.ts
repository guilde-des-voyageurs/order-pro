import { createAdminApiClient } from '@shopify/admin-api-client';

export const shopifyClient = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_URL!,
  apiVersion: '2024-04',
  accessToken: process.env.SHOPIFY_TOKEN!,
});
