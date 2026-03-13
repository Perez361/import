import { ReactNode } from 'react'
import { Toaster } from 'sonner'

export default function StoreLayout({
  children,
  cart
}: {
  children: ReactNode
  cart?: ReactNode
}) {
  return (
    <div>
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
}

