import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onScrollToDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScrollToDemo }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Engine', href: '#engine' },
    { label: 'Editor', href: '#editor' },
    { label: 'Presets', href: '#presets' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div
        className={`max-w-7xl mx-auto transition-all duration-300 rounded-md ${
          scrolled
            ? 'bg-[#f6f7f8]/95 backdrop-blur-md border border-[#e1e4e8] py-2.5 px-4 sm:px-6'
            : 'bg-transparent py-2 px-2'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Zone 1: wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#121417] hover:opacity-90 transition-opacity"
          >
            <span className="w-8 h-8 rounded-md bg-[#121417] text-white flex items-center justify-center font-mono text-sm font-semibold tracking-tighter">
              O
            </span>
            <span className="text-xl font-bold tracking-tight text-[#121417]">
              Orqestra
            </span>
          </Link>

          {/* Zone 2: product navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5b616b]">
            <Link
              to="/dashboard"
              className="hover:text-[#121417] transition-colors relative py-1 text-[13px] tracking-wide"
            >
              Dashboard
            </Link>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#121417] transition-colors relative py-1 text-[13px] tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: primary actions */}
          <div className="hidden sm:flex items-center gap-3">
            {onScrollToDemo && (
              <button
                onClick={onScrollToDemo}
                className="px-3.5 py-2 text-xs font-medium text-[#5b616b] hover:text-[#121417] hover:bg-[#eef0f2] rounded-md transition-colors whitespace-nowrap"
              >
                See how it works
              </button>
            )}
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#3b6fe0] hover:bg-[#2e5ccb] rounded-md transition-all duration-150 whitespace-nowrap shadow-none"
            >
              <span>Open app</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#121417] hover:bg-[#eef0f2] rounded-md transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#e1e4e8] pb-2 space-y-2">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#121417] hover:bg-[#eef0f2] rounded-md transition-colors"
            >
              Dashboard
            </Link>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-[#5b616b] hover:bg-[#eef0f2] hover:text-[#121417] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-medium text-white bg-[#3b6fe0] hover:bg-[#2e5ccb] rounded-md"
              >
                Open app
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
