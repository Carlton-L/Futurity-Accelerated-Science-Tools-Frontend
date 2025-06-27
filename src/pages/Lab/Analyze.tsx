import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
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
  Tabs,
  IconButton,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import GlassCard from '../../components/shared/GlassCard';
import CardScroller from '../../components/shared/CardScroller';
import HorizonChartSection from './Horizons/HorizonChartSection';
import { useAuth } from '../../context/AuthContext';
import type {
  LabSubject,
  HorizonItem,
  AnalysisType,
  SubjectData,
} from './types';
import { mockCategories, mockAnalyses } from './mockData';
import {
  getCategoryNumber,
  generateMockAnalysisResult,
} from './utils/analyzeUtils';

interface AnalyzeProps {
  labId: string;
}

const Analyze: React.FC<AnalyzeProps> = ({ labId }) => {
  const { token } = useAuth();

  // Refs for scrolling to sections
  const horizonChartRef = useRef<HTMLDivElement>(null);
  const labAnalysesRef = useRef<HTMLDivElement>(null);
  const analysisToolsRef = useRef<HTMLDivElement>(null);
  const additionalToolsRef = useRef<HTMLDivElement>(null);

  // Basic state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most-recent');
  const [activeSection, setActiveSection] = useState<string>('horizon-chart');

  // API data state
  const [subjects, setSubjects] = useState<LabSubject[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [refreshingSubjects, setRefreshingSubjects] = useState<boolean>(false);

  // Horizon chart subject selection
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set()
  );

  // Store generated random horizon ranks to prevent recalculation
  const [generatedHorizonRanks, setGeneratedHorizonRanks] = useState<
    Map<string, number>
  >(new Map());

  // Analysis state
  const [analysisSelectedSubjects, setAnalysisSelectedSubjects] = useState<
    Set<string>
  >(new Set());
  const [analysisType, setAnalysisType] = useState<AnalysisType>('patent');
  const [excludeTerms, setExcludeTerms] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isCopyingAnalysis, setIsCopyingAnalysis] = useState(false);

  // Fetch detailed subject data including horizon ranks by slug
  const fetchSubjectDataBySlug = useCallback(
    async (slug: string): Promise<SubjectData> => {
      try {
        if (token) {
          const response = await fetch(
            `https://tools.futurity.science/api/subject/view?slug=${encodeURIComponent(
              slug
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            return await response.json();
          }
        }

        // Fallback to mock data if API fails
        const { mockFetchSubjectData } = await import('./mockData');
        return await mockFetchSubjectData(slug);
      } catch (error) {
        console.error('Failed to fetch subject data by slug:', error);
        return {
          _id: slug,
          Google_hitcounts: 0,
          Papers_hitcounts: 0,
          Books_hitcounts: 0,
          Gnews_hitcounts: 0,
          Related_terms: '',
          wikipedia_definition: '',
          wiktionary_definition: '',
          FST: '',
          labs: '',
          wikipedia_url: '',
          ent_name: 'Unknown Subject',
          ent_fsid: 'unknown',
          ent_summary: 'Subject data not found',
        };
      }
    },
    [token]
  );

  // Async function to fetch subject details in the background (non-blocking)
  const fetchSubjectDetailsAsync = useCallback(
    async (subjectsToUpdate: LabSubject[]) => {
      console.log('=== FETCHING SUBJECT DETAILS ===');
      console.log(
        'Starting to fetch details for',
        subjectsToUpdate.length,
        'subjects'
      );

      for (const subject of subjectsToUpdate) {
        try {
          console.log(
            `Fetching data for subject: ${subject.subjectName} (slug: ${subject.subjectSlug})`
          );

          // Use the subject slug to fetch detailed data including horizon ranks
          const subjectData = await fetchSubjectDataBySlug(subject.subjectSlug);

          // Extract horizon rank and other metrics from the indexes array
          let horizonRank: number | undefined;
          let techTransfer: number | undefined;
          let whiteSpace: number | undefined;

          if (subjectData.indexes && subjectData.indexes.length > 0) {
            const firstIndex = subjectData.indexes[0];
            horizonRank = firstIndex.HR;
            techTransfer = firstIndex.TT;
            whiteSpace = firstIndex.WS;
            console.log(
              `✓ Fetched horizon rank ${horizonRank} for ${subject.subjectName}`
            );
          } else {
            console.log(
              `✗ No horizon rank data found for ${subject.subjectName}, will use random value for testing`
            );
          }

          // Update the subject with the detailed data including horizon rank
          setSubjects((prevSubjects) => {
            const updated = prevSubjects.map((s) =>
              s.id === subject.id
                ? {
                    ...s,
                    notes: subjectData.ent_summary || s.notes,
                    horizonRank: horizonRank,
                    techTransfer: techTransfer,
                    whiteSpace: whiteSpace,
                  }
                : s
            );

            console.log(
              `Updated subject ${subject.subjectName} with HR: ${horizonRank}`
            );
            return updated;
          });
        } catch (error) {
          console.warn(
            `Failed to fetch details for subject ${subject.subjectId}:`,
            error
          );
        }
      }

      console.log('=== FINISHED FETCHING SUBJECT DETAILS ===');
    },
    [fetchSubjectDataBySlug]
  );

  // Fetch subjects from the API
  const fetchSubjects = useCallback(
    async (showRefreshState = false) => {
      if (!token) {
        console.warn('No auth token available');
        setSubjectsError('Authentication required');
        setLoadingSubjects(false);
        return;
      }

      if (showRefreshState) {
        setRefreshingSubjects(true);
      } else {
        setLoadingSubjects(true);
      }
      setSubjectsError(null);

      try {
        // Fetch lab data to get the subjects
        const response = await fetch(
          `https://tools.futurity.science/api/lab/view?lab_id=${labId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to access this lab.');
          } else if (response.status === 404) {
            throw new Error('Lab not found.');
          } else {
            throw new Error(`Failed to fetch lab data: ${response.status}`);
          }
        }

        const labData = await response.json();
        console.log('Fetched lab data:', labData);

        // Extract categories from API response
        const apiCategories = labData.categories || [];
        // Add the default "Uncategorized" category
        const allCategories = [
          { id: 'uncategorized', name: 'Uncategorized' },
          ...apiCategories,
        ];
        setCategories(allCategories);
        console.log('Categories:', allCategories);

        // Transform subjects from API format to frontend format
        const transformedSubjects: LabSubject[] = [];

        if (labData.subjects && Array.isArray(labData.subjects)) {
          for (const apiSubject of labData.subjects) {
            // Create basic subject without fetching detailed data initially
            const transformedSubject: LabSubject = {
              id: `lab-subj-${apiSubject.subject_id}`,
              subjectId: apiSubject.subject_id,
              subjectName:
                apiSubject.subject_name || apiSubject.name || 'Unknown Subject',
              subjectSlug: apiSubject.ent_fsid?.startsWith('fsid_')
                ? apiSubject.ent_fsid.substring(5)
                : apiSubject.ent_fsid || 'unknown',
              categoryId: apiSubject.category || 'uncategorized',
              addedAt: new Date().toISOString(),
              addedById: 'unknown',
              notes: '', // We'll fetch this separately if needed
              // Horizon rank data will be populated by fetchSubjectDetailsAsync
              horizonRank: undefined,
              techTransfer: undefined,
              whiteSpace: undefined,
            };

            console.log(
              `Subject ${transformedSubject.subjectName} -> Category ID: ${transformedSubject.categoryId}`
            );
            transformedSubjects.push(transformedSubject);
          }

          // Fetch detailed data for all subjects to get horizon ranks
          // This is async and will update the subjects with horizon rank data
          if (transformedSubjects.length > 0) {
            fetchSubjectDetailsAsync(transformedSubjects);
          }
        }

        console.log('Transformed subjects:', transformedSubjects);
        setSubjects(transformedSubjects);

        // If this is the first load, select only the first 20 subjects
        if (!showRefreshState && transformedSubjects.length > 0) {
          const firstTwentyIds = transformedSubjects
            .slice(0, 20)
            .map((s) => s.id);
          setSelectedSubjects(new Set(firstTwentyIds));
          setAnalysisSelectedSubjects(
            new Set(transformedSubjects.map((s) => s.id))
          ); // Analysis can still use all subjects
        }

        if (showRefreshState) {
          console.log(
            `Subjects refreshed: Found ${transformedSubjects.length} subjects in this lab`
          );
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load subjects';
        setSubjectsError(errorMessage);

        if (showRefreshState) {
          console.error('Failed to refresh subjects:', errorMessage);
        }
      } finally {
        setLoadingSubjects(false);
        setRefreshingSubjects(false);
      }
    },
    [labId, token, fetchSubjectDetailsAsync]
  );

  // Initial fetch on component mount
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Handle refresh button click
  const handleRefreshSubjects = useCallback(() => {
    fetchSubjects(true);
  }, [fetchSubjects]);

  // Load saved selections from localStorage
  useEffect(() => {
    const storageKey = `lab-${labId}-selected-subjects`;
    const savedSelections = localStorage.getItem(storageKey);

    if (savedSelections && subjects.length > 0) {
      try {
        const parsed = JSON.parse(savedSelections);
        const validIds = parsed.filter((id: string) =>
          subjects.some((s) => s.id === id)
        );
        setSelectedSubjects(new Set(validIds));
      } catch (error) {
        console.error('Failed to parse saved subject selections:', error);
        // Default to all subjects if parsing fails
        setSelectedSubjects(new Set(subjects.map((s) => s.id)));
      }
    }
  }, [labId, subjects]);

  // Save selections to localStorage
  useEffect(() => {
    if (subjects.length > 0) {
      const storageKey = `lab-${labId}-selected-subjects`;
      localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(selectedSubjects))
      );
    }
  }, [labId, selectedSubjects, subjects.length]);

  // Computed values
  const usedCategoryNames = useMemo(() => {
    return categories.map((cat) => cat.name).sort();
  }, [categories]);

  const excludedSubjects = useMemo(() => {
    const excludeCategory = mockCategories.find(
      (cat) => cat.type === 'exclude'
    );
    return excludeCategory?.subjects || [];
  }, []);

  // Updated horizonData with consistent random generation
  const horizonData = useMemo((): HorizonItem[] => {
    console.log('=== HORIZON DATA GENERATION ===');
    console.log('Generating horizon data...');
    console.log('Available categories:', categories);
    console.log('All subjects:', subjects.length);
    console.log('Selected subjects:', Array.from(selectedSubjects));
    console.log(
      'Selected subjects details:',
      subjects.filter((subject) => selectedSubjects.has(subject.id))
    );

    const newGeneratedRanks = new Map(generatedHorizonRanks);
    let hasNewGeneratedRanks = false;

    const selectedSubjectsData = subjects.filter((subject) =>
      selectedSubjects.has(subject.id)
    );
    console.log('Filtered selected subjects:', selectedSubjectsData.length);

    const result = selectedSubjectsData.map((subject) => {
      // Find the category from the actual API categories
      const category = categories.find((cat) => cat.id === subject.categoryId);
      const categoryName = category?.name || 'Uncategorized';

      console.log(
        `Processing Subject: ${subject.subjectName}, CategoryId: ${subject.categoryId}, Found Category: ${categoryName}, Current HR: ${subject.horizonRank}`
      );

      // Get horizon rank from subject data if available, otherwise use stored random or generate new
      let horizonRank: number;

      if (subject.horizonRank !== undefined) {
        // Use the actual horizon rank from API (0-10 scale)
        horizonRank = subject.horizonRank;
        console.log(
          `Using real horizon rank ${horizonRank} for ${subject.subjectName}`
        );
      } else {
        // Check if we already have a generated random value for this subject
        if (newGeneratedRanks.has(subject.id)) {
          horizonRank = newGeneratedRanks.get(subject.id)!;
          console.log(
            `Using stored random horizon rank ${horizonRank.toFixed(2)} for ${
              subject.subjectName
            }`
          );
        } else {
          // Generate new random horizon rank for testing (0-10 scale)
          horizonRank = Math.random() * 10;
          newGeneratedRanks.set(subject.id, horizonRank);
          hasNewGeneratedRanks = true;
          console.log(
            `Generated new random horizon rank ${horizonRank.toFixed(2)} for ${
              subject.subjectName
            }`
          );
        }
      }

      const horizonItem: HorizonItem = {
        name: subject.subjectName,
        horizon: horizonRank,
        category: getCategoryNumber(categoryName, usedCategoryNames),
        type: 1 as const,
        categoryName: categoryName,
      };

      console.log(`Generated horizon item:`, horizonItem);
      return horizonItem;
    });

    // Update stored generated ranks if we created new ones
    if (hasNewGeneratedRanks) {
      console.log('Updating stored generated ranks:', newGeneratedRanks);
      setGeneratedHorizonRanks(newGeneratedRanks);
    }

    console.log('Final horizon data result:', result.length, result);
    console.log('=== END HORIZON DATA GENERATION ===');
    return result;
  }, [
    subjects,
    selectedSubjects,
    categories,
    usedCategoryNames,
    generatedHorizonRanks,
  ]);

  // Clean up generated ranks when subjects change
  useEffect(() => {
    // Remove generated ranks for subjects that no longer exist
    const currentSubjectIds = new Set(subjects.map((s) => s.id));
    const cleanedRanks = new Map();

    for (const [subjectId, rank] of generatedHorizonRanks.entries()) {
      if (currentSubjectIds.has(subjectId)) {
        cleanedRanks.set(subjectId, rank);
      }
    }

    if (cleanedRanks.size !== generatedHorizonRanks.size) {
      setGeneratedHorizonRanks(cleanedRanks);
    }
  }, [subjects, generatedHorizonRanks]);

  const groupedSubjects = useMemo(() => {
    const selected: LabSubject[] = [];
    const unselected: LabSubject[] = [];

    subjects.forEach((subject) => {
      if (selectedSubjects.has(subject.id)) {
        selected.push(subject);
      } else {
        unselected.push(subject);
      }
    });

    return { selected, unselected };
  }, [subjects, selectedSubjects]);

  const groupedAnalysisSubjects = useMemo(() => {
    const selected: LabSubject[] = [];
    const unselected: LabSubject[] = [];

    subjects.forEach((subject) => {
      if (analysisSelectedSubjects.has(subject.id)) {
        selected.push(subject);
      } else {
        unselected.push(subject);
      }
    });

    return { selected, unselected };
  }, [subjects, analysisSelectedSubjects]);

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

  // Initialize analysis subjects when subjects load
  useEffect(() => {
    if (subjects.length > 0) {
      setAnalysisSelectedSubjects(new Set(subjects.map((s) => s.id)));
    }

    const excludeSubjectNames = excludedSubjects.map((s) => s.subjectName);
    setExcludeTerms(excludeSubjectNames.join(', '));
  }, [subjects, excludedSubjects]);

  // Navigation handlers
  const scrollToSection = useCallback((sectionId: string) => {
    const refs = {
      'horizon-chart': horizonChartRef,
      'lab-analyses': labAnalysesRef,
      'analysis-tools': analysisToolsRef,
      'additional-tools': additionalToolsRef,
    };

    const ref = refs[sectionId as keyof typeof refs];
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
      setActiveSection(sectionId);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'horizon-chart', ref: horizonChartRef },
        { id: 'lab-analyses', ref: labAnalysesRef },
        { id: 'analysis-tools', ref: analysisToolsRef },
        { id: 'additional-tools', ref: additionalToolsRef },
      ];

      const scrollY = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          const offsetTop = rect.top + window.scrollY;

          if (scrollY >= offsetTop) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subject handlers with 20 subject limit
  const handleSubjectToggle = useCallback((subjectId: string) => {
    setSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        // Always allow deselection
        newSet.delete(subjectId);
      } else {
        // Only allow selection if under 20 limit
        if (newSet.size < 20) {
          newSet.add(subjectId);
        }
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    // Select only the first 20 subjects
    const firstTwentyIds = subjects.slice(0, 20).map((s) => s.id);
    setSelectedSubjects(new Set(firstTwentyIds));
  }, [subjects]);

  const handleDeselectAll = useCallback(() => {
    setSelectedSubjects(new Set());
  }, []);

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
    setAnalysisSelectedSubjects(new Set(subjects.map((s) => s.id)));
  }, [subjects]);

  const handleAnalysisDeselectAll = useCallback(() => {
    setAnalysisSelectedSubjects(new Set());
  }, []);

  // Analysis handlers
  const handleAnalysisClick = useCallback(
    (analysisId: string) => {
      console.log(`Navigate to analysis: /lab/${labId}/analysis/${analysisId}`);
    },
    [labId]
  );

  const handleGenerateAnalysis = useCallback(async () => {
    if (analysisSelectedSubjects.size === 0) return;

    setIsGeneratingAnalysis(true);
    setAnalysisResult('');

    try {
      const selectedSubjectNames = subjects
        .filter((subject) => analysisSelectedSubjects.has(subject.id))
        .map((subject) => subject.subjectName);

      const excludeTermsList = excludeTerms
        .split(',')
        .map((term) => term.trim())
        .filter((term) => term.length > 0);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const mockResult = generateMockAnalysisResult(
        analysisType,
        selectedSubjectNames,
        excludeTermsList,
        analysisSelectedSubjects.size
      );

      setAnalysisResult(mockResult);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      setAnalysisResult(
        'Error: Failed to generate analysis. Please try again.'
      );
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }, [analysisSelectedSubjects, subjects, excludeTerms, analysisType]);

  const handleCopyAnalysis = useCallback(async () => {
    if (!analysisResult) return;

    try {
      await navigator.clipboard.writeText(analysisResult);
      setIsCopyingAnalysis(true);
      setTimeout(() => setIsCopyingAnalysis(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
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
      <HStack justify='space-between' align='center'>
        <Heading as='h2' size='lg' fontFamily='heading' color='fg'>
          Analyses
        </Heading>

        {/* Refresh button for subjects */}
        <IconButton
          size='sm'
          variant='outline'
          onClick={handleRefreshSubjects}
          loading={refreshingSubjects}
          disabled={loadingSubjects}
          aria-label='Refresh subjects'
          title='Refresh subjects from API'
        >
          <FiRefreshCw size={16} />
        </IconButton>
      </HStack>

      {/* Error display for subjects */}
      {subjectsError && (
        <Box
          p={4}
          bg='red.50'
          border='1px solid'
          borderColor='red.200'
          borderRadius='md'
        >
          <Text color='red.700' fontSize='sm'>
            <strong>Error loading subjects:</strong> {subjectsError}
          </Text>
          <Button
            size='sm'
            mt={2}
            onClick={handleRefreshSubjects}
            loading={refreshingSubjects}
          >
            Retry
          </Button>
        </Box>
      )}

      {/* Sticky Navigation Bar */}
      <Box position='sticky' top='115px' zIndex='8' mb={6}>
        <GlassCard variant='glass' w='100%' bg='bg.canvas'>
          <Box p={4}>
            <Tabs.Root
              value={activeSection}
              onValueChange={(details) => setActiveSection(details.value)}
            >
              <Tabs.List>
                <Tabs.Trigger
                  value='horizon-chart'
                  onClick={() => scrollToSection('horizon-chart')}
                >
                  Horizon Chart
                </Tabs.Trigger>
                <Tabs.Trigger
                  value='lab-analyses'
                  onClick={() => scrollToSection('lab-analyses')}
                >
                  Lab Analyses
                </Tabs.Trigger>
                <Tabs.Trigger
                  value='analysis-tools'
                  onClick={() => scrollToSection('analysis-tools')}
                >
                  Analysis Tools
                </Tabs.Trigger>
                <Tabs.Trigger
                  value='additional-tools'
                  onClick={() => scrollToSection('additional-tools')}
                >
                  Additional Tools
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Box>
        </GlassCard>
      </Box>

      {/* Horizon Chart Section */}
      <VStack gap={4} align='stretch'>
        <Heading as='h3' size='md' fontFamily='heading' color='fg'>
          Horizon Chart
        </Heading>
        <HorizonChartSection
          ref={horizonChartRef}
          allSubjects={subjects}
          selectedSubjects={selectedSubjects}
          horizonData={horizonData}
          groupedSubjects={groupedSubjects}
          onSubjectToggle={handleSubjectToggle}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          loading={loadingSubjects}
          error={subjectsError}
          onRefresh={handleRefreshSubjects}
          refreshing={refreshingSubjects}
        />
      </VStack>

      {/* Lab Analyses Section */}
      <VStack gap={4} align='stretch'>
        <Heading as='h3' size='md' fontFamily='heading' color='fg'>
          Lab Analyses
        </Heading>
        <Card.Root
          ref={labAnalysesRef}
          borderWidth='1px'
          borderColor='border.emphasized'
          bg='bg.canvas'
        >
          <Card.Body p={4}>
            <VStack gap={3} align='stretch'>
              <HStack gap={4} align='center' flexShrink={0}>
                <HStack gap={2} align='center'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='fg.muted'
                    whiteSpace='nowrap'
                    fontFamily='heading'
                  >
                    Sort by:
                  </Text>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      backgroundColor: 'var(--chakra-colors-bg-canvas)',
                      borderColor: 'var(--chakra-colors-border-emphasized)',
                      color: 'var(--chakra-colors-fg)',
                      fontSize: '14px',
                      minWidth: '150px',
                      padding: '8px',
                      borderRadius: '4px',
                      border:
                        '1px solid var(--chakra-colors-border-emphasized)',
                      fontFamily: 'var(--chakra-fonts-body)',
                    }}
                  >
                    <option
                      value='most-recent'
                      style={{
                        backgroundColor: 'var(--chakra-colors-bg-canvas)',
                        color: 'var(--chakra-colors-fg)',
                      }}
                    >
                      Most Recent
                    </option>
                    <option
                      value='oldest'
                      style={{
                        backgroundColor: 'var(--chakra-colors-bg-canvas)',
                        color: 'var(--chakra-colors-fg)',
                      }}
                    >
                      Oldest
                    </option>
                    <option
                      value='a-z'
                      style={{
                        backgroundColor: 'var(--chakra-colors-bg-canvas)',
                        color: 'var(--chakra-colors-fg)',
                      }}
                    >
                      A-Z
                    </option>
                    <option
                      value='z-a'
                      style={{
                        backgroundColor: 'var(--chakra-colors-bg-canvas)',
                        color: 'var(--chakra-colors-fg)',
                      }}
                    >
                      Z-A
                    </option>
                  </select>
                </HStack>
                <Input
                  placeholder='Filter analyses...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size='sm'
                  flex='1'
                  bg='bg.canvas'
                  borderColor='border.emphasized'
                  color='fg'
                  _placeholder={{ color: 'fg.subtle' }}
                  _focus={{
                    borderColor: 'brand.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                  }}
                />
              </HStack>

              <Box height='1px' bg='border.muted' flexShrink={0} />

              <CardScroller
                height='250px'
                emptyMessage='No analyses found. Create your first analysis to get started!'
              >
                {filteredAndSortedAnalyses.map((analysis) => (
                  <GlassCard
                    key={analysis.id}
                    variant='outline'
                    minWidth='280px'
                    maxWidth='280px'
                    height='100%'
                    cursor='pointer'
                    _hover={{ bg: 'bg.subtle', borderColor: 'brand.400' }}
                    onClick={() => handleAnalysisClick(analysis.id)}
                    transition='all 0.2s'
                  >
                    <Box
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
                              color='brand.500'
                              lineHeight='1.3'
                              fontFamily='heading'
                            >
                              {analysis.title}
                            </Text>
                            <Box
                              bg={
                                analysis.status === 'Complete'
                                  ? 'success'
                                  : analysis.status === 'In Progress'
                                  ? 'info'
                                  : 'warning'
                              }
                              color='white'
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
                          color='fg.muted'
                          lineHeight='1.4'
                          overflow='hidden'
                          textOverflow='ellipsis'
                          display='-webkit-box'
                          flex='1'
                          fontFamily='body'
                          style={{
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {analysis.description}
                        </Text>
                      </VStack>
                    </Box>
                  </GlassCard>
                ))}
              </CardScroller>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>

      {/* Analysis Tools Section */}
      <VStack gap={4} align='stretch'>
        <Heading as='h3' size='md' fontFamily='heading' color='fg'>
          Analysis Tools
        </Heading>
        <Card.Root
          ref={analysisToolsRef}
          borderWidth='1px'
          borderColor='border.emphasized'
          bg='bg.canvas'
        >
          <Card.Body p={6}>
            <VStack gap={4} align='stretch'>
              {/* Analysis Type Selector */}
              <Box>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  mb={2}
                  fontFamily='heading'
                  color='fg'
                >
                  Analysis Type
                </Text>
                <select
                  value={analysisType}
                  onChange={(e) =>
                    setAnalysisType(e.target.value as AnalysisType)
                  }
                  style={{
                    backgroundColor: 'var(--chakra-colors-bg-canvas)',
                    borderColor: 'var(--chakra-colors-border-emphasized)',
                    color: 'var(--chakra-colors-fg)',
                    fontSize: '14px',
                    minWidth: '200px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--chakra-colors-border-emphasized)',
                    fontFamily: 'var(--chakra-fonts-body)',
                  }}
                >
                  <option
                    value='patent'
                    style={{
                      backgroundColor: 'var(--chakra-colors-bg-canvas)',
                      color: 'var(--chakra-colors-fg)',
                    }}
                  >
                    Patent Landscape
                  </option>
                  <option
                    value='taxonomy'
                    style={{
                      backgroundColor: 'var(--chakra-colors-bg-canvas)',
                      color: 'var(--chakra-colors-fg)',
                    }}
                  >
                    Taxonomy
                  </option>
                  <option
                    value='research'
                    style={{
                      backgroundColor: 'var(--chakra-colors-bg-canvas)',
                      color: 'var(--chakra-colors-fg)',
                    }}
                  >
                    Research Analysis
                  </option>
                  <option
                    value='investment'
                    style={{
                      backgroundColor: 'var(--chakra-colors-bg-canvas)',
                      color: 'var(--chakra-colors-fg)',
                    }}
                  >
                    Venture Investment
                  </option>
                </select>
              </Box>

              {/* Analysis Type Description */}
              <GlassCard
                variant='glass'
                bg='brand.50'
                borderColor='brand.200'
                p={3}
              >
                <Text fontSize='sm' color='brand.800' fontFamily='body'>
                  {analysisType === 'patent' &&
                    'This report provides a patent landscape of the space.'}
                  {analysisType === 'taxonomy' &&
                    'In a given Lab, for each subject, it provides the definition and related terms, and their relationships with one another in the FS Taxonomy and other taxonomies. It then compares each subject on each of the structured sources.'}
                  {analysisType === 'research' &&
                    'This report examines trends in scientific publishing in the space.'}
                  {analysisType === 'investment' &&
                    'This report looks at the companies in each of the taxonomy categories explained in the Taxonomy report, showing their investment history and trends.'}
                </Text>
              </GlassCard>

              <Flex gap={6} align='flex-start'>
                {/* Controls Panel */}
                <Box minW='300px' maxW='300px'>
                  <VStack gap={4} align='stretch'>
                    {/* Subject Selection for Analysis */}
                    <Box>
                      <HStack justify='space-between' align='center' mb={2}>
                        <Text
                          fontSize='sm'
                          fontWeight='medium'
                          fontFamily='heading'
                          color='fg'
                        >
                          Select Subjects ({analysisSelectedSubjects.size}/
                          {subjects.length})
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
                        borderColor='border.emphasized'
                        borderRadius='md'
                        p={3}
                      >
                        <VStack gap={2} align='stretch'>
                          {/* Loading state */}
                          {loadingSubjects && (
                            <Text
                              fontSize='sm'
                              color='fg.muted'
                              textAlign='center'
                              py={4}
                              fontFamily='body'
                            >
                              Loading subjects...
                            </Text>
                          )}

                          {/* Error state */}
                          {subjectsError && !loadingSubjects && (
                            <Text
                              fontSize='sm'
                              color='red.500'
                              textAlign='center'
                              py={4}
                              fontFamily='body'
                            >
                              Failed to load subjects
                            </Text>
                          )}

                          {/* Selected subjects first */}
                          {!loadingSubjects &&
                            !subjectsError &&
                            groupedAnalysisSubjects.selected.length > 0 && (
                              <>
                                <Text
                                  fontSize='xs'
                                  fontWeight='bold'
                                  color='success'
                                  textTransform='uppercase'
                                  fontFamily='heading'
                                >
                                  Included (
                                  {groupedAnalysisSubjects.selected.length})
                                </Text>
                                {groupedAnalysisSubjects.selected.map(
                                  (subject) => (
                                    <HStack
                                      key={subject.id}
                                      gap={2}
                                      align='center'
                                    >
                                      <Checkbox.Root
                                        checked={analysisSelectedSubjects.has(
                                          subject.id
                                        )}
                                        onCheckedChange={() =>
                                          handleAnalysisSubjectToggle(
                                            subject.id
                                          )
                                        }
                                        size='sm'
                                      >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control>
                                          <Checkbox.Indicator />
                                        </Checkbox.Control>
                                      </Checkbox.Root>
                                      <VStack gap={0} align='stretch' flex='1'>
                                        <Text
                                          fontSize='sm'
                                          fontWeight='medium'
                                          color='fg'
                                          fontFamily='heading'
                                        >
                                          {subject.subjectName}
                                        </Text>
                                        {subject.notes && (
                                          <Text
                                            fontSize='xs'
                                            color='fg.muted'
                                            overflow='hidden'
                                            textOverflow='ellipsis'
                                            whiteSpace='nowrap'
                                            fontFamily='body'
                                          >
                                            {subject.notes}
                                          </Text>
                                        )}
                                        {/* Show horizon rank if available */}
                                        {subject.horizonRank !== undefined && (
                                          <Text
                                            fontSize='xs'
                                            color='brand.500'
                                            fontFamily='mono'
                                          >
                                            HR: {subject.horizonRank.toFixed(1)}
                                          </Text>
                                        )}
                                      </VStack>
                                    </HStack>
                                  )
                                )}
                              </>
                            )}

                          {/* Unselected subjects */}
                          {!loadingSubjects &&
                            !subjectsError &&
                            groupedAnalysisSubjects.unselected.length > 0 && (
                              <>
                                {groupedAnalysisSubjects.selected.length >
                                  0 && (
                                  <Box height='1px' bg='border.muted' my={2} />
                                )}
                                <Text
                                  fontSize='xs'
                                  fontWeight='bold'
                                  color='fg.muted'
                                  textTransform='uppercase'
                                  fontFamily='heading'
                                >
                                  Available (
                                  {groupedAnalysisSubjects.unselected.length})
                                </Text>
                                {groupedAnalysisSubjects.unselected.map(
                                  (subject) => (
                                    <HStack
                                      key={subject.id}
                                      gap={2}
                                      align='center'
                                    >
                                      <Checkbox.Root
                                        checked={analysisSelectedSubjects.has(
                                          subject.id
                                        )}
                                        onCheckedChange={() =>
                                          handleAnalysisSubjectToggle(
                                            subject.id
                                          )
                                        }
                                        size='sm'
                                      >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control>
                                          <Checkbox.Indicator />
                                        </Checkbox.Control>
                                      </Checkbox.Root>
                                      <VStack gap={0} align='stretch' flex='1'>
                                        <Text
                                          fontSize='sm'
                                          fontWeight='medium'
                                          color='fg'
                                          fontFamily='heading'
                                        >
                                          {subject.subjectName}
                                        </Text>
                                        {subject.notes && (
                                          <Text
                                            fontSize='xs'
                                            color='fg.muted'
                                            overflow='hidden'
                                            textOverflow='ellipsis'
                                            whiteSpace='nowrap'
                                            fontFamily='body'
                                          >
                                            {subject.notes}
                                          </Text>
                                        )}
                                        {/* Show horizon rank if available */}
                                        {subject.horizonRank !== undefined && (
                                          <Text
                                            fontSize='xs'
                                            color='brand.500'
                                            fontFamily='mono'
                                          >
                                            HR: {subject.horizonRank.toFixed(1)}
                                          </Text>
                                        )}
                                      </VStack>
                                    </HStack>
                                  )
                                )}
                              </>
                            )}

                          {!loadingSubjects &&
                            !subjectsError &&
                            subjects.length === 0 && (
                              <Text
                                fontSize='sm'
                                color='fg.muted'
                                textAlign='center'
                                py={4}
                                fontFamily='body'
                              >
                                No subjects available. Add subjects in the
                                Gather tab first.
                              </Text>
                            )}
                        </VStack>
                      </Box>
                    </Box>

                    {/* Exclude Terms */}
                    <Box>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        mb={2}
                        fontFamily='heading'
                        color='fg'
                      >
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
                        bg={
                          analysisType === 'taxonomy' ? 'bg.muted' : 'bg.canvas'
                        }
                        color={analysisType === 'taxonomy' ? 'fg.muted' : 'fg'}
                        borderColor='border.emphasized'
                        _placeholder={{ color: 'fg.subtle' }}
                        _focus={{
                          borderColor: 'brand.400',
                          boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                        }}
                      />
                      <Text
                        fontSize='xs'
                        color='fg.muted'
                        mt={1}
                        fontFamily='body'
                      >
                        {analysisType === 'taxonomy'
                          ? 'Taxonomy analysis does not use exclusion terms'
                          : 'Results matching these terms will be excluded from analysis'}
                      </Text>
                      {excludedSubjects.length > 0 &&
                        analysisType !== 'taxonomy' && (
                          <Text
                            fontSize='xs'
                            color='brand.500'
                            mt={1}
                            fontFamily='body'
                          >
                            Auto-included:{' '}
                            {excludedSubjects
                              .map((s) => s.subjectName)
                              .join(', ')}
                          </Text>
                        )}
                    </Box>

                    {/* Generate Button */}
                    <Button
                      variant='solid'
                      onClick={handleGenerateAnalysis}
                      disabled={
                        analysisSelectedSubjects.size === 0 ||
                        isGeneratingAnalysis ||
                        loadingSubjects
                      }
                      size='md'
                      width='100%'
                      loading={isGeneratingAnalysis}
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
                        <Text
                          fontSize='sm'
                          fontWeight='medium'
                          fontFamily='heading'
                          color='fg'
                        >
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

                      <GlassCard
                        variant='outline'
                        maxH='500px'
                        overflowY='auto'
                        p={4}
                      >
                        <Text
                          fontSize='sm'
                          lineHeight='1.6'
                          whiteSpace='pre-wrap'
                          fontFamily='mono'
                          color='fg'
                        >
                          {analysisResult}
                        </Text>
                      </GlassCard>
                    </VStack>
                  ) : (
                    <Flex
                      height='300px'
                      align='center'
                      justify='center'
                      border='2px dashed'
                      borderColor='border.muted'
                      borderRadius='md'
                      bg='bg.subtle'
                    >
                      <VStack gap={2}>
                        <Text
                          color='fg.muted'
                          fontSize='sm'
                          textAlign='center'
                          fontFamily='body'
                        >
                          {loadingSubjects
                            ? 'Loading subjects...'
                            : analysisSelectedSubjects.size === 0
                            ? 'Select subjects above to generate analysis'
                            : `Click "Generate Analysis" to create ${analysisType} report`}
                        </Text>
                        {!loadingSubjects &&
                          analysisSelectedSubjects.size > 0 && (
                            <Text
                              color='fg.subtle'
                              fontSize='xs'
                              textAlign='center'
                              fontFamily='body'
                            >
                              Analysis will cover{' '}
                              {analysisSelectedSubjects.size} subject
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
      </VStack>

      {/* Additional Analysis Tools Section */}
      <VStack gap={4} align='stretch'>
        <Heading as='h3' size='md' fontFamily='heading' color='fg'>
          Additional Analysis Tools
        </Heading>
        <Card.Root
          ref={additionalToolsRef}
          borderWidth='1px'
          borderColor='border.emphasized'
          bg='bg.canvas'
        >
          <Card.Body p={6}>
            <VStack gap={6} align='stretch'>
              <Text color='fg.muted' fontSize='sm' fontFamily='body'>
                Specialized analysis tools and templates for advanced research
                and strategic planning.
              </Text>

              {/* Strategy & Planning Tools */}
              <Box>
                <Heading
                  as='h4'
                  size='sm'
                  mb={3}
                  color='brand.500'
                  fontFamily='heading'
                >
                  Strategy & Planning Tools
                </Heading>
                <HStack gap={3} wrap='wrap'>
                  <GlassCard
                    variant='outline'
                    minW='280px'
                    maxW='320px'
                    bg='brand.50'
                    borderColor='brand.200'
                  >
                    <Box p={4}>
                      <VStack gap={2} align='stretch'>
                        <Heading
                          as='h5'
                          size='xs'
                          color='brand.700'
                          fontFamily='heading'
                        >
                          Innovation Strategies Maker
                        </Heading>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          lineHeight='1.4'
                          fontFamily='body'
                        >
                          Use innovation strategies based on management books
                          and literature to expand and frame your ideas.
                        </Text>
                        <Button
                          size='sm'
                          variant='outline'
                          disabled
                          colorScheme='brand'
                        >
                          Coming Soon
                        </Button>
                      </VStack>
                    </Box>
                  </GlassCard>

                  <GlassCard
                    variant='outline'
                    minW='280px'
                    maxW='320px'
                    bg='brand.50'
                    borderColor='brand.200'
                  >
                    <Box p={4}>
                      <VStack gap={2} align='stretch'>
                        <Heading
                          as='h5'
                          size='xs'
                          color='brand.700'
                          fontFamily='heading'
                        >
                          Strategic Recommendations
                        </Heading>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          lineHeight='1.4'
                          fontFamily='body'
                        >
                          Freeform report drawing highlights from previous
                          reports into recommendations for target audiences
                          (industries, cities, governments).
                        </Text>
                        <Button
                          size='sm'
                          variant='outline'
                          disabled
                          colorScheme='brand'
                        >
                          Coming Soon
                        </Button>
                      </VStack>
                    </Box>
                  </GlassCard>
                </HStack>
              </Box>

              {/* Data Collection & Search Tools */}
              <Box>
                <Heading
                  as='h4'
                  size='sm'
                  mb={3}
                  color='info'
                  fontFamily='heading'
                >
                  Data Collection & Search Tools
                </Heading>
                <HStack gap={3} wrap='wrap'>
                  <GlassCard
                    variant='outline'
                    minW='280px'
                    maxW='320px'
                    bg='blue.50'
                    borderColor='blue.200'
                  >
                    <Box p={4}>
                      <VStack gap={2} align='stretch'>
                        <Heading
                          as='h5'
                          size='xs'
                          color='blue.700'
                          fontFamily='heading'
                        >
                          Survey Tool
                        </Heading>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          lineHeight='1.4'
                          fontFamily='body'
                        >
                          Create survey forms from CSV templates, distribute to
                          respondents, and generate analysis reports.
                        </Text>
                        <Text
                          fontSize='xs'
                          color='info'
                          fontWeight='medium'
                          fontFamily='body'
                        >
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
                    </Box>
                  </GlassCard>

                  <GlassCard
                    variant='outline'
                    minW='280px'
                    maxW='320px'
                    bg='blue.50'
                    borderColor='blue.200'
                  >
                    <Box p={4}>
                      <VStack gap={2} align='stretch'>
                        <Heading
                          as='h5'
                          size='xs'
                          color='blue.700'
                          fontFamily='heading'
                        >
                          Unstructured Search
                        </Heading>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          lineHeight='1.4'
                          fontFamily='body'
                        >
                          Search the web for multiple terms, collect and
                          summarize the first X hits for each term with URLs and
                          content summaries.
                        </Text>
                        <Text
                          fontSize='xs'
                          color='info'
                          fontWeight='medium'
                          fontFamily='body'
                        >
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
                    </Box>
                  </GlassCard>

                  <GlassCard
                    variant='outline'
                    minW='280px'
                    maxW='320px'
                    bg='blue.50'
                    borderColor='blue.200'
                  >
                    <Box p={4}>
                      <VStack gap={2} align='stretch'>
                        <Heading
                          as='h5'
                          size='xs'
                          color='blue.700'
                          fontFamily='heading'
                        >
                          Document Upload & Storage
                        </Heading>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          lineHeight='1.4'
                          fontFamily='body'
                        >
                          Upload documents (PDF, text, URLs, images, audio,
                          video) to FAST and store in organized buckets.
                        </Text>
                        <Text
                          fontSize='xs'
                          color='info'
                          fontWeight='medium'
                          fontFamily='body'
                        >
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
                    </Box>
                  </GlassCard>
                </HStack>
              </Box>

              {/* Content Analysis & Visualization Tools */}
              <Box>
                <Heading
                  as='h4'
                  size='sm'
                  mb={3}
                  color='success'
                  fontFamily='heading'
                >
                  Content Analysis & Visualization Tools
                </Heading>
                <Text fontSize='xs' color='fg.muted' mb={3} fontFamily='body'>
                  These tools work with keyword tables from document analysis to
                  create visualizations and insights.
                </Text>
                <HStack gap={3} wrap='wrap'>
                  <GlassCard
                    variant='outline'
                    minW='280px'
                    maxW='320px'
                    bg='green.50'
                    borderColor='green.200'
                  >
                    <Box p={4}>
                      <VStack gap={2} align='stretch'>
                        <Heading
                          as='h5'
                          size='xs'
                          color='green.700'
                          fontFamily='heading'
                        >
                          Keyword Heatmapper
                        </Heading>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          lineHeight='1.4'
                          fontFamily='body'
                        >
                          Create interactive heatmaps showing keyword frequency
                          across documents. Download as SVG or view statistics.
                        </Text>
                        <Text
                          fontSize='xs'
                          color='success'
                          fontWeight='medium'
                          fontFamily='body'
                        >
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
                    </Box>
                  </GlassCard>

                  <GlassCard
                    variant='outline'
                    minW='280px'
                    maxW='320px'
                    bg='green.50'
                    borderColor='green.200'
                  >
                    <Box p={4}>
                      <VStack gap={2} align='stretch'>
                        <Heading
                          as='h5'
                          size='xs'
                          color='green.700'
                          fontFamily='heading'
                        >
                          Word Cloud Generator
                        </Heading>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          lineHeight='1.4'
                          fontFamily='body'
                        >
                          Generate word clouds from document content analysis.
                          Save to lab bucket or download directly.
                        </Text>
                        <Text
                          fontSize='xs'
                          color='success'
                          fontWeight='medium'
                          fontFamily='body'
                        >
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
                    </Box>
                  </GlassCard>
                </HStack>
              </Box>

              {/* Legacy Tools */}
              <Box>
                <Heading
                  as='h4'
                  size='sm'
                  mb={3}
                  color='fg.muted'
                  fontFamily='heading'
                >
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
    </VStack>
  );
};

export default Analyze;
