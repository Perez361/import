import { ReactNode } from 'react'

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
    </div>
  )
}

