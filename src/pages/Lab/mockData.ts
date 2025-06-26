import type {
  LabSubject,
  SubjectCategory,
  MockAnalysis,
  ApiLabData,
  SubjectData,
  AnalysisData,
  SubjectSearchResult,
} from './types';

// ============================================================================
// Mock API Data - Updated with Correct Lab ID
// ============================================================================

/**
 * Mock API response that matches the exact API structure you provided
 * Updated with the correct lab ObjectId: 685be19be583f120efbc86d7
 */
export const mockApiLabData: ApiLabData = {
  _id: { $oid: '685be19be583f120efbc86d7' }, // Added the lab ID field
  isArchived: false,
  isDeleted: false,
  deletedAt: null,
  ent_name: 'V2 Test Lab',
  ent_summary:
    'This lab is the very first test lab created in the new MongoDB collection for the V2 version of FAST.',
  kbid: { $uuid: 'af55062d-a126-4656-83ef-f36c69b1e5b4' },
  teamspace_id: null,
  members: [
    {
      fullname: 'Alexandru Catalin Trandafir',
      user_guid: 'd9983-e04eab95-a9c8-4a02-bef3-f74252f8afeb',
      role: 'editor',
    },
    {
      fullname: 'Carlton Lindsay',
      user_guid: 'd9983-2f21552f-ae2c-4b16-9cbd-72acec12ee1a',
      role: 'admin',
    },
  ],
  categories: [
    {
      id: { $uuid: '0e70a4ca-0ba2-47ea-a9ec-55cd07b840fc' },
      name: 'Space',
    },
    {
      id: { $uuid: 'c27b2599-7468-4b67-bb9a-99b17eaa683e' },
      name: 'Sci-Fi',
    },
  ],
  exclude_terms: ['laser', 'nucchatgptlear'],
  include_terms: ['bioreactor', 'solar'],
  subjects: [
    {
      subject_id: { $oid: '685a7649a6627dbb0a2e0003' },
      subject_slug: 'ansible',
      subject_name: 'ansible',
      category: { $uuid: 'c27b2599-7468-4b67-bb9a-99b17eaa683e' },
    },
  ],
  analyses: [
    { $oid: '66a2ab3dcd921cfc507c88fa' },
    { $oid: '66a2ab3dcd921cfc507c8906' },
  ],
  goals: [
    {
      id: { $uuid: 'c75ee40e-5b5a-4e5c-b7a7-c723a1add5c3' },
      target_user_groups: [
        { name: 'Astronauts', number: { $numberInt: '42' } },
        { name: 'Aliens', number: { $numberInt: '69' } },
      ],
      problem_statement:
        'Astronauts and Aliens have a difficult time finding partners for cross-species dating',
      goal_statement: 'Connect 42 Astronauts with 69 Aliens by 2027',
      impact_score: { $numberInt: '10' },
      weight: { $numberInt: '100' },
      goal_year: { $date: '2027-01-01T00:00:00.000Z' },
    },
  ],
  miro_board_url: 'miro url',
  idea_seeds: [{ $oid: '685a7649a6627dbb0a2e0003' }],
};

/**
 * Mock archived lab data
 */
export const mockArchivedLabData: ApiLabData = {
  ...mockApiLabData,
  _id: { $oid: '685be19be583f120efbc86d8' }, // Different ID for archived lab
  isArchived: true,
  ent_name: 'Archived Test Lab',
  ent_summary: 'This lab has been archived for testing purposes.',
};

/**
 * Mock deleted lab data
 */
export const mockDeletedLabData: ApiLabData = {
  ...mockApiLabData,
  _id: { $oid: '685be19be583f120efbc86d9' }, // Different ID for deleted lab
  isArchived: true,
  isDeleted: true,
  deletedAt: '2024-03-15T10:30:00.000Z',
  ent_name: 'Deleted Test Lab',
  ent_summary: 'This lab has been deleted for testing purposes.',
};

/**
 * Mock lab data lookup by ID
 */
export const mockLabDataLookup: Record<string, ApiLabData> = {
  '685be19be583f120efbc86d7': mockApiLabData,
  '685be19be583f120efbc86d8': mockArchivedLabData,
  '685be19be583f120efbc86d9': mockDeletedLabData,
};

/**
 * Mock subject data using the actual API structure you provided
 */
export const mockSubjectDataLookup: Record<string, SubjectData> = {
  '685a7649a6627dbb0a2e0003': {
    _id: '685a7649a6627dbb0a2e0003',
    Google_hitcounts: 1200000,
    Papers_hitcounts: 15000,
    Books_hitcounts: 50000,
    Gnews_hitcounts: 25,
    Related_terms:
      'configuration management, automation, devops, infrastructure as code, orchestration',
    wikipedia_definition:
      'Ansible is an open-source software provisioning, configuration management, and application-deployment tool enabling infrastructure as code.',
    wiktionary_definition: '',
    FST: 'https://futurity.science/ansible',
    labs: 'TO, rh, tu',
    wikipedia_url: 'https://en.wikipedia.org/wiki/Ansible_(software)',
    ent_name: 'ansible',
    ent_fsid: 'fsid_ansible',
    ent_summary:
      'Ansible is an open-source automation tool used for configuration management, application deployment, and task automation across multiple systems.',
  },
  '65438907708a9fc0c2d1f1a4': {
    _id: '65438907708a9fc0c2d1f1a4',
    Google_hitcounts: 5610000,
    Papers_hitcounts: 0,
    Books_hitcounts: 1000000,
    Gnews_hitcounts: 11,
    Related_terms:
      '21st century skills, 21st century, Soft skills, Deeper learning, Kahoot!, Progressive education, Challenge-based learning, Delhi Board of School Education, Learning, Blended learning',
    wikipedia_definition:
      '21st century skills: 21st century skills comprise skills, abilities, and learning dispositions identified as requirements for success in 21st century society and workplaces by educators, business leaders, academics, and governmental agencies. This is part of an international movement focusing on the skills required for students to prepare for workplace success in a rapidly changing, digital society. Many of these skills are associated with deeper learning, which is based on mastering skills such as analytic reasoning, complex problem solving, and teamwork, which differ from traditional academic skills as these are not content knowledge-based.',
    wiktionary_definition: '',
    FST: 'https://futurity.science/21st_century_skills',
    labs: 'TO, gg, sv',
    wikipedia_url: 'https://en.wikipedia.org/wiki/21st_century_skills',
    ent_name: '21st century skills',
    ent_fsid: 'fsid_21st_century_skills',
    ent_summary:
      "21st century skills encompass abilities and dispositions crucial for success in today's evolving society and workplaces, emphasizing analytical reasoning, problem solving, teamwork, digital literacy, adaptability, and interpersonal skills among other traits.",
    indexes: [
      {
        HR: 2.3,
        TT: 1.5,
        WS: 3.8,
      },
    ],
  },
  '65438943708a9fc0c2d1f4e1': {
    _id: '65438943708a9fc0c2d1f4e1',
    Google_hitcounts: 0,
    Papers_hitcounts: 0,
    Books_hitcounts: 0,
    Gnews_hitcounts: 0,
    Related_terms: '',
    wikipedia_definition: '',
    wiktionary_definition: '',
    FST: 'https://futurity.science/computer_vision',
    labs: 'TO, rh, tu, i1, co',
    wikipedia_url: 'wikipedia URL not found',
    ent_name: 'computer vision',
    ent_fsid: 'fsid_computer_vision',
    ent_summary:
      'Computer vision encompasses the understanding and processing of visual data using computers, focusing on elements such as object recognition, pose estimation, and feature extraction. Various concepts like homography, stereo vision, and deep learning models like AlexNet play crucial roles in advancing the field, evident in events like the Conference on Computer Vision and Pattern Recognition.',
  },
};

/**
 * Mock analysis data that would be fetched by ObjectId
 */
export const mockAnalysisDataLookup: Record<string, AnalysisData> = {
  '66a2ab3dcd921cfc507c88fa': {
    id: '66a2ab3dcd921cfc507c88fa',
    title: 'The Age of Autonomous Commerce',
    description:
      'Societal, industrial, and economic impact as autonomous machines and intelligent agents enter the market.',
    status: 'Complete',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-01T14:20:00Z',
    createdById: 'd9983-e04eab95-a9c8-4a02-bef3-f74252f8afeb',
  },
  '66a2ab3dcd921cfc507c8906': {
    id: '66a2ab3dcd921cfc507c8906',
    title: 'Digital Identity Revolution',
    description:
      'How blockchain and AI are reshaping personal identity verification and privacy in the digital age.',
    status: 'In Progress',
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-03-15T11:30:00Z',
    createdById: 'd9983-2f21552f-ae2c-4b16-9cbd-72acec12ee1a',
  },
  '66a2ab3dcd921cfc507c8917': {
    id: '66a2ab3dcd921cfc507c8917',
    title: 'Space-Based Manufacturing Systems',
    description:
      'Analysis of manufacturing opportunities in zero-gravity environments and orbital facilities.',
    status: 'Review',
    createdAt: '2024-02-15T14:45:00Z',
    updatedAt: '2024-03-10T16:45:00Z',
    createdById: 'd9983-e04eab95-a9c8-4a02-bef3-f74252f8afeb',
  },
};

/**
 * Mock search results using the actual search API structure you provided
 */
export const mockSearchResults: SubjectSearchResult[] = [
  {
    _id: { $oid: '65438943708a9fc0c2d1f4e1' },
    ent_name: 'computer vision',
    ent_fsid: 'fsid_computer_vision',
    ent_summary:
      'Computer vision encompasses the understanding and processing of visual data using computers, focusing on elements such as object recognition, pose estimation, and feature extraction. Various concepts like homography, stereo vision, and deep learning models like AlexNet play crucial roles in advancing the field, evident in events like the Conference on Computer Vision and Pattern Recognition.',
  },
  {
    _id: { $oid: '67126070a62f0a82562fa6e6' },
    ent_name: 'computer vision challenges',
    ent_fsid: 'fsid_computer_vision_challenges',
    ent_summary:
      'Computer vision challenges involve acquiring, processing, and understanding digital images to extract information for decision-making. This field encompasses various tasks such as scene reconstruction, object detection, activity recognition, and 3D pose estimation, applying theories and models to construct computer vision systems.',
  },
  {
    _id: { $oid: '67126070a62f0a82562fa6ea' },
    ent_name: 'computer vision applications',
    ent_fsid: 'fsid_computer_vision_applications',
    ent_summary:
      'Computer vision applications encompass methods for processing digital images to extract data and understand the real world, leading to numerical or symbolic information for decision-making. This field involves tasks like scene reconstruction, object detection, activity recognition, and image restoration, utilizing theories from geometry, physics, statistics, and learning theory to develop artificial systems that interpret visual data from different sources like cameras, 3D scanners, or medical devices.',
  },
  {
    _id: { $oid: '67126070a62f0a82562fa6ee' },
    ent_name: 'computer vision algorithms',
    ent_fsid: 'fsid_computer_vision_algorithms',
    ent_summary:
      'Computer vision algorithms are methods and theories used to process digital images, extract data, and understand visual information in order to make decisions or take appropriate actions. This scientific discipline involves extracting information from various forms of image data, such as video sequences, 3D scans, or medical imaging, and applying models to create computer vision systems for tasks like object detection, scene reconstruction, and activity recognition.',
  },
  {
    _id: { $oid: '685a7649a6627dbb0a2e0008' },
    ent_name: 'quantum computing',
    ent_fsid: 'fsid_quantum_computing',
    ent_summary:
      'Quantum computing harnesses quantum mechanical phenomena such as superposition and entanglement to process information in ways fundamentally different from classical computing, potentially solving certain problems exponentially faster.',
  },
  {
    _id: { $oid: '685a7649a6627dbb0a2e0009' },
    ent_name: 'machine learning',
    ent_fsid: 'fsid_machine_learning',
    ent_summary:
      'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed, using algorithms to identify patterns in data.',
  },
];

/**
 * Mock function for searching subjects using the actual API structure
 */
export const mockSearchSubjects = async (query: string) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    results: {
      keyword: query,
      exact_match: mockSearchResults.find(
        (result) => result.ent_name.toLowerCase() === query.toLowerCase()
      ),
      rows: mockSearchResults.filter(
        (subject) =>
          subject.ent_name.toLowerCase().includes(query.toLowerCase()) ||
          subject.ent_summary.toLowerCase().includes(query.toLowerCase())
      ),
      count: mockSearchResults.filter(
        (subject) =>
          subject.ent_name.toLowerCase().includes(query.toLowerCase()) ||
          subject.ent_summary.toLowerCase().includes(query.toLowerCase())
      ).length,
    },
  };
};

// ============================================================================
// Frontend Mock Data (Transformed from API)
// ============================================================================

/**
 * Mock frontend subjects data (transformed from API structure)
 */
export const mockSubjects: LabSubject[] = [
  {
    id: 'lab-subj-1',
    subjectId: '685a7649a6627dbb0a2e0003',
    subjectName: 'ansible',
    subjectSlug: 'ansible',
    categoryId: 'c27b2599-7468-4b67-bb9a-99b17eaa683e',
    addedAt: '2024-01-15T10:30:00Z',
    addedById: 'd9983-e04eab95-a9c8-4a02-bef3-f74252f8afeb',
    notes: 'Configuration management and automation tool',
  },
];

/**
 * Mock frontend categories data with subjects properly distributed
 */
export const mockCategories: SubjectCategory[] = [
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    type: 'default',
    subjects: [], // New subjects will be added here by default
    description: 'Default category for new subjects',
  },
  {
    id: '0e70a4ca-0ba2-47ea-a9ec-55cd07b840fc',
    name: 'Space',
    type: 'custom',
    subjects: [], // No subjects in this category yet
  },
  {
    id: 'c27b2599-7468-4b67-bb9a-99b17eaa683e',
    name: 'Sci-Fi',
    type: 'custom',
    subjects: mockSubjects.filter(
      (s) => s.categoryId === 'c27b2599-7468-4b67-bb9a-99b17eaa683e'
    ),
  },
];

/**
 * Mock analyses data for the lab
 */
export const mockAnalyses: MockAnalysis[] = [
  {
    id: '66a2ab3dcd921cfc507c88fa',
    title: 'The Age of Autonomous Commerce',
    description:
      'Societal, industrial, and economic impact as autonomous machines and intelligent agents enter the market.',
    status: 'Complete',
    imageUrl: 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=Auto',
    updatedAt: '2024-03-01T14:20:00Z',
  },
  {
    id: '66a2ab3dcd921cfc507c8906',
    title: 'Digital Identity Revolution',
    description:
      'How blockchain and AI are reshaping personal identity verification and privacy in the digital age.',
    status: 'In Progress',
    imageUrl: 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=ID',
    updatedAt: '2024-03-15T11:30:00Z',
  },
  {
    id: '66a2ab3dcd921cfc507c8917',
    title: 'Space-Based Manufacturing Systems',
    description:
      'Analysis of manufacturing opportunities in zero-gravity environments and orbital facilities.',
    status: 'Review',
    imageUrl: 'https://via.placeholder.com/100x100/F39C12/FFFFFF?text=Space',
    updatedAt: '2024-03-10T16:45:00Z',
  },
];

/**
 * Navigation items for the sticky tab bar
 */
export const navigationItems = [
  { id: 'horizon-chart', label: 'Horizon Chart' },
  { id: 'lab-analyses', label: 'Lab Analyses' },
  { id: 'analysis-tools', label: 'Analysis Tools' },
  { id: 'knowledgebase', label: 'Knowledgebase' },
  { id: 'additional-tools', label: 'Additional Tools' },
];

// ============================================================================
// Mock API Functions (for testing without real backend)
// ============================================================================

/**
 * Mock function to fetch lab data by ObjectId
 */
export const mockFetchLabData = async (labId: string): Promise<ApiLabData> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const labData = mockLabDataLookup[labId];
  if (!labData) {
    throw new Error(`Lab with ID "${labId}" not found`);
  }

  return labData;
};

/**
 * Mock function to fetch subject data by ObjectId
 */
export const mockFetchSubjectData = async (
  objectId: string
): Promise<SubjectData> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const subjectData = mockSubjectDataLookup[objectId];
  if (!subjectData) {
    throw new Error(`Subject with ObjectId "${objectId}" not found`);
  }

  return subjectData;
};

/**
 * Mock function to fetch analysis data by ObjectId
 */
export const mockFetchAnalysisData = async (
  objectId: string
): Promise<AnalysisData> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const analysisData = mockAnalysisDataLookup[objectId];
  if (!analysisData) {
    throw new Error(`Analysis with ObjectId "${objectId}" not found`);
  }

  return analysisData;
};

/**
 * Mock function to update lab data
 */
export const mockUpdateLabData = async (
  labId: string,
  updateData: any
): Promise<ApiLabData> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`Mock updating lab ${labId} with:`, updateData);

  const currentLabData = mockLabDataLookup[labId];
  if (!currentLabData) {
    throw new Error(`Lab with ID "${labId}" not found`);
  }

  // In a real implementation, this would merge the update data with existing lab data
  const updatedLab = {
    ...currentLabData,
    ...updateData,
  };

  // Update the lookup table
  mockLabDataLookup[labId] = updatedLab;

  return updatedLab;
};
