export type NodeType = 'root' | 'domain' | 'specialization' | 'career' | 'emerging';

export type SkillCategory = 'technical' | 'hard' | 'soft';

export interface Skill {
  name: string;
  category: SkillCategory;
}

export interface VideoRef {
  title: string;
  youtubeId: string;
}

export interface Education {
  typicalEntry: string;
  degrees: string[];
  certifications: string[];
}

export interface Salary {
  median: number | null;
  range: string;
  period: 'annual' | 'hourly';
  benefits: string[];
}

export interface Availability {
  nationalGrowthPct: number | null;
  nationalGrowthLabel: string;
  annualOpenings: number | null;
  projectionWindow: string;
  localNote: string;
}

export interface Sources {
  bls: string | null;
  onet: string | null;
  fallbackNote: string | null;
}

export interface CareerNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  tagline: string;
  description: string;
  tasks: string[];
  education: Education | null;
  salary: Salary | null;
  availability: Availability | null;
  videoSearchQuery: string | null;
  videos: VideoRef[];
  skills: Skill[];
  sources: Sources | null;
}

export type SkillStatus = 'not-yet' | 'in-progress' | 'achieved';

export interface StudentNodeState {
  skillStatus: Record<string, SkillStatus>;
  notes: [string, string, string, string];
  opinion: string;
  localAvailability: string;
  customVideoId: string;
}

export type SelectionSlot = 'main' | 'related1' | 'related2';

export interface Selections {
  main: string | null;
  related1: string | null;
  related2: string | null;
}
