import React, { useState } from 'react';
import { X, CheckCircle2, Shield, ArrowRight, Building, Mail, User } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PilotModal: React.FC<PilotModalProps> = ({ isOpen, onClose }) => {
  const [institutionName, setInstitutionName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [studentCount, setStudentCount] = useState('2,500 – 10,000');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim() || !email.trim()) {
      setError('Please provide institution name and official academic email.');
      return;
    }
    setError('');
    setSubmitted(true);
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#0047FF', '#10B981'],
      });
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setInstitutionName('');
    setContactName('');
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white border border-[#E5E8E0] shadow-2xl p-6 sm:p-8 relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#71767B] hover:text-[#111315] hover:bg-black/5 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0047FF] uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>INSTITUTIONAL PILOT PROGRAM</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#111315] mb-2">
              Schedule with Cadence
            </h3>
            <p className="text-xs text-[#4B5259] mb-6 leading-relaxed">
              Experience conflict-free automated scheduling on your actual historical curriculum and room constraints.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#111315] mb-1">
                  Institution Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#71767B] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanford University / Royal College"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E8E0] focus:border-[#0047FF] focus:outline-hidden text-xs text-[#111315]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111315] mb-1">
                  Academic Registrar or Coordinator Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#71767B] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Bell"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E8E0] focus:border-[#0047FF] focus:outline-hidden text-xs text-[#111315]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111315] mb-1">
                  Official Institutional Email (.edu / .ac / org)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71767B] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E8E0] focus:border-[#0047FF] focus:outline-hidden text-xs text-[#111315]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111315] mb-1">
                  Student Enrollment Scale
                </label>
                <select
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E8E0] focus:border-[#0047FF] focus:outline-hidden text-xs text-[#111315] bg-white"
                >
                  <option value="Under 1,000 (School / Academy)">Under 1,000 (School / Academy)</option>
                  <option value="1,000 – 5,000 (Collegiate)">1,000 – 5,000 (Collegiate)</option>
                  <option value="5,000 – 25,000 (Comprehensive University)">5,000 – 25,000 (Comprehensive University)</option>
                  <option value="25,000+ (Multi-Campus Academic System)">25,000+ (Multi-Campus Academic System)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 text-xs font-semibold text-white bg-[#0047FF] hover:bg-[#0038CC] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Submit Pilot Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#111315]">
              Pilot Request Received
            </h3>
            <p className="text-xs text-[#4B5259] max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="font-semibold text-[#111315]">{contactName || 'Colleague'}</span>.
              A senior implementation architect will contact <span className="font-semibold text-[#111315]">{email}</span> within 24 hours to configure your test dataset.
            </p>
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 text-xs font-semibold text-[#111315] bg-[#FAFBF9] border border-[#E5E8E0] hover:bg-[#F1F3ED] rounded-xl transition-all"
              >
                Close & Return to Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
