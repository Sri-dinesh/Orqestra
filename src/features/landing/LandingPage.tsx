import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/Hero/HeroSection';
import { FeatureStorytelling } from './components/Features/FeatureStorytelling';
import { HowItWorksSection } from './components/Workflow/HowItWorksSection';
import { EngineArchitectureSection } from './components/Engine/EngineArchitectureSection';
import { EditorSection } from './components/Operations/EditorSection';
import { FacultySection } from './components/Faculty/FacultySection';
import { PresetsSection } from './components/Presets/PresetsSection';
import { DataSection } from './components/Data/DataSection';
import { FaqSection } from './components/FAQ/FaqSection';
import { FinalCTASection } from './components/CTA/FinalCTASection';
import { Footer } from './components/Footer/Footer';
import { CellDetailDrawer } from './components/Modals/CellDetailDrawer';
import { ScheduleClass } from './types/schedule';
import { initScrollTriggerAnimations } from './lib/scrollAnimations';

export function LandingPage() {
  const [inspectedClass, setInspectedClass] = useState<ScheduleClass | null>(null);

  useEffect(() => {
    const cleanup = initScrollTriggerAnimations();
    return () => {
      cleanup();
    };
  }, []);

  const scrollToDemo = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#111315] font-sans selection:bg-[#0047FF] selection:text-white flex flex-col">
      <Navbar onScrollToDemo={scrollToDemo} />

      {/* Main Content Sections Flow */}
      <main className="flex-1">
        {/* 1. Hero with honest product preview */}
        <HeroSection
          onScrollToDemo={scrollToDemo}
          onSelectClass={(item) => setInspectedClass(item)}
        />

        {/* 2. Product features */}
        <FeatureStorytelling />

        {/* 3. How it works — the real app workflow */}
        <HowItWorksSection />

        {/* 4. Scheduling engine, honestly explained */}
        <EngineArchitectureSection />

        {/* 5. Timetable editor: draft → validate → commit */}
        <EditorSection />

        {/* 6. Faculty availability, fairness, and review */}
        <FacultySection />

        {/* 7. Built-in presets */}
        <PresetsSection />

        {/* 8. Export, version history & privacy */}
        <DataSection />

        {/* 9. FAQ */}
        <FaqSection />

        {/* 10. Final CTA */}
        <FinalCTASection onScrollToDemo={scrollToDemo} />
      </main>

      <Footer />

      {/* Course Detail Inspection Drawer */}
      <CellDetailDrawer
        selectedClass={inspectedClass}
        onClose={() => setInspectedClass(null)}
      />
    </div>
  );
}
