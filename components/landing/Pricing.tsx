import Link from 'next/link'
import { Check, Zap, Crown, Gift, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    icon: Gift,
    price: 0,
    priceLabel: 'GH₵0',
    period: 'forever',
    description: 'Perfect for getting started with your first store.',
    cta: 'Get started free',
    ctaHref: '/register',
    highlighted: false,
    features: [
      'Up to 200 products',
      '50 orders per month',
      '50 customers',
      'Customer storefront',
      'MoMo payment tracking',
      'Basic analytics',
      'Basic support',
    ],
  },
  {
    name: 'Pro',
    icon: Zap,
    price: 199,
    priceLabel: 'GH₵199',
    period: 'per month',
    description: 'For growing importers who need more power.',
    cta: 'Start Pro',
    ctaHref: '/register',
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Up to 500 products',
      '200 orders per month',
      '100 customers',
      'Customer storefront',
      'MoMo payment tracking',
      'WhatsApp billing',
      'Full analytics & finances',
      'Pre-order management',
      'Priority support',
    ],
  },
  {
    name: 'Business',
    icon: Crown,
    price: 499,
    priceLabel: 'GH₵499',
    period: 'per month',
    description: 'For high-volume importers running at scale.',
    cta: 'Start Business',
    ctaHref: '/register',
    highlighted: false,
    features: [
      'Everything in Pro',
      'Unlimited products',
      'Unlimited orders',
      'Unlimited customers',
      'Advanced analytics',
      'Shipment reconciliation',
      'Pre-order management',
      'Dedicated support',
      'Early access to features',
    ],
  },
]

const iconStyles: Record<string, { bg: string; color: string }> = {
  Free:     { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  Pro:      { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  Business: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
}

export default function Pricing() {
  return (
    <section
      id="pricing"
      style={{ background: '#0A0F18' }}
      className="px-4 py-20 sm:py-28 relative overflow-hidden"
    >
      {/* Background glows */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: 600, height: 300, background: 'rgba(37,99,235,0.06)', filter: 'blur(100px)', transform: 'translateX(-50%)' }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Simple pricing</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Start free.
            <br />
            <span className="text-slate-400">Scale when you&apos;re ready.</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            No hidden fees, no surprises. Pay in GH₵, cancel anytime.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon
            const ic = iconStyles[plan.name]
            return (
              <div
                key={plan.name}
                className="relative rounded-2xl p-7 flex flex-col gap-6 transition-all duration-300"
                style={{
                  border: plan.highlighted
                    ? '1px solid rgba(59,130,246,0.45)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: plan.highlighted
                    ? 'rgba(59,130,246,0.07)'
                    : 'rgba(255,255,255,0.03)',
                  boxShadow: plan.highlighted
                    ? '0 0 0 1px rgba(59,130,246,0.15), 0 20px 40px rgba(59,130,246,0.08)'
                    : 'none',
                  transform: plan.highlighted ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: '#3b82f6', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
                    >
                      <Zap className="h-3 w-3" /> {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div>
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                    style={{ background: ic.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: ic.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-white tabular-nums">{plan.priceLabel}</span>
                  <span className="text-sm text-slate-500 mb-1.5">
                    {plan.price > 0 ? `/${plan.period}` : plan.period}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200"
                  style={
                    plan.highlighted
                      ? { background: '#3b82f6', color: '#fff' }
                      : plan.name === 'Business'
                      ? { border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#fcd34d' }
                      : { border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }
                  }
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                {/* Features */}
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check
                        className="h-4 w-4 shrink-0 mt-0.5"
                        style={{ color: plan.highlighted ? '#60a5fa' : '#64748b' }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-10" style={{ color: 'rgba(255,255,255,0.2)' }}>
          All plans include MoMo payment tracking, customer storefront, and WhatsApp billing. Upgrade or downgrade at any time.
        </p>
      </div>
    </section>
  )
}