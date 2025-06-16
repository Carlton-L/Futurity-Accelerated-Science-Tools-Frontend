import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Checkbox,
  Flex,
} from '@chakra-ui/react';
import CardScroller from '../../components/shared/CardScroller';
import Horizons from './Horizons';

// Import types from Gather
interface LabSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  addedAt: string;
  addedById: string;
  notes?: string;
}

interface SubjectCategory {
  id: string;
  name: string;
  type: 'default' | 'exclude' | 'custom';
  subjects: LabSubject[];
  description?: string;
}

// Horizon chart data structure (matches the original Horizons component)
interface HorizonItem {
  name: string;
  horizon: 1 | 2 | 3 | 4;
  category: 1 | 2 | 3 | 4 | 5;
  type: 1 | 2 | 3;
  categoryName?: string; // Optional category name for display
}

interface AnalyzeProps {
  labId: string;
}

// Mock data - same as Gather tab
const mockSubjects: LabSubject[] = [
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

const mockCategories: SubjectCategory[] = [
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

const mockAnalyses = [
  {
    id: 'analysis-1',
    title: 'The Age of Autonomous Commerce',
    description:
      'Societal, industrial, and economic impact as autonomous machines and intelligent agents enter the market.',
    status: 'Complete' as const,
    imageUrl: 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=Auto',
    updatedAt: '2024-03-01T14:20:00Z',
  },
  {
    id: 'analysis-2',
    title: 'Digital Identity Revolution',
    description:
      'How blockchain and AI are reshaping personal identity verification and privacy in the digital age.',
    status: 'In Progress' as const,
    imageUrl: 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=ID',
    updatedAt: '2024-03-15T11:30:00Z',
  },
  {
    id: 'analysis-3',
    title: 'Synthetic Biology Markets',
    description:
      'Market analysis of engineered biological systems and their potential to disrupt traditional manufacturing.',
    status: 'Review' as const,
    imageUrl: 'https://via.placeholder.com/100x100/F39C12/FFFFFF?text=Bio',
    updatedAt: '2024-03-10T16:45:00Z',
  },
];

// Helper functions
const convertHorizonValue = (horizon: number): 1 | 2 | 3 | 4 => {
  if (horizon <= 0.25) return 4; // Idea
  if (horizon <= 0.5) return 3; // Science
  if (horizon <= 0.75) return 2; // Engineering
  return 1; // Business
};

const getCategoryNumber = (
  categoryName: string,
  categoryNames: string[]
): 1 | 2 | 3 | 4 | 5 => {
  const index = categoryNames.indexOf(categoryName);
  const categoryNum = index >= 0 ? index + 1 : 1;
  // Ensure we return a value within the expected range
  return Math.min(categoryNum, 5) as 1 | 2 | 3 | 4 | 5;
};

const Analyze: React.FC<AnalyzeProps> = ({ labId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most-recent');

  // Horizon chart subject selection
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set()
  );

  // Analysis state
  const [analysisSelectedSubjects, setAnalysisSelectedSubjects] = useState<
    Set<string>
  >(new Set());
  const [analysisType, setAnalysisType] = useState<
    'patent' | 'taxonomy' | 'research' | 'investment'
  >('patent');
  const [excludeTerms, setExcludeTerms] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isCopyingAnalysis, setIsCopyingAnalysis] = useState(false);

  // Get all subjects from categories (excluding the exclude category)
  const allSubjects = useMemo(() => {
    return mockCategories
      .filter((cat) => cat.type !== 'exclude')
      .flatMap((cat) => cat.subjects);
  }, []);

  // Get category names used by subjects (excluding exclude category)
  const usedCategoryNames = useMemo(() => {
    const categories = mockCategories
      .filter((cat) => cat.type !== 'exclude')
      .map((cat) => cat.name);
    return Array.from(new Set(categories)).sort();
  }, []);

  // Get excluded subjects from the "Exclude" category
  const excludedSubjects = useMemo(() => {
    const excludeCategory = mockCategories.find(
      (cat) => cat.type === 'exclude'
    );
    return excludeCategory?.subjects || [];
  }, []);

  // Load selected subjects from localStorage on mount
  useEffect(() => {
    const storageKey = `lab-${labId}-selected-subjects`;
    const savedSelections = localStorage.getItem(storageKey);

    if (savedSelections) {
      try {
        const parsed = JSON.parse(savedSelections);
        setSelectedSubjects(new Set(parsed));
      } catch (error) {
        console.error('Failed to parse saved subject selections:', error);
        // Default to all subjects
        setSelectedSubjects(new Set(allSubjects.map((s) => s.id)));
      }
    } else {
      // Default to all subjects selected
      setSelectedSubjects(new Set(allSubjects.map((s) => s.id)));
    }
  }, [labId, allSubjects]);

  // Save selected subjects to localStorage whenever selection changes
  useEffect(() => {
    const storageKey = `lab-${labId}-selected-subjects`;
    localStorage.setItem(
      storageKey,
      JSON.stringify(Array.from(selectedSubjects))
    );
  }, [labId, selectedSubjects]);

  // Initialize analysis selections and exclude terms
  useEffect(() => {
    // Default all subjects selected for analysis
    setAnalysisSelectedSubjects(new Set(allSubjects.map((s) => s.id)));

    // Set default exclude terms from excluded subjects
    const excludeSubjectNames = excludedSubjects.map((s) => s.subjectName);
    setExcludeTerms(excludeSubjectNames.join(', '));
  }, [allSubjects, excludedSubjects]);

  // Filter and sort analyses
  const filteredAndSortedAnalyses = useMemo(() => {
    const filtered = mockAnalyses.filter((analysis) => {
      const matchesSearch =
        searchQuery === '' ||
        analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    switch (sortBy) {
      case 'most-recent':
        return filtered.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case 'oldest':
        return filtered.sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      case 'a-z':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return filtered.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return filtered;
    }
  }, [searchQuery, sortBy]);

  // Convert selected subjects to horizon chart data
  const horizonData = useMemo((): HorizonItem[] => {
    return allSubjects
      .filter((subject) => selectedSubjects.has(subject.id))
      .map((subject) => {
        // Find which category this subject belongs to
        const category = mockCategories.find((cat) =>
          cat.subjects.some((s) => s.id === subject.id)
        );

        // Use a deterministic horizon value based on subject name for consistency
        // This prevents positions from changing randomly on each render
        const nameHash = subject.subjectName.split('').reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);
        const normalizedHash = Math.abs(nameHash) / 2147483648; // Normalize to 0-1

        return {
          name: subject.subjectName,
          horizon: convertHorizonValue(normalizedHash),
          category: getCategoryNumber(
            category?.name || 'Uncategorized',
            usedCategoryNames
          ),
          type: 1, // All subjects use same type for now
          categoryName: category?.name || 'Uncategorized', // Add category name for display
        };
      });
  }, [allSubjects, selectedSubjects, usedCategoryNames]);

  // Group subjects by selection status and category
  const groupedSubjects = useMemo(() => {
    const selected: LabSubject[] = [];
    const unselected: LabSubject[] = [];

    allSubjects.forEach((subject) => {
      if (selectedSubjects.has(subject.id)) {
        selected.push(subject);
      } else {
        unselected.push(subject);
      }
    });

    return { selected, unselected };
  }, [allSubjects, selectedSubjects]);

  // Group analysis subjects by selection status
  const groupedAnalysisSubjects = useMemo(() => {
    const selected: LabSubject[] = [];
    const unselected: LabSubject[] = [];

    allSubjects.forEach((subject) => {
      if (analysisSelectedSubjects.has(subject.id)) {
        selected.push(subject);
      } else {
        unselected.push(subject);
      }
    });

    return { selected, unselected };
  }, [allSubjects, analysisSelectedSubjects]);

  const handleAnalysisClick = useCallback(
    (analysisId: string) => {
      console.log(`Navigate to analysis: /lab/${labId}/analysis/${analysisId}`);
    },
    [labId]
  );

  const handleSubjectToggle = useCallback((subjectId: string) => {
    setSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedSubjects(new Set(allSubjects.map((s) => s.id)));
  }, [allSubjects]);

  const handleDeselectAll = useCallback(() => {
    setSelectedSubjects(new Set());
  }, []);

  // Analysis handlers
  const handleAnalysisSubjectToggle = useCallback((subjectId: string) => {
    setAnalysisSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  }, []);

  const handleAnalysisSelectAll = useCallback(() => {
    setAnalysisSelectedSubjects(new Set(allSubjects.map((s) => s.id)));
  }, [allSubjects]);

  const handleAnalysisDeselectAll = useCallback(() => {
    setAnalysisSelectedSubjects(new Set());
  }, []);

  const handleGenerateAnalysis = useCallback(async () => {
    if (analysisSelectedSubjects.size === 0) return;

    setIsGeneratingAnalysis(true);
    setAnalysisResult('');

    try {
      // Get selected subject names for the analysis
      const selectedSubjectNames = allSubjects
        .filter((subject) => analysisSelectedSubjects.has(subject.id))
        .map((subject) => subject.subjectName);

      // Parse exclude terms (only for analyses that support them)
      const excludeTermsList = excludeTerms
        .split(',')
        .map((term) => term.trim())
        .filter((term) => term.length > 0);

      // Simulate API call - in real implementation, this would call your analysis API
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Generate different mock results based on analysis type
      let mockResult = '';

      switch (analysisType) {
        case 'patent':
          mockResult = `PATENT LANDSCAPE ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

ANALYSIS SCOPE:
Subjects Analyzed: ${selectedSubjectNames.join(', ')}
${
  excludeTermsList.length > 0
    ? `Excluded Terms: ${excludeTermsList.join(', ')}`
    : 'No exclusion terms specified'
}

EXECUTIVE SUMMARY:
This patent landscape analysis examines ${
            analysisSelectedSubjects.size
          } technology area${
            analysisSelectedSubjects.size !== 1 ? 's' : ''
          } to identify key patent trends, competitive positioning, and innovation opportunities.

KEY FINDINGS:

1. PATENT VOLUME ANALYSIS
   - Total relevant patents identified: 2,847
   - Filing trend: 15% increase over last 3 years
   - Geographic distribution: 45% US, 32% China, 12% Europe, 11% Other

2. TOP PATENT HOLDERS
   - Company A: 312 patents (11.0%)
   - Company B: 287 patents (10.1%)
   - Company C: 241 patents (8.5%)
   - Universities: 623 patents (21.9%)
   - Individual inventors: 178 patents (6.3%)

3. TECHNOLOGY CLUSTERS
   ${selectedSubjectNames
     .map(
       (subject) =>
         `   - ${subject}: ${Math.floor(Math.random() * 500 + 200)} patents`
     )
     .join('\n')}

4. INNOVATION GAPS
   - Emerging areas with low patent density identified
   - Potential white space opportunities in cross-technology applications
   - Recent surge in patents related to integration technologies

5. COMPETITIVE LANDSCAPE
   - High concentration in core technologies
   - Fragmented patent ownership in emerging areas
   - Strong university research presence indicates active R&D

RECOMMENDATIONS:
1. Monitor patent filings in identified white space areas
2. Consider strategic partnerships with key patent holders
3. Focus R&D efforts on underexplored technology intersections
4. Evaluate patent acquisition opportunities in complementary areas

METHODOLOGY:
- Search conducted across major patent databases
- Analysis period: 2019-2024
- Classification codes: Multiple IPC and CPC codes analyzed
- Quality filtering applied to exclude low-relevance patents
${
  excludeTermsList.length > 0
    ? `- Exclusion filtering removed patents containing: ${excludeTermsList.join(
        ', '
      )}`
    : ''
}

This analysis provides a foundation for strategic patent planning and competitive intelligence.

---
Report generated by Patent Landscape Analysis System`;
          break;

        case 'taxonomy':
          mockResult = `TAXONOMY ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

ANALYSIS SCOPE:
Subjects Analyzed: ${selectedSubjectNames.join(', ')}

EXECUTIVE SUMMARY:
This taxonomy analysis provides definitions, related terms, and relationships for ${
            analysisSelectedSubjects.size
          } subject${
            analysisSelectedSubjects.size !== 1 ? 's' : ''
          } within the FS Taxonomy and other structured classification systems.

SUBJECT DEFINITIONS AND RELATIONSHIPS:

${selectedSubjectNames
  .map(
    (subject) =>
      `${subject.toUpperCase()}:
   Definition: Advanced technology domain focused on ${subject.toLowerCase()} applications and methodologies
   Related Terms: [Auto-generated based on taxonomy analysis]
   Classification: Level 2 Technology Category
   Parent Categories: Technology, Innovation, Research
   Child Categories: [Specific subcategories identified]
   Cross-references: Connected to ${Math.floor(
     Math.random() * 5 + 2
   )} related domains`
  )
  .join('\n\n')}

TAXONOMY STRUCTURE:
1. Primary Classifications
2. Secondary Relationships
3. Cross-domain Connections
4. Emerging Category Trends

STRUCTURED SOURCE COMPARISON:
- FS Taxonomy alignment: 87% coverage
- Industry standard taxonomies: 92% compatibility
- Academic classification systems: 78% overlap
- Government category frameworks: 83% match

RECOMMENDATIONS:
1. Standardize terminology across identified subjects
2. Develop clear hierarchical relationships
3. Monitor emerging classification trends
4. Maintain taxonomy currency with industry evolution

---
Report generated by Taxonomy Analysis System`;
          break;

        case 'research':
          mockResult = `RESEARCH LANDSCAPE ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

ANALYSIS SCOPE:
Subjects Analyzed: ${selectedSubjectNames.join(', ')}
${
  excludeTermsList.length > 0
    ? `Excluded Terms: ${excludeTermsList.join(', ')}`
    : 'No exclusion terms specified'
}

EXECUTIVE SUMMARY:
This research landscape analysis examines scientific publishing trends across ${
            analysisSelectedSubjects.size
          } subject area${
            analysisSelectedSubjects.size !== 1 ? 's' : ''
          } to identify research patterns, key institutions, and emerging topics.

KEY FINDINGS:

1. PUBLICATION VOLUME ANALYSIS
   - Total relevant papers identified: 15,423
   - Publishing trend: 22% increase over last 5 years
   - Average citations per paper: 12.4
   - Open access percentage: 67%

2. TOP RESEARCH INSTITUTIONS
   - MIT: 1,247 papers (8.1%)
   - Stanford University: 1,156 papers (7.5%)
   - University of California System: 987 papers (6.4%)
   - Carnegie Mellon University: 834 papers (5.4%)
   - International collaborations: 2,341 papers (15.2%)

3. RESEARCH FOCUS AREAS
   ${selectedSubjectNames
     .map(
       (subject) =>
         `   - ${subject}: ${Math.floor(
           Math.random() * 3000 + 1000
         )} papers, avg ${Math.floor(Math.random() * 20 + 5)} citations`
     )
     .join('\n')}

4. EMERGING RESEARCH TRENDS
   - Interdisciplinary approaches showing 35% growth
   - Industry-academia collaborations increasing
   - Focus shift toward practical applications
   - Rise in reproducibility studies

5. PUBLICATION PATTERNS
   - Peak publishing months: March, September, November
   - Conference vs journal ratio: 60:40
   - International collaboration rate: 34%
   - Average time from submission to publication: 8.2 months

RESEARCH GAPS AND OPPORTUNITIES:
1. Underexplored intersections between subjects
2. Limited longitudinal studies identified
3. Geographic research distribution imbalances
4. Potential for novel methodology applications

METHODOLOGY:
- Search conducted across academic databases (PubMed, arXiv, IEEE, ACM)
- Analysis period: 2019-2024
- Quality filtering for peer-reviewed publications
- Citation analysis using multiple metrics
${
  excludeTermsList.length > 0
    ? `- Exclusion filtering removed papers containing: ${excludeTermsList.join(
        ', '
      )}`
    : ''
}

---
Report generated by Research Landscape Analysis System`;
          break;

        case 'investment':
          mockResult = `INVESTMENT ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

ANALYSIS SCOPE:
Subjects Analyzed: ${selectedSubjectNames.join(', ')}
${
  excludeTermsList.length > 0
    ? `Excluded Terms: ${excludeTermsList.join(', ')}`
    : 'No exclusion terms specified'
}

EXECUTIVE SUMMARY:
This investment analysis examines venture capital and funding trends across companies operating in ${
            analysisSelectedSubjects.size
          } technology area${analysisSelectedSubjects.size !== 1 ? 's' : ''}.

KEY FINDINGS:

1. INVESTMENT VOLUME ANALYSIS
   - Total funding identified: $24.7B across 2,156 companies
   - Average deal size: $11.5M
   - Year-over-year growth: 18% increase in total funding
   - Active investors: 1,247 firms

2. TOP INVESTORS BY VOLUME
   - Andreessen Horowitz: $1.2B across 47 deals
   - Sequoia Capital: $987M across 34 deals
   - Google Ventures: $834M across 52 deals
   - Intel Capital: $723M across 28 deals
   - Strategic corporate investors: $8.9B (36% of total)

3. INVESTMENT BY SUBJECT AREA
   ${selectedSubjectNames
     .map(
       (subject) =>
         `   - ${subject}: $${(Math.random() * 5 + 1).toFixed(
           1
         )}B across ${Math.floor(Math.random() * 300 + 100)} companies`
     )
     .join('\n')}

4. FUNDING STAGE DISTRIBUTION
   - Seed/Pre-seed: 34% of deals, $892M total
   - Series A: 28% of deals, $4.2B total
   - Series B: 18% of deals, $6.1B total
   - Series C+: 12% of deals, $9.8B total
   - Late stage/Growth: 8% of deals, $3.7B total

5. GEOGRAPHIC DISTRIBUTION
   - Silicon Valley: 42% of total funding
   - New York: 18% of total funding
   - Boston: 12% of total funding
   - International: 28% of total funding

MARKET TRENDS:
1. Increased focus on AI integration across all sectors
2. Sustainability and ESG considerations gaining importance
3. Corporate venture capital participation growing
4. Longer time to exit but higher valuations

INVESTMENT OPPORTUNITIES:
1. Early-stage companies in emerging intersections
2. B2B solutions showing strong traction
3. International expansion opportunities
4. Acquisition targets for strategic buyers

RISK FACTORS:
1. Market saturation in core areas
2. Regulatory uncertainty in emerging technologies
3. Talent acquisition competition
4. Economic sensitivity of growth-stage companies

METHODOLOGY:
- Data sourced from Crunchbase, PitchBook, and public filings
- Analysis period: 2019-2024
- Includes venture capital, growth equity, and strategic investments
- Private company valuations estimated where not disclosed
${
  excludeTermsList.length > 0
    ? `- Exclusion filtering removed companies containing: ${excludeTermsList.join(
        ', '
      )}`
    : ''
}

---
Report generated by Investment Analysis System`;
          break;
      }

      setAnalysisResult(mockResult);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      setAnalysisResult(
        'Error: Failed to generate analysis. Please try again.'
      );
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }, [analysisSelectedSubjects, allSubjects, excludeTerms, analysisType]);

  const handleCopyAnalysis = useCallback(async () => {
    if (!analysisResult) return;

    try {
      await navigator.clipboard.writeText(analysisResult);
      setIsCopyingAnalysis(true);
      setTimeout(() => setIsCopyingAnalysis(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = analysisResult;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopyingAnalysis(true);
      setTimeout(() => setIsCopyingAnalysis(false), 2000);
    }
  }, [analysisResult]);

  return (
    <VStack gap={6} align='stretch'>
      {/* Header */}
      <Heading as='h2' size='lg'>
        Analyses
      </Heading>

      {/* Horizon Chart with Subject Selection */}
      <Card.Root>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            <Heading as='h3' size='md'>
              Horizon Chart
            </Heading>

            <Flex gap={6} align='flex-start'>
              {/* Subject Selection Panel */}
              <Box minW='300px' maxW='300px'>
                <VStack gap={4} align='stretch'>
                  <HStack justify='space-between' align='center'>
                    <Text fontSize='sm' fontWeight='medium'>
                      Select Subjects ({selectedSubjects.size}/
                      {allSubjects.length})
                    </Text>
                    <HStack gap={2}>
                      <Button
                        size='xs'
                        variant='ghost'
                        onClick={handleSelectAll}
                      >
                        All
                      </Button>
                      <Button
                        size='xs'
                        variant='ghost'
                        onClick={handleDeselectAll}
                      >
                        None
                      </Button>
                    </HStack>
                  </HStack>

                  <Box
                    maxH='500px'
                    overflowY='auto'
                    border='1px solid'
                    borderColor='gray.200'
                    borderRadius='md'
                    p={3}
                  >
                    <VStack gap={2} align='stretch'>
                      {/* Selected subjects first */}
                      {groupedSubjects.selected.length > 0 && (
                        <>
                          <Text
                            fontSize='xs'
                            fontWeight='bold'
                            color='green.600'
                            textTransform='uppercase'
                          >
                            Included ({groupedSubjects.selected.length})
                          </Text>
                          {groupedSubjects.selected.map((subject) => (
                            <HStack key={subject.id} gap={2} align='center'>
                              <Checkbox.Root
                                checked={selectedSubjects.has(subject.id)}
                                onCheckedChange={() =>
                                  handleSubjectToggle(subject.id)
                                }
                                size='sm'
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Root>
                              <VStack gap={0} align='stretch' flex='1'>
                                <Text fontSize='sm' fontWeight='medium'>
                                  {subject.subjectName}
                                </Text>
                                {subject.notes && (
                                  <Text
                                    fontSize='xs'
                                    color='gray.500'
                                    overflow='hidden'
                                    textOverflow='ellipsis'
                                    whiteSpace='nowrap'
                                  >
                                    {subject.notes}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          ))}
                        </>
                      )}

                      {/* Unselected subjects */}
                      {groupedSubjects.unselected.length > 0 && (
                        <>
                          {groupedSubjects.selected.length > 0 && (
                            <Box height='1px' bg='gray.200' my={2} />
                          )}
                          <Text
                            fontSize='xs'
                            fontWeight='bold'
                            color='gray.500'
                            textTransform='uppercase'
                          >
                            Available ({groupedSubjects.unselected.length})
                          </Text>
                          {groupedSubjects.unselected.map((subject) => (
                            <HStack key={subject.id} gap={2} align='center'>
                              <Checkbox.Root
                                checked={selectedSubjects.has(subject.id)}
                                onCheckedChange={() =>
                                  handleSubjectToggle(subject.id)
                                }
                                size='sm'
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Root>
                              <VStack gap={0} align='stretch' flex='1'>
                                <Text fontSize='sm' fontWeight='medium'>
                                  {subject.subjectName}
                                </Text>
                                {subject.notes && (
                                  <Text
                                    fontSize='xs'
                                    color='gray.500'
                                    overflow='hidden'
                                    textOverflow='ellipsis'
                                    whiteSpace='nowrap'
                                  >
                                    {subject.notes}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          ))}
                        </>
                      )}

                      {allSubjects.length === 0 && (
                        <Text
                          fontSize='sm'
                          color='gray.500'
                          textAlign='center'
                          py={4}
                        >
                          No subjects available. Add subjects in the Gather tab
                          first.
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </Box>

              {/* Horizon Chart */}
              <Box flex='1'>
                {horizonData.length > 0 ? (
                  <Horizons data={horizonData} showLegend={false} />
                ) : (
                  <Flex
                    height='400px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='gray.300'
                    borderRadius='md'
                    bg='gray.50'
                  >
                    <Text color='gray.500' fontSize='sm'>
                      Select subjects to view horizon chart
                    </Text>
                  </Flex>
                )}
              </Box>
            </Flex>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Lab Analyses List with CardScroller */}
      <Card.Root>
        <Card.Body p={4}>
          <VStack gap={3} align='stretch'>
            <Heading as='h3' size='md' flexShrink={0}>
              Lab Analyses
            </Heading>

            <HStack gap={4} align='center' flexShrink={0}>
              <HStack gap={2} align='center'>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='gray.700'
                  whiteSpace='nowrap'
                >
                  Sort by:
                </Text>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    minWidth: '150px',
                    backgroundColor: 'white',
                  }}
                >
                  <option value='most-recent'>Most Recent</option>
                  <option value='oldest'>Oldest</option>
                  <option value='a-z'>A-Z</option>
                  <option value='z-a'>Z-A</option>
                </select>
              </HStack>
              <Input
                placeholder='Filter analyses...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size='sm'
                flex='1'
              />
            </HStack>

            <Box height='1px' bg='gray.200' flexShrink={0} />

            <CardScroller
              height='250px'
              emptyMessage='No analyses found. Create your first analysis to get started!'
            >
              {filteredAndSortedAnalyses.map((analysis) => (
                <Card.Root
                  key={analysis.id}
                  minWidth='280px'
                  maxWidth='280px'
                  height='100%'
                  variant='outline'
                  cursor='pointer'
                  _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
                  onClick={() => handleAnalysisClick(analysis.id)}
                  transition='all 0.2s'
                >
                  <Card.Body
                    p={4}
                    height='100%'
                    display='flex'
                    flexDirection='column'
                  >
                    <VStack gap={3} align='stretch' height='100%'>
                      <HStack gap={3} align='flex-start' flexShrink={0}>
                        <Box
                          width='100px'
                          height='100px'
                          borderRadius='md'
                          overflow='hidden'
                          flexShrink={0}
                        >
                          <img
                            src={analysis.imageUrl}
                            alt={analysis.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                        <VStack gap={2} align='stretch' flex='1'>
                          <Text
                            fontSize='sm'
                            fontWeight='bold'
                            color='blue.600'
                            lineHeight='1.3'
                          >
                            {analysis.title}
                          </Text>
                          <Box
                            bg={
                              analysis.status === 'Complete'
                                ? 'green.100'
                                : analysis.status === 'In Progress'
                                ? 'blue.100'
                                : 'orange.100'
                            }
                            color={
                              analysis.status === 'Complete'
                                ? 'green.800'
                                : analysis.status === 'In Progress'
                                ? 'blue.800'
                                : 'orange.800'
                            }
                            px={2}
                            py={1}
                            borderRadius='md'
                            fontSize='xs'
                            fontWeight='medium'
                            width='fit-content'
                          >
                            {analysis.status}
                          </Box>
                        </VStack>
                      </HStack>

                      <Text
                        fontSize='xs'
                        color='gray.600'
                        lineHeight='1.4'
                        overflow='hidden'
                        textOverflow='ellipsis'
                        display='-webkit-box'
                        flex='1'
                        style={{
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {analysis.description}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </CardScroller>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Analysis Tools */}
      <Card.Root>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            <Heading as='h3' size='md'>
              Analysis Tools
            </Heading>

            {/* Analysis Type Selector */}
            <Box>
              <Text fontSize='sm' fontWeight='medium' mb={2}>
                Analysis Type
              </Text>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as any)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  minWidth: '200px',
                  backgroundColor: 'white',
                }}
              >
                <option value='patent'>Patent Landscape</option>
                <option value='taxonomy'>Taxonomy</option>
                <option value='research'>Research Analysis</option>
                <option value='investment'>Venture Investment</option>
              </select>
            </Box>

            {/* Analysis Type Description */}
            <Box
              p={3}
              bg='blue.50'
              borderRadius='md'
              border='1px solid'
              borderColor='blue.200'
            >
              <Text fontSize='sm' color='blue.800'>
                {analysisType === 'patent' &&
                  'This report provides a patent landscape of the space.'}
                {analysisType === 'taxonomy' &&
                  'In a given Lab, for each subject, it provides the definition and related terms, and their relationships with one another in the FS Taxonomy and other taxonomies. It then compares each subject on each of the structured sources.'}
                {analysisType === 'research' &&
                  'This report examines trends in scientific publishing in the space.'}
                {analysisType === 'investment' &&
                  'This report looks at the companies in each of the taxonomy categories explained in the Taxonomy report, showing their investment history and trends.'}
              </Text>
            </Box>

            <Flex gap={6} align='flex-start'>
              {/* Controls Panel */}
              <Box minW='300px' maxW='300px'>
                <VStack gap={4} align='stretch'>
                  {/* Subject Selection for Analysis */}
                  <Box>
                    <HStack justify='space-between' align='center' mb={2}>
                      <Text fontSize='sm' fontWeight='medium'>
                        Select Subjects ({analysisSelectedSubjects.size}/
                        {allSubjects.length})
                      </Text>
                      <HStack gap={2}>
                        <Button
                          size='xs'
                          variant='ghost'
                          onClick={handleAnalysisSelectAll}
                        >
                          All
                        </Button>
                        <Button
                          size='xs'
                          variant='ghost'
                          onClick={handleAnalysisDeselectAll}
                        >
                          None
                        </Button>
                      </HStack>
                    </HStack>

                    <Box
                      maxH='300px'
                      overflowY='auto'
                      border='1px solid'
                      borderColor='gray.200'
                      borderRadius='md'
                      p={3}
                    >
                      <VStack gap={2} align='stretch'>
                        {/* Selected subjects first */}
                        {groupedAnalysisSubjects.selected.length > 0 && (
                          <>
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='green.600'
                              textTransform='uppercase'
                            >
                              Included (
                              {groupedAnalysisSubjects.selected.length})
                            </Text>
                            {groupedAnalysisSubjects.selected.map((subject) => (
                              <HStack key={subject.id} gap={2} align='center'>
                                <Checkbox.Root
                                  checked={analysisSelectedSubjects.has(
                                    subject.id
                                  )}
                                  onCheckedChange={() =>
                                    handleAnalysisSubjectToggle(subject.id)
                                  }
                                  size='sm'
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                </Checkbox.Root>
                                <VStack gap={0} align='stretch' flex='1'>
                                  <Text fontSize='sm' fontWeight='medium'>
                                    {subject.subjectName}
                                  </Text>
                                  {subject.notes && (
                                    <Text
                                      fontSize='xs'
                                      color='gray.500'
                                      overflow='hidden'
                                      textOverflow='ellipsis'
                                      whiteSpace='nowrap'
                                    >
                                      {subject.notes}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                            ))}
                          </>
                        )}

                        {/* Unselected subjects */}
                        {groupedAnalysisSubjects.unselected.length > 0 && (
                          <>
                            {groupedAnalysisSubjects.selected.length > 0 && (
                              <Box height='1px' bg='gray.200' my={2} />
                            )}
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='gray.500'
                              textTransform='uppercase'
                            >
                              Available (
                              {groupedAnalysisSubjects.unselected.length})
                            </Text>
                            {groupedAnalysisSubjects.unselected.map(
                              (subject) => (
                                <HStack key={subject.id} gap={2} align='center'>
                                  <Checkbox.Root
                                    checked={analysisSelectedSubjects.has(
                                      subject.id
                                    )}
                                    onCheckedChange={() =>
                                      handleAnalysisSubjectToggle(subject.id)
                                    }
                                    size='sm'
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control>
                                      <Checkbox.Indicator />
                                    </Checkbox.Control>
                                  </Checkbox.Root>
                                  <VStack gap={0} align='stretch' flex='1'>
                                    <Text fontSize='sm' fontWeight='medium'>
                                      {subject.subjectName}
                                    </Text>
                                    {subject.notes && (
                                      <Text
                                        fontSize='xs'
                                        color='gray.500'
                                        overflow='hidden'
                                        textOverflow='ellipsis'
                                        whiteSpace='nowrap'
                                      >
                                        {subject.notes}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                              )
                            )}
                          </>
                        )}

                        {allSubjects.length === 0 && (
                          <Text
                            fontSize='sm'
                            color='gray.500'
                            textAlign='center'
                            py={4}
                          >
                            No subjects available. Add subjects in the Gather
                            tab first.
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  </Box>

                  {/* Exclude Terms */}
                  <Box>
                    <Text fontSize='sm' fontWeight='medium' mb={2}>
                      Exclude Terms
                    </Text>
                    <Input
                      placeholder={
                        analysisType === 'taxonomy'
                          ? 'Not applicable for taxonomy analysis'
                          : 'Enter additional terms to exclude (comma-separated)'
                      }
                      value={excludeTerms}
                      onChange={(e) => setExcludeTerms(e.target.value)}
                      size='sm'
                      disabled={analysisType === 'taxonomy'}
                      bg={analysisType === 'taxonomy' ? 'gray.100' : 'white'}
                      color={analysisType === 'taxonomy' ? 'gray.500' : 'black'}
                    />
                    <Text fontSize='xs' color='gray.500' mt={1}>
                      {analysisType === 'taxonomy'
                        ? 'Taxonomy analysis does not use exclusion terms'
                        : 'Results matching these terms will be excluded from analysis'}
                    </Text>
                    {excludedSubjects.length > 0 &&
                      analysisType !== 'taxonomy' && (
                        <Text fontSize='xs' color='blue.600' mt={1}>
                          Auto-included:{' '}
                          {excludedSubjects
                            .map((s) => s.subjectName)
                            .join(', ')}
                        </Text>
                      )}
                  </Box>

                  {/* Generate Button */}
                  <Button
                    colorScheme='blue'
                    onClick={handleGenerateAnalysis}
                    disabled={
                      analysisSelectedSubjects.size === 0 ||
                      isGeneratingAnalysis
                    }
                    size='md'
                    width='100%'
                  >
                    {isGeneratingAnalysis
                      ? 'Generating...'
                      : 'Generate Analysis'}
                  </Button>
                </VStack>
              </Box>

              {/* Results Panel */}
              <Box flex='1'>
                {analysisResult ? (
                  <VStack gap={3} align='stretch'>
                    <HStack justify='space-between' align='center'>
                      <Text fontSize='sm' fontWeight='medium'>
                        {analysisType === 'patent' &&
                          'Patent Landscape Analysis Report'}
                        {analysisType === 'taxonomy' &&
                          'Taxonomy Analysis Report'}
                        {analysisType === 'research' &&
                          'Research Analysis Report'}
                        {analysisType === 'investment' &&
                          'Investment Analysis Report'}
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={handleCopyAnalysis}
                        disabled={isCopyingAnalysis}
                      >
                        {isCopyingAnalysis ? 'Copied!' : 'Copy to Clipboard'}
                      </Button>
                    </HStack>

                    <Box
                      border='1px solid'
                      borderColor='gray.200'
                      borderRadius='md'
                      p={4}
                      bg='white'
                      maxH='500px'
                      overflowY='auto'
                    >
                      <Text
                        fontSize='sm'
                        lineHeight='1.6'
                        whiteSpace='pre-wrap'
                        fontFamily='monospace'
                      >
                        {analysisResult}
                      </Text>
                    </Box>
                  </VStack>
                ) : (
                  <Flex
                    height='300px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='gray.300'
                    borderRadius='md'
                    bg='gray.50'
                  >
                    <VStack gap={2}>
                      <Text color='gray.500' fontSize='sm' textAlign='center'>
                        {analysisSelectedSubjects.size === 0
                          ? 'Select subjects above to generate analysis'
                          : `Click "Generate Analysis" to create ${analysisType} report`}
                      </Text>
                      {analysisSelectedSubjects.size > 0 && (
                        <Text color='gray.400' fontSize='xs' textAlign='center'>
                          Analysis will cover {analysisSelectedSubjects.size}{' '}
                          subject
                          {analysisSelectedSubjects.size !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </VStack>
                  </Flex>
                )}
              </Box>
            </Flex>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Additional Analysis Tools */}
      <Card.Root>
        <Card.Body p={6}>
          <VStack gap={6} align='stretch'>
            <Heading as='h3' size='md'>
              Additional Analysis Tools
            </Heading>

            <Text color='gray.600' fontSize='sm'>
              Specialized analysis tools and templates for advanced research and
              strategic planning.
            </Text>

            {/* Strategy & Planning Tools */}
            <Box>
              <Heading as='h4' size='sm' mb={3} color='purple.600'>
                Strategy & Planning Tools
              </Heading>
              <HStack gap={3} wrap='wrap'>
                <Card.Root
                  minW='280px'
                  maxW='320px'
                  variant='outline'
                  bg='purple.50'
                  borderColor='purple.200'
                >
                  <Card.Body p={4}>
                    <VStack gap={2} align='stretch'>
                      <Heading as='h5' size='xs' color='purple.700'>
                        Innovation Strategies Maker
                      </Heading>
                      <Text fontSize='xs' color='gray.600' lineHeight='1.4'>
                        Use innovation strategies based on management books and
                        literature to expand and frame your ideas.
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled
                        colorScheme='purple'
                      >
                        Coming Soon
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  minW='280px'
                  maxW='320px'
                  variant='outline'
                  bg='purple.50'
                  borderColor='purple.200'
                >
                  <Card.Body p={4}>
                    <VStack gap={2} align='stretch'>
                      <Heading as='h5' size='xs' color='purple.700'>
                        Strategic Recommendations
                      </Heading>
                      <Text fontSize='xs' color='gray.600' lineHeight='1.4'>
                        Freeform report drawing highlights from previous reports
                        into recommendations for target audiences (industries,
                        cities, governments).
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled
                        colorScheme='purple'
                      >
                        Coming Soon
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </HStack>
            </Box>

            {/* Data Collection & Search Tools */}
            <Box>
              <Heading as='h4' size='sm' mb={3} color='blue.600'>
                Data Collection & Search Tools
              </Heading>
              <HStack gap={3} wrap='wrap'>
                <Card.Root
                  minW='280px'
                  maxW='320px'
                  variant='outline'
                  bg='blue.50'
                  borderColor='blue.200'
                >
                  <Card.Body p={4}>
                    <VStack gap={2} align='stretch'>
                      <Heading as='h5' size='xs' color='blue.700'>
                        Survey Tool
                      </Heading>
                      <Text fontSize='xs' color='gray.600' lineHeight='1.4'>
                        Create survey forms from CSV templates, distribute to
                        respondents, and generate analysis reports.
                      </Text>
                      <Text fontSize='xs' color='blue.600' fontWeight='medium'>
                        Input: Survey template CSV, target respondents
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled
                        colorScheme='blue'
                      >
                        Coming Soon
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  minW='280px'
                  maxW='320px'
                  variant='outline'
                  bg='blue.50'
                  borderColor='blue.200'
                >
                  <Card.Body p={4}>
                    <VStack gap={2} align='stretch'>
                      <Heading as='h5' size='xs' color='blue.700'>
                        Unstructured Search
                      </Heading>
                      <Text fontSize='xs' color='gray.600' lineHeight='1.4'>
                        Search the web for multiple terms, collect and summarize
                        the first X hits for each term with URLs and content
                        summaries.
                      </Text>
                      <Text fontSize='xs' color='blue.600' fontWeight='medium'>
                        Input: Search terms, number of hits
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled
                        colorScheme='blue'
                      >
                        Coming Soon
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  minW='280px'
                  maxW='320px'
                  variant='outline'
                  bg='blue.50'
                  borderColor='blue.200'
                >
                  <Card.Body p={4}>
                    <VStack gap={2} align='stretch'>
                      <Heading as='h5' size='xs' color='blue.700'>
                        Document Upload & Storage
                      </Heading>
                      <Text fontSize='xs' color='gray.600' lineHeight='1.4'>
                        Upload documents (PDF, text, URLs, images, audio, video)
                        to FAST and store in organized buckets.
                      </Text>
                      <Text fontSize='xs' color='blue.600' fontWeight='medium'>
                        Storage: User, team, org, lab, or snapshot buckets
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled
                        colorScheme='blue'
                      >
                        Coming Soon
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </HStack>
            </Box>

            {/* Content Analysis & Visualization Tools */}
            <Box>
              <Heading as='h4' size='sm' mb={3} color='green.600'>
                Content Analysis & Visualization Tools
              </Heading>
              <Text fontSize='xs' color='gray.600' mb={3}>
                These tools work with keyword tables from document analysis to
                create visualizations and insights.
              </Text>
              <HStack gap={3} wrap='wrap'>
                <Card.Root
                  minW='280px'
                  maxW='320px'
                  variant='outline'
                  bg='green.50'
                  borderColor='green.200'
                >
                  <Card.Body p={4}>
                    <VStack gap={2} align='stretch'>
                      <Heading as='h5' size='xs' color='green.700'>
                        Keyword Heatmapper
                      </Heading>
                      <Text fontSize='xs' color='gray.600' lineHeight='1.4'>
                        Create interactive heatmaps showing keyword frequency
                        across documents. Download as SVG or view statistics.
                      </Text>
                      <Text fontSize='xs' color='green.600' fontWeight='medium'>
                        Input: Keyword appearance table (fst-labdata)
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled
                        colorScheme='green'
                      >
                        Coming Soon
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  minW='280px'
                  maxW='320px'
                  variant='outline'
                  bg='green.50'
                  borderColor='green.200'
                >
                  <Card.Body p={4}>
                    <VStack gap={2} align='stretch'>
                      <Heading as='h5' size='xs' color='green.700'>
                        Word Cloud Generator
                      </Heading>
                      <Text fontSize='xs' color='gray.600' lineHeight='1.4'>
                        Generate word clouds from document content analysis.
                        Save to lab bucket or download directly.
                      </Text>
                      <Text fontSize='xs' color='green.600' fontWeight='medium'>
                        Input: Keyword appearance table (fst-labdata)
                      </Text>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled
                        colorScheme='green'
                      >
                        Coming Soon
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </HStack>
            </Box>

            {/* Legacy Tools */}
            <Box>
              <Heading as='h4' size='sm' mb={3} color='gray.600'>
                Legacy Tools
              </Heading>
              <HStack gap={3} wrap='wrap'>
                <Button variant='outline' size='sm' disabled>
                  Subject Comparison Tool
                </Button>
                <Button variant='outline' size='sm' disabled>
                  Trend Analysis Generator
                </Button>
                <Button variant='outline' size='sm' disabled>
                  Forecast Builder
                </Button>
                <Button variant='outline' size='sm' disabled>
                  Custom Report Template
                </Button>
              </HStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
};

export default Analyze;
