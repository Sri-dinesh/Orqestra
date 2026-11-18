'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  BookOpen,
  DoorOpen,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  GraduationCap,
  Grid3X3,
  X,
  Layers,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useTheme } from '@/hooks/useTheme';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Departments' | 'Active Department' | 'Actions' | 'Theme';
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  badge?: string;
  action: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSemesterModal?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenSemesterModal,
}) => {
  const navigate = useNavigate();
  const state = useWorkspaceStore();
  const { theme, setTheme } = useTheme();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened and reset search
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const activeDept = useMemo(() => {
    return state.departments.find((d) => d.id === state.activeDepartmentId) ?? state.departments[0] ?? null;
  }, [state.departments, state.activeDepartmentId]);

  // Build the complete command catalogue
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // 1. General Navigation
    list.push(
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        subtitle: 'Overview of departments, timetables & operational readiness',
        category: 'Navigation',
        icon: LayoutDashboard,
        keywords: ['home', 'overview', 'main', 'start'],
        action: () => navigate('/dashboard'),
      },
      {
        id: 'nav-departments',
        title: 'All Departments',
        subtitle: 'Manage institution departments and active curriculums',
        category: 'Navigation',
        icon: Building2,
        keywords: ['depts', 'branches', 'engineering', 'school'],
        action: () => navigate('/departments'),
      },
      {
        id: 'nav-schedule-portal',
        title: 'My Schedule Portal',
        subtitle: 'Personal faculty & student schedule notice board',
        category: 'Navigation',
        icon: GraduationCap,
        keywords: ['portal', 'faculty view', 'student view', 'read only', 'public'],
        action: () => navigate('/schedule-portal'),
      },
      {
        id: 'nav-team',
        title: 'Team & Access Control',
        subtitle: 'Manage administrators, HODs, faculty members and roles',
        category: 'Navigation',
        icon: Users,
        keywords: ['rbac', 'roles', 'users', 'members', 'permissions', 'invite'],
        action: () => navigate('/team'),
      },
      {
        id: 'nav-settings',
        title: 'Institution Settings',
        subtitle: 'Configure college crest, academic year & defaults',
        category: 'Navigation',
        icon: Settings,
        keywords: ['config', 'college name', 'profile', 'preferences'],
        action: () => navigate('/settings'),
      },
    );

    // 2. Active Department contextual views (if any department exists)
    if (activeDept) {
      list.push(
        {
          id: 'active-timetable',
          title: `${activeDept.code} — Timetable Workstation`,
          subtitle: `Interactive weekly grid editor for ${activeDept.name}`,
          category: 'Active Department',
          icon: Calendar,
          badge: activeDept.code,
          keywords: ['editor', 'schedule', 'grid', 'swap', 'move', 'classes', activeDept.name, activeDept.code],
          action: () => {
            state.setActiveDepartment(activeDept.id);
            navigate(`/departments/${activeDept.id}/timetable`);
          },
        },
        {
          id: 'active-master-timetable',
          title: `${activeDept.code} — Master Timetable`,
          subtitle: `Notice-board grid of all sections across ${activeDept.name}`,
          category: 'Active Department',
          icon: Grid3X3,
          badge: activeDept.code,
          keywords: ['master', 'all sections', 'notice board', 'overview', activeDept.code],
          action: () => {
            state.setActiveDepartment(activeDept.id);
            navigate(`/departments/${activeDept.id}/master-timetable`);
          },
        },
        {
          id: 'active-faculty-timetable',
          title: `${activeDept.code} — Faculty Timetables & Free Slots`,
          subtitle: `Teacher schedules, weekly workload and common free slots`,
          category: 'Active Department',
          icon: UserCheck,
          badge: activeDept.code,
          keywords: ['teachers', 'professors', 'free periods', 'workload', 'substitute', activeDept.code],
          action: () => {
            state.setActiveDepartment(activeDept.id);
            navigate(`/departments/${activeDept.id}/faculty-timetable`);
          },
        },
        {
          id: 'active-generate',
          title: `${activeDept.code} — Constraint Solver & Generation`,
          subtitle: `Run MRV solver, feasibility checks and generate conflict-free schedule`,
          category: 'Active Department',
          icon: Sparkles,
          badge: 'SOLVER',
          keywords: ['solve', 'backtracking', 'mrv', 'generate', 'create schedule', activeDept.code],
          action: () => {
            state.setActiveDepartment(activeDept.id);
            navigate(`/departments/${activeDept.id}/generate`);
          },
        },
        {
          id: 'active-subjects',
          title: `${activeDept.code} — Subjects & Requirements`,
          subtitle: `Course codes, weekly sessions, theory and labs for ${activeDept.name}`,
          category: 'Active Department',
          icon: BookOpen,
          badge: activeDept.code,
          keywords: ['courses', 'syllabus', 'credits', 'theory', 'lab', activeDept.code],
          action: () => {
            state.setActiveDepartment(activeDept.id);
            navigate(`/departments/${activeDept.id}/subjects`);
          },
        },
        {
          id: 'active-faculty',
          title: `${activeDept.code} — Faculty Directory`,
          subtitle: `Staff roster, qualification mapping and teaching limits`,
          category: 'Active Department',
          icon: Users,
          badge: activeDept.code,
          keywords: ['staff', 'instructors', 'lecturers', activeDept.code],
          action: () => {
            state.setActiveDepartment(activeDept.id);
            navigate(`/departments/${activeDept.id}/faculty`);
          },
        },
        {
          id: 'active-rooms',
          title: `${activeDept.code} — Rooms & Laboratories`,
          subtitle: `Lecture halls, lab spaces, capacities and equipment`,
          category: 'Active Department',
          icon: DoorOpen,
          badge: activeDept.code,
          keywords: ['venues', 'classrooms', 'labs', 'capacity', activeDept.code],
          action: () => {
            state.setActiveDepartment(activeDept.id);
            navigate(`/departments/${activeDept.id}/rooms`);
          },
        },
      );
    }

    // 3. Departments List
    for (const d of state.departments) {
      if (activeDept && d.id === activeDept.id) continue;
      list.push({
        id: `dept-${d.id}`,
        title: `${d.code} — ${d.name}`,
        subtitle: `Jump to ${d.name} (${d.workingDays.length} working days, ${d.periodsPerDay} periods/day)`,
        category: 'Departments',
        icon: Building2,
        badge: d.code,
        keywords: [d.code, d.name, 'branch', 'switch department'],
        action: () => {
          state.setActiveDepartment(d.id);
          navigate(`/departments/${d.id}`);
        },
      });
    }

    // 4. Quick Actions
    if (onOpenSemesterModal) {
      list.push({
        id: 'action-switch-semester',
        title: 'Switch Academic Semester / Term',
        subtitle: 'Change active semester or clone departments for next term',
        category: 'Actions',
        icon: Layers,
        keywords: ['semester', 'term', 'academic year', 'clone term', 'fall', 'spring'],
        action: onOpenSemesterModal,
      });
    }

    // 5. Appearance / Themes
    list.push(
      {
        id: 'theme-dark',
        title: 'Theme: Switch to Dark Mode',
        subtitle: 'Dark graphite /dev/null workstation theme',
        category: 'Theme',
        icon: Moon,
        badge: theme === 'dark' ? 'CURRENT' : undefined,
        keywords: ['dark', 'black', 'graphite', 'night'],
        action: () => setTheme('dark'),
      },
      {
        id: 'theme-light',
        title: 'Theme: Switch to Light Mode',
        subtitle: 'Clean high-contrast light workstation theme',
        category: 'Theme',
        icon: Sun,
        badge: theme === 'light' ? 'CURRENT' : undefined,
        keywords: ['light', 'white', 'day'],
        action: () => setTheme('light'),
      },
      {
        id: 'theme-system',
        title: 'Theme: Match System Setting',
        subtitle: 'Follow your operating system appearance preference',
        category: 'Theme',
        icon: Monitor,
        badge: theme === 'system' ? 'CURRENT' : undefined,
        keywords: ['system', 'auto', 'os'],
        action: () => setTheme('system'),
      },
    );

    return list;
  }, [state, activeDept, navigate, onOpenSemesterModal, theme, setTheme]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCommands;

    const tokens = q.split(/\s+/).filter(Boolean);

    return allCommands.filter((cmd) => {
      const matchTarget = `${cmd.title} ${cmd.subtitle ?? ''} ${cmd.category} ${(cmd.keywords ?? []).join(' ')}`.toLowerCase();
      return tokens.every((token) => matchTarget.includes(token));
    });
  }, [allCommands, search]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure active element is scrolled into view safely (jsdom-friendly)
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#18181a] rounded-xl shadow-2xl border border-[#e1e4e8] dark:border-[#2a2a2d] overflow-hidden flex flex-col max-h-[80vh] transition-all">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a]">
          <Search className="w-5 h-5 text-[#3b6fe0] dark:text-[#7aa2f7] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, departments, views... (↑↓ to select, ↵ to run)"
            className="flex-1 bg-transparent text-sm text-[#121417] dark:text-[#ececec] placeholder:text-[#8c9199] dark:placeholder:text-[#6e6e73] focus:outline-none"
            aria-autocomplete="list"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-[#8c9199] hover:text-[#121417] dark:hover:text-[#ececec] rounded transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded border border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] px-1.5 py-0.5 text-[10px] font-mono text-[#5b616b] dark:text-[#8c9199]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          role="listbox"
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent focus:outline-none"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#5b616b] dark:text-[#8c9199]">
              <p className="font-medium">No results found for &ldquo;{search}&rdquo;</p>
              <p className="text-xs mt-1 text-[#8c9199] dark:text-[#6e6e73]">
                Try searching for a department name, timetable, teacher, or theme
              </p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected ? 'true' : 'false'}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? 'bg-[#e8effc] text-[#3b6fe0] dark:bg-[#18233a] dark:text-[#7aa2f7]'
                      : 'text-[#121417] dark:text-[#ececec] hover:bg-[#f6f7f8] dark:hover:bg-[#232326]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-1.5 rounded-md shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#3b6fe0] text-white dark:bg-[#7aa2f7] dark:text-[#111112]'
                          : 'bg-[#f0f2f5] dark:bg-[#232326] text-[#5b616b] dark:text-[#8c9199] group-hover:text-[#121417] dark:group-hover:text-[#ececec]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate leading-tight">{cmd.title}</span>
                        {cmd.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                              isSelected
                                ? 'bg-[#3b6fe0]/20 text-[#3b6fe0] dark:bg-[#7aa2f7]/20 dark:text-[#7aa2f7]'
                                : 'bg-[#eef0f2] dark:bg-[#2a2a2d] text-[#5b616b] dark:text-[#8c9199]'
                            }`}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected
                              ? 'text-[#3b6fe0]/80 dark:text-[#7aa2f7]/80'
                              : 'text-[#5b616b] dark:text-[#8c9199]'
                          }`}
                        >
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#3b6fe0]/10 text-[#3b6fe0] dark:bg-[#7aa2f7]/10 dark:text-[#7aa2f7]'
                          : 'text-[#8c9199] dark:text-[#6e6e73]'
                      }`}
                    >
                      {cmd.category}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${
                        isSelected ? 'opacity-100 translate-x-0 text-[#3b6fe0] dark:text-[#7aa2f7]' : ''
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#e1e4e8] dark:border-[#2a2a2d] bg-[#f6f7f8] dark:bg-[#111112] text-[11px] text-[#5b616b] dark:text-[#8c9199]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono text-[10px] px-1 py-0.5 rounded border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] mr-1">
                ↑↓
              </kbd>
              navigate
            </span>
            <span>
              <kbd className="font-mono text-[10px] px-1 py-0.5 rounded border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] mr-1">
                ↵
              </kbd>
              select
            </span>
            <span>
              <kbd className="font-mono text-[10px] px-1 py-0.5 rounded border border-[#e1e4e8] dark:border-[#2a2a2d] bg-white dark:bg-[#18181a] mr-1">
                esc
              </kbd>
              dismiss
            </span>
          </div>
          <div>
            <span>
              {filteredCommands.length} command{filteredCommands.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
