export const TEST_QUERY = Buffer.from(`
  query {
    shop {
      name
      primaryDomain {
        url
      }
    }
  }
`);

export const ORDERS_QUERY = Buffer.from(`
query {
  orders(
    first: 200, 
    sortKey: CREATED_AT, 
    reverse: true,
    query: "created_at:>='2025-05-07' NOT name:'#1366' NOT name:'#1336' NOT name:'#1412'"
  ) {
    nodes {
      id
      name
      createdAt
      cancelledAt
      displayFulfillmentStatus
      displayFinancialStatus
      note
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 50) {
        nodes {
          id
          title
          quantity
          refundableQuantity
          originalUnitPriceSet {
            shopMoney {
              amount
            }
          }
          sku
          variant {
            title
            inventoryItem {
              unitCost {
                amount
              }
            }
          }
          product {
            vendor
            id
          }
          requiresShipping
          taxable
          image {
            url
            altText
          }
        }
      }
    }
  }
}`);
