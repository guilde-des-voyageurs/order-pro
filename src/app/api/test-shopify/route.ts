'use server';

import { createAdminApiClient } from '@shopify/admin-api-client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Shopify connection with:', {
      url: process.env.SHOPIFY_URL,
      hasToken: !!process.env.SHOPIFY_TOKEN
    });

    const shopifyClient = createAdminApiClient({
      storeDomain: process.env.SHOPIFY_URL!,
      apiVersion: '2024-01',
      accessToken: process.env.SHOPIFY_TOKEN!,
    });

    // Test query to get shop info
    const testQuery = `
      query {
        shop {
          name
          primaryDomain {
            url
          }
        }
      }
    `;

    const result = await shopifyClient.request(testQuery);
    console.log('Shop info:', result);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error testing Shopify connection:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
