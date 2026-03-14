'use client'

import { StoreProvider } from './StoreContext'
import { CartProvider } from './CartContext'

import { InitialCustomer } from '@/lib/auth/store-session'

interface StorefrontWrapperProps {
  children: React.ReactNode
  slug: string
  initialCustomer?: InitialCustomer
}

export function StorefrontWrapper({ children, slug, initialCustomer }: StorefrontWrapperProps) {
  return (
    <StoreProvider initialSlug={slug} initialCustomer={initialCustomer}>
      <CartProvider slug={slug}>
        {children}
      </CartProvider>
    </StoreProvider>
  )
}

