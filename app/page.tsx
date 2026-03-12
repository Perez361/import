import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import FinalCTA from '@/components/landing/FinalCTA'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <FinalCTA />
    </main>
  )
}
