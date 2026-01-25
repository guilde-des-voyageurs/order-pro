export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          name: string
          shopify_url: string
          shopify_token: string
          shopify_location_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          shopify_url: string
          shopify_token: string
          shopify_location_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          shopify_url?: string
          shopify_token?: string
          shopify_location_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_shops: {
        Row: {
          id: string
          user_id: string
          shop_id: string
          role: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_id: string
          role?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_id?: string
          role?: string
          is_default?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          shop_id: string
          shopify_id: string
          name: string
          order_number: string
          created_at: string
          cancelled_at: string | null
          display_fulfillment_status: string
          display_financial_status: string
          total_price: string
          total_price_currency: string
          note: string | null
          tags: string[]
          line_items: Json
          synced_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_id: string
          name: string
          order_number: string
          created_at: string
          cancelled_at?: string | null
          display_fulfillment_status: string
          display_financial_status: string
          total_price: string
          total_price_currency: string
          note?: string | null
          tags?: string[]
          line_items: Json
          synced_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_id?: string
          name?: string
          order_number?: string
          created_at?: string
          cancelled_at?: string | null
          display_fulfillment_status?: string
          display_financial_status?: string
          total_price?: string
          total_price_currency?: string
          note?: string | null
          tags?: string[]
          line_items?: Json
          synced_at?: string
        }
      }
      line_item_checks: {
        Row: {
          id: string
          shop_id: string
          order_id: string
          sku: string
          color: string
          size: string
          product_index: number
          quantity_index: number
          checked: boolean
          updated_at: string
        }
        Insert: {
          id: string
          shop_id: string
          order_id: string
          sku: string
          color: string
          size: string
          product_index: number
          quantity_index: number
          checked?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          order_id?: string
          sku?: string
          color?: string
          size?: string
          product_index?: number
          quantity_index?: number
          checked?: boolean
          updated_at?: string
        }
      }
      order_progress: {
        Row: {
          id: string
          shop_id: string
          order_id: string
          total_count: number
          checked_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          order_id: string
          total_count?: number
          checked_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          order_id?: string
          total_count?: number
          checked_count?: number
          updated_at?: string
        }
      }
      price_rules: {
        Row: {
          id: string
          shop_id: string
          search_string: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          search_string: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          search_string?: string
          price?: number
          created_at?: string
        }
      }
      billing_notes: {
        Row: {
          id: string
          shop_id: string
          order_id: string
          note: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          order_id: string
          note: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          order_id?: string
          note?: string
          updated_at?: string
        }
      }
      monthly_balance: {
        Row: {
          id: string
          shop_id: string
          month: string
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          month: string
          balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          month?: string
          balance?: number
          updated_at?: string
        }
      }
      syncs: {
        Row: {
          id: string
          shop_id: string
          started_at: string
          status: string
          completed_at: string | null
          orders_count: number | null
        }
        Insert: {
          id?: string
          shop_id: string
          started_at?: string
          status?: string
          completed_at?: string | null
          orders_count?: number | null
        }
        Update: {
          id?: string
          shop_id?: string
          started_at?: string
          status?: string
          completed_at?: string | null
          orders_count?: number | null
        }
      }
      order_invoices: {
        Row: {
          id: string
          shop_id: string
          order_id: string
          invoiced: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          order_id: string
          invoiced?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          order_id?: string
          invoiced?: boolean
          updated_at?: string
        }
      }
      order_costs: {
        Row: {
          id: string
          shop_id: string
          order_id: string
          costs: Json
          handling_fee: number
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          order_id: string
          costs?: Json
          handling_fee?: number
          balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          order_id?: string
          costs?: Json
          handling_fee?: number
          balance?: number
          updated_at?: string
        }
      }
      monthly_billing_notes: {
        Row: {
          id: string
          shop_id: string
          month: string
          note: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          month: string
          note: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          month?: string
          note?: string
          updated_at?: string
        }
      }
      weekly_billing_notes: {
        Row: {
          id: string
          shop_id: string
          week: string
          note: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          week: string
          note: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          week?: string
          note?: string
          updated_at?: string
        }
      }
      weekly_invoices: {
        Row: {
          id: string
          shop_id: string
          week: string
          invoiced: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          week: string
          invoiced?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          week?: string
          invoiced?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types utilitaires pour l'application
export type Shop = Database['public']['Tables']['shops']['Row']
export type ShopInsert = Database['public']['Tables']['shops']['Insert']
export type UserShop = Database['public']['Tables']['user_shops']['Row']
export type UserShopInsert = Database['public']['Tables']['user_shops']['Insert']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type LineItemCheck = Database['public']['Tables']['line_item_checks']['Row']
export type LineItemCheckInsert = Database['public']['Tables']['line_item_checks']['Insert']
export type OrderProgress = Database['public']['Tables']['order_progress']['Row']
export type PriceRule = Database['public']['Tables']['price_rules']['Row']
export type BillingNote = Database['public']['Tables']['billing_notes']['Row']
export type MonthlyBalance = Database['public']['Tables']['monthly_balance']['Row']
export type Sync = Database['public']['Tables']['syncs']['Row']
export type OrderInvoice = Database['public']['Tables']['order_invoices']['Row']
export type OrderCost = Database['public']['Tables']['order_costs']['Row']
export type MonthlyBillingNote = Database['public']['Tables']['monthly_billing_notes']['Row']
export type WeeklyBillingNote = Database['public']['Tables']['weekly_billing_notes']['Row']
export type WeeklyInvoice = Database['public']['Tables']['weekly_invoices']['Row']

// Type pour les line items (JSON)
export interface LineItem {
  id: string
  title: string
  quantity: number
  refundableQuantity: number
  price: string
  sku: string | null
  variantTitle: string | null
  vendor: string | null
  productId: string | null
  requiresShipping: boolean
  taxable: boolean
  image: { url: string; altText: string | null } | null
  unitCost: number | null
  totalCost: number | null
  isCancelled: boolean
  variant: {
    id: string
    title: string
    selectedOptions?: { name: string; value: string }[]
    metafields?: {
      namespace: string
      key: string
      value: string
      type: string
    }[]
  } | null
}
