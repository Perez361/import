import {
  Package2, ClipboardList, Truck, Users, BarChart2,
  Smartphone, DollarSign, MessageCircle, ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const features = [
  {
    icon: Package2,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    iconColor: 'text-blue-400',
    title: 'Product & Pre-order Management',
    description: 'List products with supplier details and tracking numbers. Customers pre-order directly from your store link.',
  },
  {
    icon: DollarSign,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    title: 'Two-Stage MoMo Payments',
    description: 'Collect product payment upfront, then bill shipping separately once goods arrive. Every transaction tracked.',
  },
  {
    icon: Truck,
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    iconColor: 'text-purple-400',
    title: 'Shipment Batches & Reconciliation',
    description: 'Group shipments into batches, cross-check your tracking list against the freight manifest, catch missing items.',
  },
  {
    icon: MessageCircle,
    color: 'from-green-500/20 to-green-600/10 border-green-500/20',
    iconColor: 'text-green-400',
    title: 'WhatsApp Billing',
    description: 'One tap sends a pre-filled WhatsApp message to your customer with their shipping bill and MoMo instructions.',
  },
  {
    icon: Smartphone,
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
    iconColor: 'text-cyan-400',
    title: 'Customer Storefront',
    description: 'Share your unique store link. Customers browse, order, track their items and confirm payments — all self-service.',
  },
  {
    icon: BarChart2,
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    iconColor: 'text-amber-400',
    title: 'Analytics & Finances',
    description: 'Revenue breakdowns splitting product vs. shipping income, order funnels, top products, and monthly trends.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Create your store',
    body: 'Sign up in 2 minutes. Add your products with prices and supplier details. Share your store link with customers.',
  },
  {
    num: '02',
    title: 'Collect pre-orders',
    body: 'Customers browse, add to cart, and pay the product price via MoMo. You get notified instantly.',
  },
  {
    num: '03',
    title: 'Order & ship',
    body: 'Order from your supplier. Track the shipment. When goods arrive, add the shipping fee and bill the customer.',
  },
  {
    num: '04',
    title: 'Get paid & deliver',
    body: 'Customer pays shipping via MoMo. You verify, mark as delivered. Done — rinse and repeat at scale.',
  },
]

export default function Features() {
  return (
    <>
      {/* Features section */}
      <section id="features" className="bg-[#080C14] px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">

          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              One platform.
              <br />
              <span className="text-slate-400">Zero spreadsheets.</span>
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
              Every tool a mini-importer needs, designed to work together seamlessly.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, color, iconColor, title, description }) => (
              <div
                key={title}
                className={`relative rounded-2xl border bg-gradient-to-br p-6 ${color} hover:-translate-y-1 transition-all duration-300 group`}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="bg-[#060A10] px-4 py-20 sm:py-28 relative overflow-hidden">
        {/* Background accent */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <div className="h-[600px] w-[600px] rounded-full border-[60px] border-white/80" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Simple process</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, title, body }, i) => (
              <div key={num} className="relative flex flex-col">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-blue-500/40 to-transparent -translate-x-8 z-10" />
                )}
                <div className="rounded-2xl border border-white/6 bg-white/3 p-6 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 flex-1">
                  <span className="text-4xl font-black text-white/8 mb-3 block leading-none">{num}</span>
                  <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust pills */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
            {[
              '✓ No credit card required',
              '✓ Set up in under 5 minutes',
              '✓ MoMo-native',
              '✓ Works on any phone',
            ].map((item) => (
              <span key={item} className="text-xs text-slate-500 font-medium">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / social proof strip */}
      <section className="bg-[#080C14] border-t border-white/5 px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/8 bg-white/3 p-8 sm:p-12 relative overflow-hidden">
            {/* Quote mark */}
            <div className="absolute -top-4 -left-2 text-[120px] font-black text-blue-500/10 leading-none select-none">"</div>
            <blockquote className="relative">
              <p className="text-lg sm:text-xl font-medium text-white/80 leading-relaxed mb-6">
                Before ImportFlow I was managing orders in WhatsApp groups and Excel sheets. Now everything is in one place — my customers love having their own login to track their orders.
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white">A</div>
                <div>
                  <p className="text-sm font-semibold text-white">Ama D.</p>
                  <p className="text-xs text-slate-500">Mini-importer, Accra</p>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>
    </>
  )
}