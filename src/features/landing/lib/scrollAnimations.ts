import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const initScrollTriggerAnimations = (): (() => void) => {
  // Check user preference for reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return () => {};
  }

  // Create GSAP context for clean garbage collection on component unmount
  const ctx = gsap.context(() => {
    // 1. Reveal all major sections with 'y: 50, opacity: 0' fading in as requested
    const animatedSections = document.querySelectorAll<HTMLElement>('.gsap-section-reveal');
    animatedSections.forEach((section) => {
      gsap.fromTo(
        section,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'top 40%',
            toggleActions: 'play none none none',
            once: true,
          },
        }
      );
    });

    // 2. Pinning the 'Engine Architecture' section during the user's scroll journey
    const architectureSection = document.querySelector<HTMLElement>('#architecture');
    const architectureDiagram = document.querySelector<HTMLElement>('#engine-architecture-diagram');

    // Only apply pinning on larger desktop viewports (min-width: 1024px and sufficient height)
    // to prevent mobile viewport traps or content clipping
    const isDesktop = window.innerWidth >= 1024 && window.innerHeight >= 720;

    if (architectureSection && architectureDiagram && isDesktop) {
      // Timeline that pins the Engine Architecture and visually scrubs through constraint solving
      const archTl = gsap.timeline({
        scrollTrigger: {
          trigger: architectureSection,
          start: 'top top+=70',
          end: '+=650',
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.8,
        },
      });

      // Stage A: Sequential highlight of institutional input constraints
      archTl.fromTo(
        '.engine-input-node',
        { opacity: 0.7, scale: 0.98 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.15,
          duration: 1,
          ease: 'power2.out',
        }
      );

      // Stage B: Central Cadence Solver Kernel activation pulse
      archTl.to(
        '.engine-core-solver',
        {
          scale: 1.04,
          boxShadow: '0 20px 35px -10px rgba(0, 71, 255, 0.35)',
          duration: 1.2,
          ease: 'power2.inOut',
        },
        '-=0.5'
      );

      // Stage C: Verified output artifacts snap into confirmed state
      archTl.fromTo(
        '.engine-output-node',
        { opacity: 0.7, x: 10 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.2,
          duration: 1,
          ease: 'power2.out',
        },
        '-=0.4'
      );
    }

    // 3. Complexity numbers equation counter reveal
    const equationBanner = document.querySelector<HTMLElement>('#complexity-equation');
    if (equationBanner) {
      gsap.fromTo(
        equationBanner.children,
        {
          y: 35,
          scale: 0.92,
          opacity: 0,
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: equationBanner,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }

    // 4. Staggered card containers reveal with 'y: 40, opacity: 0'
    const staggerContainers = document.querySelectorAll<HTMLElement>('.gsap-stagger-container');
    staggerContainers.forEach((container) => {
      const items = container.querySelectorAll('.gsap-stagger-item');
      if (items.length > 0) {
        gsap.fromTo(
          items,
          {
            opacity: 0,
            y: 40,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 82%',
              once: true,
            },
          }
        );
      }
    });

    // 5. Analytics occupancy histogram bars animation on scroll
    const analyticsBars = document.querySelectorAll<HTMLElement>('.analytics-bar-fill');
    if (analyticsBars.length > 0) {
      analyticsBars.forEach((bar) => {
        const targetWidth = bar.getAttribute('data-width') || '70%';
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: targetWidth,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 90%',
              once: true,
            },
          }
        );
      });
    }

    // 6. Final CTA floating cards subtle scroll parallax
    const floatingCtaCards = document.querySelectorAll<HTMLElement>('.gsap-parallax-float');
    floatingCtaCards.forEach((card, index) => {
      const direction = index % 2 === 0 ? 35 : -35;
      gsap.fromTo(
        card,
        { y: direction },
        {
          y: -direction,
          ease: 'none',
          scrollTrigger: {
            trigger: card.parentElement || card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        }
      );
    });
  });

  return () => {
    ctx.revert();
  };
};
