import type { LabSubject, SubjectCategory, MockAnalysis } from './types';

// Mock subjects data
export const mockSubjects: LabSubject[] = [
  {
    id: 'subj-1',
    subjectId: 'ai-1',
    subjectName: 'Artificial Intelligence',
    subjectSlug: 'artificial-intelligence',
    addedAt: '2024-01-15T10:30:00Z',
    addedById: 'user-1',
    notes: 'Core AI technologies and applications',
  },
  {
    id: 'subj-2',
    subjectId: 'ml-1',
    subjectName: 'Machine Learning',
    subjectSlug: 'machine-learning',
    addedAt: '2024-01-16T14:20:00Z',
    addedById: 'user-2',
  },
  {
    id: 'subj-3',
    subjectId: 'cv-1',
    subjectName: 'Computer Vision',
    subjectSlug: 'computer-vision',
    addedAt: '2024-01-17T09:15:00Z',
    addedById: 'user-1',
    notes: 'Image processing and visual recognition',
  },
  {
    id: 'subj-4',
    subjectId: 'nlp-1',
    subjectName: 'Natural Language Processing',
    subjectSlug: 'natural-language-processing',
    addedAt: '2024-01-18T11:45:00Z',
    addedById: 'user-3',
  },
  {
    id: 'subj-5',
    subjectId: 'bio-1',
    subjectName: 'Biotechnology',
    subjectSlug: 'biotechnology',
    addedAt: '2024-01-19T16:30:00Z',
    addedById: 'user-2',
    notes: 'Genetic engineering and synthetic biology',
  },
];

// Mock categories data
export const mockCategories: SubjectCategory[] = [
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    type: 'default',
    subjects: mockSubjects.slice(0, 2),
    description: 'Default category for new subjects',
  },
  {
    id: 'exclude',
    name: 'Exclude',
    type: 'exclude',
    subjects: [mockSubjects[4]], // Biotechnology in exclude
    description: 'Subjects to exclude from analysis and search results',
  },
  {
    id: 'cat-1',
    name: 'Core Technologies',
    type: 'custom',
    subjects: mockSubjects.slice(2, 4),
  },
];

// Mock analyses data
export const mockAnalyses: MockAnalysis[] = [
  {
    id: 'analysis-1',
    title: 'The Age of Autonomous Commerce',
    description:
      'Societal, industrial, and economic impact as autonomous machines and intelligent agents enter the market.',
    status: 'Complete',
    imageUrl: 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=Auto',
    updatedAt: '2024-03-01T14:20:00Z',
  },
  {
    id: 'analysis-2',
    title: 'Digital Identity Revolution',
    description:
      'How blockchain and AI are reshaping personal identity verification and privacy in the digital age.',
    status: 'In Progress',
    imageUrl: 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=ID',
    updatedAt: '2024-03-15T11:30:00Z',
  },
  {
    id: 'analysis-3',
    title: 'Synthetic Biology Markets',
    description:
      'Market analysis of engineered biological systems and their potential to disrupt traditional manufacturing.',
    status: 'Review',
    imageUrl: 'https://via.placeholder.com/100x100/F39C12/FFFFFF?text=Bio',
    updatedAt: '2024-03-10T16:45:00Z',
  },
];

// Navigation items for the sticky tab bar
export const navigationItems = [
  { id: 'horizon-chart', label: 'Horizon Chart' },
  { id: 'lab-analyses', label: 'Lab Analyses' },
  { id: 'analysis-tools', label: 'Analysis Tools' },
  { id: 'knowledgebase', label: 'Knowledgebase' },
  { id: 'additional-tools', label: 'Additional Tools' },
];
