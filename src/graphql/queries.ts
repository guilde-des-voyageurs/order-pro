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
    first: 10, 
    sortKey: CREATED_AT, 
    reverse: true,
    query: "created_at:>='2025-01-16' AND (financial_status:active OR financial_status:paid OR financial_status:partially_paid OR financial_status:partially_refunded OR financial_status:pending)"
  ) {
    nodes {
      id
      name
      createdAt
      displayFulfillmentStatus
      displayFinancialStatus
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
