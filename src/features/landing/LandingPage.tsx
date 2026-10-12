import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/Hero/HeroSection';
import { ComplexitySection } from './components/Complexity/ComplexitySection';
import { EngineArchitectureSection } from './components/Engine/EngineArchitectureSection';
import { InteractiveTimetable } from './components/InteractiveDemo/InteractiveTimetable';
import { FeatureStorytelling } from './components/Features/FeatureStorytelling';
import { BeforeAfterSection } from './components/Comparison/BeforeAfterSection';
import { EditorSection } from './components/Operations/EditorSection';
import { FacultySection } from './components/Faculty/FacultySection';
import { ConstraintPolicyControls } from './components/Controls/ConstraintPolicyControls';
import { ConflictDetectionDemo } from './components/ConflictDetection/ConflictDetectionDemo';
import { PresetsSection } from './components/Presets/PresetsSection';
import { DataSection } from './components/Data/DataSection';
import { HowItWorksSection } from './components/Workflow/HowItWorksSection';
import { TrustReliabilitySection } from './components/Trust/TrustReliabilitySection';
import { FinalCTASection } from './components/CTA/FinalCTASection';
import { Footer } from './components/Footer/Footer';
import { PilotModal } from './components/Modals/PilotModal';
import { CellDetailDrawer } from './components/Modals/CellDetailDrawer';
import { ScheduleClass } from './types/schedule';
import { initScrollTriggerAnimations } from './lib/scrollAnimations';

export function LandingPage() {
  const [pilotModalOpen, setPilotModalOpen] = useState(false);
  const [inspectedClass, setInspectedClass] = useState<ScheduleClass | null>(null);

  useEffect(() => {
    const cleanup = initScrollTriggerAnimations();
    return () => {
      cleanup();
    };
  }, []);

  const scrollToDemo = () => {
    const el = document.getElementById('interactive-demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#111315] font-sans selection:bg-[#0047FF] selection:text-white flex flex-col">
      {/* 3-Zone Floating Navigation Bar */}
      <Navbar
        onScrollToDemo={scrollToDemo}
      />

      {/* Main Content Sections Flow */}
      <main className="flex-1">
        {/* 1. Hero Section with Signature Scheduling Engine Visualizer */}
        <HeroSection
          onScrollToDemo={scrollToDemo}
          onSelectClass={(item) => setInspectedClass(item)}
        />

        {/* 2. Complexity & Combinatorial Explosion */}
        <ComplexitySection />

        {/* 3. "How the Engine Thinks" Architecture Flow */}
        <EngineArchitectureSection />

        {/* 4. Live Interactive Timetable Sandbox & Generator */}
        <InteractiveTimetable
          onOpenDetails={(item) => setInspectedClass(item)}
        />

        {/* 5. Institutional Realities & Operational Feature Stories */}
        <FeatureStorytelling />

        {/* 6. Before / After: Spreadsheet Chaos vs Cadence Infrastructure */}
        <BeforeAfterSection />

        {/* 7. Timetable editor: draft → validate → commit */}
        <EditorSection />

        {/* 7b. Faculty availability, fairness, and review */}
        <FacultySection />

        {/* 8. Constraint & Governance Policy Rules */}
        <ConstraintPolicyControls />

        {/* 9. Smart Conflict Detection & Autonomous Remediation */}
        <ConflictDetectionDemo />

        {/* 10. Built-in presets */}
        <PresetsSection />

        {/* 11. How it works — the real app workflow */}
        <HowItWorksSection />

        {/* 12. Export, version history & privacy */}
        <DataSection />

        {/* 13. Institutional Trust, Security & Editorial Testimonials */}
        <TrustReliabilitySection />

        {/* 14. Interactive Final Timetable CTA Canvas */}
        <FinalCTASection
          onRequestPilot={() => setPilotModalOpen(true)}
          onScrollToDemo={scrollToDemo}
        />
      </main>

      {/* Architectural Dark Minimal Footer */}
      <Footer />

      {/* Pilot Request Modal */}
      <PilotModal
        isOpen={pilotModalOpen}
        onClose={() => setPilotModalOpen(false)}
      />

      {/* Course Detail Inspection Drawer */}
      <CellDetailDrawer
        selectedClass={inspectedClass}
        onClose={() => setInspectedClass(null)}
      />
    </div>
  );
}
