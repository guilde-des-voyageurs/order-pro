export const TEST_QUERY = `
  query {
    shop {
      name
      primaryDomain {
        url
      }
    }
  }
`;

export const ORDERS_QUERY = `
query {
  orders(
    first: 30, 
    sortKey: CREATED_AT, 
    reverse: true,
    query: "created_at:>='2025-04-29' NOT name:'#1366' NOT name:'#1336' NOT name:'#1412'"
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
            id
            title
            metafields(first: 20) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
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
}
`;
