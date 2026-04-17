export interface CustomerRow {
  orderId: string
  name: string
  contact: string
  location: string
  quantity: number
  unitPrice: number
  status: string
  // Per-item shipping fee (from order_items.shipping_fee).
  // null = not yet billed for this specific product.
  itemShippingFee: number | null
  // Order-level fields
  shippingNote: string | null
  momoNumber: string | null
  paymentRef: string | null
}

export interface ProductGroup {
  productId: string
  productName: string
  productImage: string | null
  trackingNumber: string | null
  supplierName: string | null
  customers: CustomerRow[]
}
