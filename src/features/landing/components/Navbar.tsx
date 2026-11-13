import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggleCompact } from '@/components/ui/ThemeSwitcher';

interface NavbarProps {
  onScrollToDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScrollToDemo }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Capabilities', href: '#features' },
    { label: 'Workflow', href: '#how-it-works' },
    { label: 'Solver Engine', href: '#engine' },
    { label: 'Presets', href: '#presets' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <div
        className={`max-w-6xl mx-auto transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-md border ${
          scrolled
            ? 'bg-[#ffffff]/90 dark:bg-[#18181a]/90 backdrop-blur-md border-[#e1e4e8] dark:border-[#2a2a2d] shadow-xs py-2 px-4 sm:px-5'
            : 'bg-[#ffffff]/70 dark:bg-[#18181a]/70 backdrop-blur-sm border-[#e1e4e8]/60 dark:border-[#2a2a2d]/60 py-2.5 px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-[#121417] dark:text-[#ececec] hover:opacity-90 transition-opacity"
          >
            <BrandLogo size={28} className="w-7 h-7 rounded-md" />
            <span className="text-base font-semibold tracking-tight text-[#121417] dark:text-[#ececec]">
              Orqestra
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#e8effc] dark:bg-[#18233a] text-[#3b6fe0] dark:text-[#7aa2f7] border border-[#3b6fe0]/20 dark:border-[#7aa2f7]/20">
              <Sparkles className="w-2.5 h-2.5" /> Workstation
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5b616b] dark:text-[#a1a1a6]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#121417] dark:hover:text-[#ececec] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Zone: Theme Toggle & Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggleCompact />

            {onScrollToDemo && (
              <button
                type="button"
                onClick={onScrollToDemo}
                className="hidden lg:inline-flex items-center px-3 py-1.5 text-xs font-medium text-[#5b616b] dark:text-[#a1a1a6] hover:text-[#121417] dark:hover:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] rounded-md transition-colors"
              >
                View Workflow
              </button>
            )}

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white dark:text-[#111112] bg-[#3b6fe0] hover:bg-[#2e5ccb] dark:bg-[#7aa2f7] dark:hover:bg-[#94b5f9] active:scale-[0.98] rounded-md transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus:ring-2 focus:ring-[#3b6fe0] dark:focus:ring-[#7aa2f7] focus:ring-offset-2"
            >
              <span>Launch Workstation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[#121417] dark:text-[#ececec] hover:bg-[#eef0f2] dark:hover:bg-[#232326] rounded-md transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-height Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[60px] z-40 bg-[#ffffff]/98 dark:bg-[#111112]/98 backdrop-blur-xl md:hidden flex flex-col justify-between p-6 border-t border-[#e1e4e8] dark:border-[#2a2a2d] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono font-medium text-[#5b616b] dark:text-[#a1a1a6] uppercase tracking-wider">
                Navigation
              </p>
              <ThemeToggleCompact />
            </div>
            <div className="flex flex-col space-y-3">
              {navLinks.map((link, idx) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="text-lg font-medium text-[#121417] dark:text-[#ececec] hover:text-[#3b6fe0] dark:hover:text-[#7aa2f7] py-2 border-b border-[#e1e4e8]/60 dark:border-[#2a2a2d]/60 transition-colors animate-in fade-in slide-in-from-bottom-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[#e1e4e8] dark:border-[#2a2a2d] space-y-3">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white dark:text-[#111112] bg-[#3b6fe0] hover:bg-[#2e5ccb] dark:bg-[#7aa2f7] dark:hover:bg-[#94b5f9] rounded-md transition-colors"
            >
              <span>Launch Workstation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-center text-xs font-mono text-[#5b616b] dark:text-[#a1a1a6]">
              Client side · 100% private · No account required
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
