import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Pricing from '@/components/landing/Pricing'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main className="bg-[#080C14]">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  )
}