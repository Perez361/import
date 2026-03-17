export interface CustomerRow {
  orderId: string
  name: string
  contact: string
  location: string
  quantity: number
  unitPrice: number
  status: string
  shippingFee: number | null
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