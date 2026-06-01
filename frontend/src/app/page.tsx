import DualCTA from '../components/landing/DualCTA';
import Footer from '../components/landing/Footer';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import Navbar from '../components/landing/Navbar';
import TrustBar from '../components/landing/TrustBar';
import TutorExplorer from '../components/landing/TutorExplorer';

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
