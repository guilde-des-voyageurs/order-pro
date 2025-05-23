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
    first: 50, 
    sortKey: CREATED_AT, 
    reverse: true
  ) {
    nodes {
      id
      name
      createdAt
      cancelledAt
      displayFulfillmentStatus
      displayFinancialStatus
      note
      tags
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
