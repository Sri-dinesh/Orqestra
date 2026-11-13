import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/Hero/HeroSection';
import { ProblemSolutionSection } from './components/Problem/ProblemSolutionSection';
import { TaglineRevealSection } from './components/Tagline/TaglineRevealSection';
import { FeatureStorytelling } from './components/Features/FeatureStorytelling';
import { HowItWorksSection } from './components/Workflow/HowItWorksSection';
import { EngineArchitectureSection } from './components/Engine/EngineArchitectureSection';
import { PresetsSection } from './components/Presets/PresetsSection';
import { FaqSection } from './components/FAQ/FaqSection';
import { FinalCTASection } from './components/CTA/FinalCTASection';
import { Footer } from './components/Footer/Footer';
import { CellDetailDrawer } from './components/Modals/CellDetailDrawer';
import { ScheduleClass } from './types/schedule';

export function LandingPage() {
  const [inspectedClass, setInspectedClass] = useState<ScheduleClass | null>(null);

  const scrollToWorkflow = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-theme min-h-screen bg-[#f6f7f8] text-[#121417] font-sans selection:bg-[#3b6fe0] selection:text-white flex flex-col">
      {/* Floating Modern Header */}
      <Navbar onScrollToDemo={scrollToWorkflow} />

      {/* Main Product Launch Storyline */}
      <main className="flex-1">
        {/* 1. Hero with Live Interactive Schedule Specimen */}
        <HeroSection
          onScrollToDemo={scrollToWorkflow}
          onSelectClass={(item) => setInspectedClass(item)}
        />

        {/* 2. Problem to Solution: Manual Spreadsheets vs Orqestra Solver */}
        <ProblemSolutionSection />

        {/* 3. Mandatory B11 Tagline Reveal (Word-by-word scroll transition) */}
        <TaglineRevealSection />

        {/* 4. Core Outcome-Driven Benefits (5 Pillars + Architecture Bento) */}
        <FeatureStorytelling />

        {/* 5. How It Works: 3 Decisive Steps + Full Packing Guarantee */}
        <HowItWorksSection />

        {/* 6. Scheduling Engine Pipeline: Transparent Constraint Architecture */}
        <EngineArchitectureSection />

        {/* 7. Institutional Blueprints: Prebuilt Accredited Structures */}
        <PresetsSection />

        {/* 8. Frequently Asked Questions: Institutional Objection Busters */}
        <FaqSection />

        {/* 9. Final Decisive Call to Action with Risk Reversal */}
        <FinalCTASection onScrollToDemo={scrollToWorkflow} />
      </main>

      {/* Structured Modern Footer */}
      <Footer />

      {/* Interactive Course Detail Inspection Drawer */}
      <CellDetailDrawer
        selectedClass={inspectedClass}
        onClose={() => setInspectedClass(null)}
      />
    </div>
  );
}
