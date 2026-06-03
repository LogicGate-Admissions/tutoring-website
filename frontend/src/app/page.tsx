/**
 * File purpose: Next.js route entry file. Keep this thin and delegate product logic to domains/.
 */

import DualCTA from '@/domains/landing/components/DualCTA';
import Footer from '@/domains/landing/components/Footer';
import HeroSection from '@/domains/landing/components/HeroSection';
import HowItWorks from '@/domains/landing/components/HowItWorks';
import Navbar from '@/domains/landing/components/Navbar';
import TrustBar from '@/domains/landing/components/TrustBar';
import TutorExplorer from '@/domains/landing/components/TutorExplorer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <TutorExplorer />
        <HowItWorks />
        <DualCTA />
      </main>
      <Footer />
    </>
  );
}
