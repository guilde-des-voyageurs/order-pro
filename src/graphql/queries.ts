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
    first: 100, 
    sortKey: CREATED_AT, 
    reverse: true,
    query: "created_at:>='2025-01-16' NOT name:'#1366' NOT name:'#1336'"
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
      customer {
        firstName
        lastName
        email
      }
      shippingAddress {
        address1
        address2
        city
        zip
        countryCode
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
