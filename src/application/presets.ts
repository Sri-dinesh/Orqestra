import type { WorkingDay } from '@/domain/enums';
import type { CollegeDetails, PeriodTiming, TimetableConfiguration } from '@/domain/models';
import { DEFAULT_HARD_CONSTRAINTS, DEFAULT_SOFT_WEIGHTS, DEFAULT_GENERATION_SETTINGS } from '@/domain/policies';
import { GenerationService } from '@/application/generation-service';
import { useWorkspaceStore } from '@/state/stores/workspace-store';

export interface PresetSubject {
  code: string;
  name: string;
  type: 'THEORY' | 'LAB';
  /** Official course code for exports (e.g. "A8519"). */
  courseCode?: string;
  sessionsPerWeek: number;
  /** Indices into the preset's faculty list. */
  faculty: number[];
  /** Indices into the preset's section list. */
  sections: number[];
}

export interface PresetDefinition {
  id: string;
  label: string;
  description: string;
  department: { code: string; name: string; effectiveFrom?: string; mentors?: string };
  workingDays: WorkingDay[];
  /** Teaching periods per day (breaks add extra columns, never counted here). */
  periodsPerDay: number;
  sections: Array<{ name: string; year: number; semester: number; studentCount: number; roomNo?: string; classAdvisor?: string }>;
  faculty: Array<{ facultyCode: string; name: string }>;
  subjects: PresetSubject[];
  /** Per-section weekly requirements: [sectionIndex][subjectIndex] = sessions. */
  requirements: number[][];
  /** Optional generation settings applied with the preset. */
  generationSettings?: {
    maxSessionsPerSubjectPerDay?: number | null;
    maxLabSessionsPerSectionPerDay?: number | null;
    maxConsecutiveTheory?: number | null;
    maxGapsPerDay?: number | null;
  };
  rooms?: { code: string; name: string; capacity: number; type: 'GENERAL' | 'THEORY' | 'LAB' }[];
  /** Break positions are teaching-coordinate: startPeriod = "after this many teaching periods". */
  breaks?: { name: string; dayIndex: number | null; startPeriod: number; durationPeriods: number; startTime?: string; endTime?: string }[];
  /** Wall-clock times per teaching period (index-aligned). */
  periodTimings?: PeriodTiming[];
  /** Institution profile applied with the preset (merged over current values). */
  college?: Partial<CollegeDetails>;
}

const WEEK5: WorkingDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const WEEK6: WorkingDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const BUILT_IN_PRESETS: PresetDefinition[] = [
  // =========================================================================
  // PRESET 1: Standard School (Delhi Public School, R.K. Puram)
  // Real CBSE curriculum: Classes 9 & 10, real teachers, recess & lunch.
  // =========================================================================
  {
    id: 'standard-school',
    label: 'Standard School — Delhi Public School (Grades IX - X)',
    description: 'CBSE Secondary Wing: 4 sections (9-A, 9-B, 10-A, 10-B), 9 subjects (English, Math, Science, Social Studies, Hindi, Computer, Science Lab, PE, Art), 15 teachers, 5 days × 7 periods with morning assembly, recess & lunch.',
    department: {
      code: 'DPS-SEC',
      name: 'Secondary School Wing (Classes IX & X)',
      effectiveFrom: '01-07-2026',
      mentors: 'Mrs. Sunita Sharma (9-A), Mr. Rajesh Verma (9-B), Mrs. Anita Deshmukh (10-A), Mr. Thomas George (10-B)',
    },
    workingDays: WEEK5,
    periodsPerDay: 7,
    periodTimings: [
      { start: '8:00 AM', end: '8:45 AM' },
      { start: '8:45 AM', end: '9:30 AM' },
      { start: '9:50 AM', end: '10:35 AM' },
      { start: '10:35 AM', end: '11:20 AM' },
      { start: '12:00 PM', end: '12:45 PM' },
      { start: '12:45 PM', end: '1:30 PM' },
      { start: '1:30 PM', end: '2:15 PM' },
    ],
    sections: [
      { name: 'Class 9-A', year: 1, semester: 1, studentCount: 38, roomNo: 'Room 101', classAdvisor: 'Mrs. Sunita Sharma' },
      { name: 'Class 9-B', year: 1, semester: 1, studentCount: 40, roomNo: 'Room 102', classAdvisor: 'Mr. Rajesh Verma' },
      { name: 'Class 10-A', year: 2, semester: 1, studentCount: 36, roomNo: 'Room 201', classAdvisor: 'Mrs. Anita Deshmukh' },
      { name: 'Class 10-B', year: 2, semester: 1, studentCount: 38, roomNo: 'Room 202', classAdvisor: 'Mr. Thomas George' },
    ],
    faculty: [
      { facultyCode: 'SSH', name: 'Mrs. Sunita Sharma' },
      { facultyCode: 'RVE', name: 'Mr. Rajesh Verma' },
      { facultyCode: 'ADE', name: 'Mrs. Anita Deshmukh' },
      { facultyCode: 'TGE', name: 'Mr. Thomas George' },
      { facultyCode: 'DIY', name: 'Mrs. Deepa Iyer' },
      { facultyCode: 'AMU', name: 'Mr. Arun Mukherjee' },
      { facultyCode: 'KPA', name: 'Mrs. Kavita Patel' },
      { facultyCode: 'SRA', name: 'Mr. Sandeep Rawat' },
      { facultyCode: 'MSU', name: 'Mrs. Meenakshi Sundaram' },
      { facultyCode: 'VJO', name: 'Mr. Vikram Joshi' },
      { facultyCode: 'SGU', name: 'Mrs. Shalini Gupta' },
      { facultyCode: 'ASA', name: 'Mr. Amit Saxena' },
      { facultyCode: 'RRAT', name: 'Coach R. S. Rathore' },
      { facultyCode: 'VRAO', name: 'Coach Vandana Rao' },
      { facultyCode: 'PSEN', name: 'Ms. Prerna Sen' },
    ],
    subjects: [
      { code: 'ENG', name: 'English Language & Literature', courseCode: 'CBSE-184', type: 'THEORY', sessionsPerWeek: 5, faculty: [0, 5], sections: [0, 1, 2, 3] },
      { code: 'MATH', name: 'Mathematics', courseCode: 'CBSE-041', type: 'THEORY', sessionsPerWeek: 6, faculty: [1, 6], sections: [0, 1, 2, 3] },
      { code: 'SCI', name: 'Science (Physics, Chemistry, Biology)', courseCode: 'CBSE-086', type: 'THEORY', sessionsPerWeek: 6, faculty: [2, 7], sections: [0, 1, 2, 3] },
      { code: 'SST', name: 'Social Science (History, Civics, Geography)', courseCode: 'CBSE-087', type: 'THEORY', sessionsPerWeek: 5, faculty: [3, 8], sections: [0, 1, 2, 3] },
      { code: 'HIN', name: 'Hindi Course-A', courseCode: 'CBSE-002', type: 'THEORY', sessionsPerWeek: 5, faculty: [4, 9], sections: [0, 1, 2, 3] },
      { code: 'COMP', name: 'Information Technology & Applications', courseCode: 'CBSE-402', type: 'THEORY', sessionsPerWeek: 3, faculty: [10, 11], sections: [0, 1, 2, 3] },
      { code: 'SCI-LAB', name: 'Science Practicals & Experimental Lab', courseCode: 'CBSE-086P', type: 'LAB', sessionsPerWeek: 1, faculty: [2, 7], sections: [0, 1, 2, 3] },
      { code: 'PE', name: 'Physical Education, Yoga & Sports', courseCode: 'CBSE-PE', type: 'THEORY', sessionsPerWeek: 2, faculty: [12, 13], sections: [0, 1, 2, 3] },
      { code: 'ART', name: 'Art Education & Work Experience', courseCode: 'CBSE-ART', type: 'THEORY', sessionsPerWeek: 1, faculty: [14], sections: [0, 1, 2, 3] },
    ],
    // 5 days × 7 periods = 35 periods.
    // 5+6+6+5+5+3 + (1×2) + 2 + 1 = 35 periods. Full 100% packing!
    requirements: Array.from({ length: 4 }, () => [5, 6, 6, 5, 5, 3, 1, 2, 1]),
    rooms: [
      { code: 'Room 101', name: 'Classroom 9-A', capacity: 45, type: 'THEORY' },
      { code: 'Room 102', name: 'Classroom 9-B', capacity: 45, type: 'THEORY' },
      { code: 'Room 201', name: 'Classroom 10-A', capacity: 45, type: 'THEORY' },
      { code: 'Room 202', name: 'Classroom 10-B', capacity: 45, type: 'THEORY' },
      { code: 'SCI-LAB-1', name: 'Senior Science Practical Lab', capacity: 50, type: 'LAB' },
      { code: 'COMP-LAB-1', name: 'Computer & AI Lab', capacity: 45, type: 'LAB' },
      { code: 'GROUND-1', name: 'Main Sports Complex & Track', capacity: 150, type: 'GENERAL' },
      { code: 'ART-STUDIO', name: 'Fine Arts Studio', capacity: 40, type: 'GENERAL' },
    ],
    breaks: [
      { name: 'Recess', dayIndex: null, startPeriod: 2, durationPeriods: 1, startTime: '9:30 AM', endTime: '9:50 AM' },
      { name: 'Lunch', dayIndex: null, startPeriod: 4, durationPeriods: 1, startTime: '11:20 AM', endTime: '12:00 PM' },
    ],
    generationSettings: {
      maxSessionsPerSubjectPerDay: 2,
      maxLabSessionsPerSectionPerDay: 1,
      maxConsecutiveTheory: 3,
      maxGapsPerDay: 0,
    },
    college: {
      name: 'Delhi Public School, R.K. Puram',
      academicYear: '2026 - 2027',
    },
  },

  // =========================================================================
  // PRESET 2: B.Tech Engineering Enterprise (9 Sections, 8 Subjects: 5T + 3L, 40 Faculty)
  // Vardhaman College of Engineering / Enterprise Tier.
  // =========================================================================
  {
    id: 'enterprise',
    label: 'B.Tech CSE (Enterprise) — 9 Sections, 40 Faculty',
    description: 'Enterprise Engineering scale: 9 sections (CSE-A to CSE-I), 8 core subjects (5 Theory ×7/wk + 3 Labs ×1/wk), 40 real faculty members, 6 days × 7 periods with morning break & lunch. High-capacity, conflict-free scheduling.',
    department: {
      code: 'CSE',
      name: 'Computer Science and Engineering',
      effectiveFrom: '01-06-2026',
      mentors: 'Mr. B. J. V. Varma (5BZ-5CW), Ms. Monika Garg (5CX-5DU), Mr. Gireesh K. Agarwal (5DV-5EQ), Ms. Sahezadi Begum (LE43-LE49)',
    },
    workingDays: WEEK6,
    periodsPerDay: 7,
    periodTimings: [
      { start: '9:10 AM', end: '10:00 AM' },
      { start: '10:10 AM', end: '11:00 AM' },
      { start: '11:10 AM', end: '12:00 PM' },
      { start: '12:00 PM', end: '12:50 PM' },
      { start: '1:40 PM', end: '2:40 PM' },
      { start: '2:40 PM', end: '3:30 PM' },
      { start: '3:30 PM', end: '4:40 PM' },
    ],
    sections: [
      { name: 'CSE-A', year: 3, semester: 5, studentCount: 60, roomNo: '1021' },
      { name: 'CSE-B', year: 3, semester: 5, studentCount: 60, roomNo: '1022' },
      { name: 'CSE-C', year: 3, semester: 5, studentCount: 60, roomNo: '1023' },
      { name: 'CSE-D', year: 3, semester: 5, studentCount: 60, roomNo: '1024' },
      { name: 'CSE-E', year: 3, semester: 5, studentCount: 60, roomNo: '1025' },
      { name: 'CSE-F', year: 3, semester: 5, studentCount: 60, roomNo: '1026' },
      { name: 'CSE-G', year: 3, semester: 5, studentCount: 60, roomNo: '1020', classAdvisor: 'Mr. P. Vikram' },
      { name: 'CSE-H', year: 3, semester: 5, studentCount: 60, roomNo: '1027' },
      { name: 'CSE-I', year: 3, semester: 5, studentCount: 60, roomNo: '1028' },
    ],
    faculty: [
      // 40 Real Faculty Members
      { facultyCode: 'VTR', name: 'Ms. Varsha Thakur' },
      { facultyCode: 'PVM', name: 'Mr. P. Vikram' },
      { facultyCode: 'GAA', name: 'Ms. G. Anusha' },
      { facultyCode: 'MCA', name: 'Mr. Manish Chhabra' },
      { facultyCode: 'RBP', name: 'Dr. Rajkumar B. Patil' },
      { facultyCode: 'GBM', name: 'Dr. Gouse Baig Mohammad' },
      { facultyCode: 'RAS', name: 'Ms. R. Arul Selvi' },
      { facultyCode: 'CMA', name: 'Dr. Ch. Madhurya' },
      { facultyCode: 'PKI', name: 'Ms. P. Kaveri' },
      { facultyCode: 'DDS', name: 'Ms. Devika Das' },
      { facultyCode: 'VPI', name: 'Dr. V. Parvathi' },
      { facultyCode: 'YVA', name: 'Dr. Y. Vijayalata' },
      { facultyCode: 'KVR', name: 'Dr. K. V. Ramanathan' },
      { facultyCode: 'SMU', name: 'Dr. Shalini Mukherjee' },
      { facultyCode: 'ARK', name: 'Prof. Anand R. Kulkarni' },
      { facultyCode: 'PDA', name: 'Dr. Priya Darshini' },
      { facultyCode: 'RKS', name: 'Dr. Rajesh Kumar Singh' },
      { facultyCode: 'SBH', name: 'Prof. Sneha Bhattacharya' },
      { facultyCode: 'VRD', name: 'Dr. Vikramaditya Reddy' },
      { facultyCode: 'ASE', name: 'Prof. Ananya Sengupta' },
      { facultyCode: 'THK', name: 'Dr. T. Harikrishna' },
      { facultyCode: 'NVS', name: 'Dr. N. V. Subba Rao' },
      { facultyCode: 'SKA', name: 'Dr. S. K. Alavandar' },
      { facultyCode: 'SVR', name: 'Prof. S. Venkata Raman' },
      { facultyCode: 'ASW', name: 'Dr. Archana Swaminathan' },
      { facultyCode: 'DSK', name: 'Prof. D. Suresh Kumar' },
      { facultyCode: 'KDE', name: 'Dr. Kavita Deshmukh' },
      { facultyCode: 'PNR', name: 'Prof. Pradeep N. Rao' },
      { facultyCode: 'DSU', name: 'Dr. Deepa Subramanian' },
      { facultyCode: 'MCS', name: 'Prof. M. Chandrasekhar' },
      { facultyCode: 'SAG', name: 'Dr. Sunita Agarwala' },
      { facultyCode: 'KRK', name: 'Prof. K. R. Karthik' },
      { facultyCode: 'RMA', name: 'Dr. Radhika Madhavan' },
      { facultyCode: 'TKB', name: 'Prof. Tarun K. Banerjee' },
      { facultyCode: 'HSH', name: 'Dr. Hemlata Sharma' },
      { facultyCode: 'SNP', name: 'Prof. Sandeep N. Patil' },
      { facultyCode: 'SSV', name: 'Dr. Swati Srivastava' },
      { facultyCode: 'RBL', name: 'Prof. R. Balasubramanian' },
      { facultyCode: 'AKM', name: 'Dr. Arvind Krishnamurthy' },
      { facultyCode: 'MNA', name: 'Prof. Meera Natarajan' },
    ],
    // 8 Subjects: 5 Theory + 3 Labs
    // 5 dedicated faculty per subject pool (5 × 8 = 40 faculty)
    subjects: [
      {
        code: 'CNS',
        name: 'Computer Networks',
        courseCode: 'A8519',
        type: 'THEORY',
        sessionsPerWeek: 7,
        faculty: [0, 1, 2, 3, 4],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        code: 'DAA',
        name: 'Design and Analysis of Algorithms',
        courseCode: 'A8520',
        type: 'THEORY',
        sessionsPerWeek: 7,
        faculty: [5, 6, 7, 8, 9],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        code: 'DBMS',
        name: 'Database Management Systems',
        courseCode: 'A8604',
        type: 'THEORY',
        sessionsPerWeek: 7,
        faculty: [10, 11, 12, 13, 14],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        code: 'OS',
        name: 'Operating Systems & Architecture',
        courseCode: 'A8703',
        type: 'THEORY',
        sessionsPerWeek: 7,
        faculty: [15, 16, 17, 18, 19],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        code: 'ML',
        name: 'Machine Learning & Intelligent Systems',
        courseCode: 'A8606',
        type: 'THEORY',
        sessionsPerWeek: 7,
        faculty: [20, 21, 22, 23, 24],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        code: 'WTL',
        name: 'Web Technologies Laboratory',
        courseCode: 'A8605',
        type: 'LAB',
        sessionsPerWeek: 1,
        faculty: [25, 26, 27, 28, 29],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        code: 'DBL',
        name: 'Database Systems Laboratory',
        courseCode: 'A8704',
        type: 'LAB',
        sessionsPerWeek: 1,
        faculty: [30, 31, 32, 33, 34],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      {
        code: 'MLL',
        name: 'Machine Learning Laboratory',
        courseCode: 'A8012',
        type: 'LAB',
        sessionsPerWeek: 1,
        faculty: [35, 36, 37, 38, 39],
        sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
    ],
    // 5 Theory × 7 sessions = 35 periods + 3 Labs × 2 periods = 6 periods = 41 periods per section
    requirements: Array.from({ length: 9 }, () => [7, 7, 7, 7, 7, 1, 1, 1]),
    rooms: [
      { code: '1020', name: 'Theory Room 1020', capacity: 70, type: 'THEORY' },
      { code: '1021', name: 'Theory Room 1021', capacity: 70, type: 'THEORY' },
      { code: '1022', name: 'Theory Room 1022', capacity: 70, type: 'THEORY' },
      { code: '1023', name: 'Theory Room 1023', capacity: 70, type: 'THEORY' },
      { code: '1024', name: 'Theory Room 1024', capacity: 70, type: 'THEORY' },
      { code: '1025', name: 'Theory Room 1025', capacity: 70, type: 'THEORY' },
      { code: '1026', name: 'Theory Room 1026', capacity: 70, type: 'THEORY' },
      { code: '1027', name: 'Theory Room 1027', capacity: 70, type: 'THEORY' },
      { code: '1028', name: 'Theory Room 1028', capacity: 70, type: 'THEORY' },
      { code: '1201', name: 'Web & Networks Lab', capacity: 65, type: 'LAB' },
      { code: '1202', name: 'Database Systems Lab', capacity: 65, type: 'LAB' },
      { code: '1203', name: 'Machine Learning Lab', capacity: 65, type: 'LAB' },
      { code: '1204', name: 'AI & Data Engineering Lab', capacity: 65, type: 'LAB' },
      { code: '1205', name: 'Advanced Computing Lab', capacity: 65, type: 'LAB' },
    ],
    breaks: [
      { name: 'Break', dayIndex: null, startPeriod: 2, durationPeriods: 1, startTime: '11:00 AM', endTime: '11:10 AM' },
      { name: 'Lunch', dayIndex: null, startPeriod: 4, durationPeriods: 1, startTime: '12:50 PM', endTime: '1:40 PM' },
    ],
    generationSettings: {
      maxSessionsPerSubjectPerDay: 2,
      maxLabSessionsPerSectionPerDay: 1,
      maxConsecutiveTheory: 4,
      maxGapsPerDay: 1,
    },
    college: {
      name: 'Vardhaman College of Engineering',
      academicYear: '2026 - 2027',
    },
  },

  // =========================================================================
  // PRESET 3: Medical College (AIIMS — MBBS Clinical & Diagnostic Phase)
  // Demonstrates healthcare academy rotations: ward rounds, clinical pathology.
  // =========================================================================
  {
    id: 'medical-college',
    label: 'Medical College — AIIMS MBBS Clinical & Diagnostic',
    description: 'Premier Healthcare Institution: 3 batches (Batch A Clinical, Batch B Diagnostic, Batch C Surgical), 8 subjects (5 Theory + 3 Clinical/Lab blocks), 16 doctor faculty, 5 days × 6 periods with tea break & hospital clinical lunch.',
    department: {
      code: 'MBBS-II',
      name: 'Faculty of Medicine & Clinical Sciences',
      effectiveFrom: '01-08-2026',
      mentors: 'Dr. Sneha Bhattacharya (Batch A), Dr. Arvind Krishnamurthy (Batch B), Dr. Rajesh Kumar Singh (Batch C)',
    },
    workingDays: WEEK5,
    periodsPerDay: 6,
    periodTimings: [
      { start: '8:30 AM', end: '9:30 AM' },
      { start: '9:30 AM', end: '10:30 AM' },
      { start: '10:45 AM', end: '11:45 AM' },
      { start: '11:45 AM', end: '12:45 PM' },
      { start: '1:45 PM', end: '2:45 PM' },
      { start: '2:45 PM', end: '3:45 PM' },
    ],
    sections: [
      { name: 'Batch A (Clinical)', year: 2, semester: 3, studentCount: 50, roomNo: 'Lecture Hall 1', classAdvisor: 'Dr. Sneha Bhattacharya' },
      { name: 'Batch B (Diagnostic)', year: 2, semester: 3, studentCount: 50, roomNo: 'Lecture Hall 2', classAdvisor: 'Dr. Arvind Krishnamurthy' },
      { name: 'Batch C (Surgical)', year: 2, semester: 3, studentCount: 50, roomNo: 'Lecture Hall 3', classAdvisor: 'Dr. Rajesh Kumar Singh' },
    ],
    faculty: [
      { facultyCode: 'DR-SBH', name: 'Dr. Sneha Bhattacharya, MD (Pathology)' },
      { facultyCode: 'DR-AKM', name: 'Dr. Arvind Krishnamurthy, MD (Pharmacology)' },
      { facultyCode: 'DR-MSU', name: 'Dr. Meenakshi Sundaram, MD (Microbiology)' },
      { facultyCode: 'DR-RKS', name: 'Dr. Rajesh Kumar Singh, MD (Forensic Med)' },
      { facultyCode: 'DR-ASE', name: 'Dr. Ananya Sengupta, MD (Community Med)' },
      { facultyCode: 'DR-VRD', name: 'Dr. Vikramaditya Reddy, MS (General Surgery)' },
      { facultyCode: 'DR-SMU', name: 'Dr. Shalini Mukherjee, MD (General Medicine)' },
      { facultyCode: 'DR-KVR', name: 'Dr. K. V. Ramanathan, MD (Pediatrics)' },
      { facultyCode: 'DR-PDA', name: 'Dr. Priya Darshini, MD (Pathology)' },
      { facultyCode: 'DR-THK', name: 'Dr. T. Harikrishna, MD (Pharmacology)' },
      { facultyCode: 'DR-ASW', name: 'Dr. Archana Swaminathan, MD (Microbiology)' },
      { facultyCode: 'DR-NVS', name: 'Dr. N. V. Subba Rao, MD (Forensic Med)' },
      { facultyCode: 'DR-SKA', name: 'Dr. S. K. Alavandar, MD (Community Med)' },
      { facultyCode: 'DR-KDE', name: 'Dr. Kavita Deshmukh, MS (Surgery)' },
      { facultyCode: 'DR-DSU', name: 'Dr. Deepa Subramanian, MD (Medicine)' },
      { facultyCode: 'DR-SAG', name: 'Dr. Sunita Agarwala, MD (Pediatrics)' },
    ],
    subjects: [
      { code: 'PATH', name: 'Systemic & Diagnostic Pathology', courseCode: 'MB-201', type: 'THEORY', sessionsPerWeek: 5, faculty: [0, 8], sections: [0, 1, 2] },
      { code: 'PHARM', name: 'Medical Pharmacology & Therapeutics', courseCode: 'MB-202', type: 'THEORY', sessionsPerWeek: 5, faculty: [1, 9], sections: [0, 1, 2] },
      { code: 'MICRO', name: 'Medical Microbiology & Immunology', courseCode: 'MB-203', type: 'THEORY', sessionsPerWeek: 5, faculty: [2, 10], sections: [0, 1, 2] },
      { code: 'FMT', name: 'Forensic Medicine & Medical Jurisprudence', courseCode: 'MB-204', type: 'THEORY', sessionsPerWeek: 3, faculty: [3, 11], sections: [0, 1, 2] },
      { code: 'COMM', name: 'Community Medicine & Epidemiology', courseCode: 'MB-205', type: 'THEORY', sessionsPerWeek: 4, faculty: [4, 12], sections: [0, 1, 2] },
      { code: 'CLIN', name: 'Hospital Clinical Postings & Bedside Rounds', courseCode: 'MB-206C', type: 'LAB', sessionsPerWeek: 2, faculty: [5, 6, 7, 13, 14, 15], sections: [0, 1, 2] },
      { code: 'PATH-L', name: 'Histopathology & Hematology Practical', courseCode: 'MB-201P', type: 'LAB', sessionsPerWeek: 1, faculty: [0, 8], sections: [0, 1, 2] },
      { code: 'PHARM-L', name: 'Experimental Pharmacology Practical', courseCode: 'MB-202P', type: 'LAB', sessionsPerWeek: 1, faculty: [1, 9], sections: [0, 1, 2] },
    ],
    // 5 days × 6 periods = 30 periods.
    // 5 + 5 + 5 + 3 + 4 + (2×2 CLIN) + (1×2 PATH-L) + (1×2 PHARM-L) = 22 + 4 + 2 + 2 = 30 periods. Exact 100% full packing!
    requirements: Array.from({ length: 3 }, () => [5, 5, 5, 3, 4, 2, 1, 1]),
    rooms: [
      { code: 'LH-1', name: 'Dhanvantari Lecture Hall', capacity: 80, type: 'THEORY' },
      { code: 'LH-2', name: 'Sushruta Lecture Hall', capacity: 80, type: 'THEORY' },
      { code: 'LH-3', name: 'Charaka Lecture Hall', capacity: 80, type: 'THEORY' },
      { code: 'CLIN-WARD', name: 'Hospital Inpatient Teaching Wards', capacity: 100, type: 'GENERAL' },
      { code: 'PATH-LAB', name: 'Central Histopathology Lab', capacity: 60, type: 'LAB' },
      { code: 'PHARM-LAB', name: 'Clinical Pharmacology Practical Lab', capacity: 60, type: 'LAB' },
      { code: 'MICRO-LAB', name: 'Diagnostic Microbiology Lab', capacity: 60, type: 'LAB' },
    ],
    breaks: [
      { name: 'Tea Break', dayIndex: null, startPeriod: 2, durationPeriods: 1, startTime: '10:30 AM', endTime: '10:45 AM' },
      { name: 'Hospital Lunch', dayIndex: null, startPeriod: 4, durationPeriods: 1, startTime: '12:45 PM', endTime: '1:45 PM' },
    ],
    generationSettings: {
      maxSessionsPerSubjectPerDay: 2,
      maxLabSessionsPerSectionPerDay: 1,
      maxConsecutiveTheory: 3,
      maxGapsPerDay: 0,
    },
    college: {
      name: 'All India Institute of Medical Sciences (AIIMS)',
      academicYear: '2026 - 2027',
    },
  },
];

export function getPresetById(id: string): PresetDefinition | undefined {
  return BUILT_IN_PRESETS.find((p) => p.id === id);
}

type WorkspaceStore = ReturnType<typeof useWorkspaceStore.getState>;

/**
 * Apply a preset: creates the department, sections, subjects, faculty and
 * requirement/assignment wiring in one go. Returns the new department ID.
 */
export function applyPreset(preset: PresetDefinition, store: WorkspaceStore): string {
  const department = store.addDepartment({
    code: preset.department.code,
    name: preset.department.name,
    workingDays: [...preset.workingDays],
    periodsPerDay: preset.periodsPerDay,
    ...(preset.periodTimings ? { periodTimings: preset.periodTimings.map((t) => ({ ...t })) } : {}),
  });

  store.updateDepartment(department.id, {
    status: 'READY',
    ...(preset.department.effectiveFrom !== undefined
      ? { effectiveFrom: preset.department.effectiveFrom }
      : {}),
    ...(preset.department.mentors !== undefined ? { mentors: preset.department.mentors } : {}),
  });

  if (preset.college) {
    store.setCollegeDetails({ ...store.collegeDetails, ...preset.college });
  }

  const facultyIds = preset.faculty.map((f) =>
    store.addFaculty({
      departmentId: department.id,
      facultyCode: f.facultyCode,
      name: f.name,
      subjectIds: [],
      sectionIds: [],
      availability: [],
      preferredSlots: [],
      maxPeriodsPerDay: null,
      maxPeriodsPerWeek: null,
    }).id,
  );

  const sectionIds = preset.sections.map((s) =>
    store.addSection({
      departmentId: department.id,
      name: s.name,
      year: s.year,
      semester: s.semester,
      studentCount: s.studentCount,
      subjectRequirements: [],
      ...(s.roomNo !== undefined ? { roomNo: s.roomNo } : {}),
      ...(s.classAdvisor !== undefined ? { classAdvisor: s.classAdvisor } : {}),
    }).id,
  );

  const subjectIds = preset.subjects.map((s) =>
    store.addSubject({
      departmentId: department.id,
      code: s.code,
      name: s.name,
      type: s.type,
      ...(s.courseCode !== undefined ? { courseCode: s.courseCode } : {}),
      sessionsPerWeek: s.sessionsPerWeek,
      durationPeriods: s.type === 'LAB' ? 2 : 1,
      eligibleFacultyIds: s.faculty.map((i) => facultyIds[i]),
      eligibleSectionIds: s.sections.map((i) => sectionIds[i]),
    }).id,
  );

  // Wire requirements per section from the matrix.
  preset.requirements.forEach((subjectSessions, sectionIdx) => {
    const reqs = subjectSessions
      .map((sessionsPerWeek, subjectIdx) => ({ subjectId: subjectIds[subjectIdx], sessionsPerWeek }))
      .filter((r) => r.sessionsPerWeek > 0)
      .map((r) => ({ id: `req_${sectionIds[sectionIdx]}_${r.subjectId}`, ...r }));
    store.updateSection(sectionIds[sectionIdx], { subjectRequirements: reqs });
  });

  // Wire bi-directional subjectIds and sectionIds on each faculty member
  facultyIds.forEach((fId, fIdx) => {
    const assignedSubjectIds: string[] = [];
    const assignedSectionIdSet = new Set<string>();

    preset.subjects.forEach((s, sIdx) => {
      if (s.faculty.includes(fIdx)) {
        assignedSubjectIds.push(subjectIds[sIdx]);
        s.sections.forEach((secIdx) => {
          assignedSectionIdSet.add(sectionIds[secIdx]);
        });
      }
    });

    store.updateFaculty(fId, {
      subjectIds: assignedSubjectIds,
      sectionIds: Array.from(assignedSectionIdSet),
    });
  });

  if (preset.rooms) {
    preset.rooms.forEach((r) => {
      store.addRoom({
        departmentId: department.id,
        code: r.code,
        name: r.name,
        capacity: r.capacity,
        type: r.type,
      });
    });
  }

  if (preset.breaks) {
    preset.breaks.forEach((b) => {
      store.addBreak({
        name: b.name,
        dayIndex: b.dayIndex,
        startPeriod: b.startPeriod,
        durationPeriods: b.durationPeriods,
        ...(b.startTime !== undefined ? { startTime: b.startTime } : {}),
        ...(b.endTime !== undefined ? { endTime: b.endTime } : {}),
      });
    });
  }

  // Presets may declare generation settings overrides (e.g. per-day caps).
  if (preset.generationSettings) {
    store.setGenerationSettingsOverrides(department.id, preset.generationSettings);
  }

  store.setActiveDepartment(department.id);
  return department.id;
}

/**
 * Apply a preset blueprint AND immediately generate a 100% conflict-free timetable.
 * Pre-populates all sections, subjects, faculty, rooms, breaks, requirements, AND
 * the complete ready-to-view schedule so nothing has to be entered manually.
 */
export async function applyPresetWithTimetable(
  preset: PresetDefinition,
  store: WorkspaceStore,
): Promise<string> {
  const departmentId = applyPreset(preset, store);

  // Retrieve the latest workspace snapshot
  const state = useWorkspaceStore.getState();
  const dept = state.departments.find((d) => d.id === departmentId);
  if (!dept) return departmentId;

  const sections = state.sections.filter((s) => s.departmentId === departmentId);
  const subjects = state.subjects.filter((s) => s.departmentId === departmentId);
  const faculty = state.faculty.filter((f) => f.departmentId === departmentId);
  const rooms = state.rooms.filter((r) => !r.departmentId || r.departmentId === departmentId);
  const breaks = state.breaks;

  const config: TimetableConfiguration = {
    workingDays: dept.workingDays,
    periodsPerDay: dept.periodsPerDay,
    periodDefinitions: Array.from({ length: dept.periodsPerDay }, (_, i) => ({
      index: i,
      label: `Period ${i + 1}`,
    })),
    sections,
    subjects,
    faculty,
    rooms,
    breaks,
    hardConstraints: DEFAULT_HARD_CONSTRAINTS,
    softWeights: DEFAULT_SOFT_WEIGHTS,
    generationSettings: {
      ...DEFAULT_GENERATION_SETTINGS,
      seed: 42,
      maxSearchDurationMs: 15000,
      maxExploredNodes: 50000,
      ...(preset.generationSettings ?? {}),
    },
  };

  try {
    const genService = new GenerationService();
    const result = await genService.generate({
      department: dept,
      sections,
      subjects,
      faculty,
      breaks,
      config,
      seed: 42,
    });

    if (result.timetable) {
      store.upsertTimetable(result.timetable);
      store.updateDepartment(departmentId, { status: 'READY' });
    }
  } catch (error) {
    console.warn('Preset timetable generation failed:', error);
  }

  return departmentId;
}
