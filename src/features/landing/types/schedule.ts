export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  periodNumber: number;
}

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  department: string;
  maxDailyHours: number;
  currentWeeklyHours: number;
  availability: Record<DayOfWeek, boolean>;
}

export interface AcademicRoom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  type: 'Lecture Hall' | 'Computer Lab' | 'Hardware Lab' | 'Seminar Room' | 'Auditorium';
  equipment: string[];
}

export interface ScheduleClass {
  id: string;
  courseCode: string;
  courseName: string;
  department: string;
  section: string;
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'elective';
  hasConflict?: boolean;
  conflictReason?: string;
  colorTone?: 'indigo' | 'emerald' | 'amber' | 'slate' | 'rose';
}

export interface ConstraintItem {
  id: string;
  category: 'Faculty' | 'Room' | 'Pedagogical' | 'Institutional';
  label: string;
  description: string;
  status: 'enforced' | 'relaxed';
  type: 'hard' | 'soft';
}

export interface InstitutionTier {
  id: string;
  name: string;
  description: string;
  students: number;
  faculty: number;
  rooms: number;
  courses: number;
  weeklyConstraints: number;
  solveTimeSeconds: number;
}
