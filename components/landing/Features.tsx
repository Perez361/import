import { Package2, ClipboardList, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Package2,
    title: 'Product Management',
    description:
      'Organize your product catalog, track inventory levels, and manage pricing — all from a single clean dashboard.',
  },
  {
    icon: ClipboardList,
    title: 'Order Tracking',
    description:
      'Keep track of every customer order from placement to delivery with real-time status updates and history.',
  },
  {
    icon: Truck,
    title: 'Shipment Tracking',
    description:
      'Monitor your shipments from origin to destination and keep customers informed every step of the way.',
  },
]

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 sm:gap-5 sm:p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--color-brand-light) sm:h-12 sm:w-12">
        <Icon className="h-5 w-5 text-(--color-brand) sm:h-6 sm:w-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-(--color-text-primary) sm:text-lg">{title}</h3>
        <p className="text-sm leading-relaxed text-(--color-text-muted)">{description}</p>
      </div>
    </div>
  )
}

export default function Features() {
  return (
    <section className="bg-(--color-surface) px-4 py-14 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-10 text-center sm:mb-16">
          <h2 className="text-2xl font-bold text-(--color-text-primary) sm:text-3xl lg:text-4xl">
            Everything you need to run your imports
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-(--color-text-muted) sm:mt-4 sm:text-base">
            Purpose-built tools for mini-importers to stay organised, save time, and grow faster.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
