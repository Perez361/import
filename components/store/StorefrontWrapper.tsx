'use client'

import { StoreProvider } from './StoreContext'
import { CartProvider } from './CartContext'

interface StorefrontWrapperProps {
  children: React.ReactNode
  slug: string
}

export function StorefrontWrapper({ children, slug }: StorefrontWrapperProps) {
  return (
    <StoreProvider initialSlug={slug}>
      <CartProvider slug={slug}>
        {children}
      </CartProvider>
    </StoreProvider>
  )
}

