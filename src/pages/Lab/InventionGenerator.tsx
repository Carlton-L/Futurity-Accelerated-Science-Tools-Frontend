import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Textarea,
  Tabs,
} from '@chakra-ui/react';
import {
  FiCpu,
  FiTrendingUp,
  FiImage,
  FiMap,
  FiPlay,
  FiAlertCircle,
  FiEdit3,
  FiRefreshCw,
  FiTool,
} from 'react-icons/fi';

// Types for the invention system
interface IdeaConcept {
  id: string;
  name: string;
}

interface IdeaSeed {
  id: string;
  parentId?: string;
  version: string;
  title: string;
  description: string;
  concepts: IdeaConcept[];
  createdAt: Date;
  branchedFrom?: {
    version: string;
    reason: string;
    tool: string;
  };
  modifications?: string[];
  generation: number; // 0 = root, 1 = first enhancement, etc.
  rootId: string; // Which root idea this belongs to
}

interface Consequence {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

// Mock data
const mockIdeas = [
  {
    id: 'idea-1',
    version: '1.0',
    title: 'Gig Worker Insurance Wallet',
    description:
      'Offer on-demand micro-insurance policies (health, accident, device) embedded within gig platforms (like delivery apps), auto-funded through gig earnings.',
    concepts: [
      { id: 'c1', name: 'Embedded Finance' },
      { id: 'c2', name: 'Insurance' },
      { id: 'c3', name: 'Gig Economy' },
    ],
    createdAt: new Date(),
    parentId: undefined,
    generation: 0,
    rootId: 'idea-1',
  },
  {
    id: 'idea-2',
    version: '1.0',
    title: 'Street Vendor University',
    description:
      'An informal school for mobile vendors (food carts, artisans) with ultra-practical modules: pricing, cash flow, customer trust, digital payments—offered in-person and via mobile. On completion of the course, vendors who pass may be offered loans at a discounted rate.',
    concepts: [
      { id: 'c4', name: 'E-Learning' },
      { id: 'c5', name: 'Gig Economy' },
      { id: 'c6', name: 'Asset Management' },
    ],
    createdAt: new Date(),
    parentId: undefined,
    generation: 0,
    rootId: 'idea-2',
  },
  {
    id: 'idea-3',
    version: '1.0',
    title: 'Microloan-Backed Learning Credits',
    description:
      'Provides microloans repayable with course completion. Completing financial literacy or upskilling modules reduces loan interest or offers partial forgiveness.',
    concepts: [
      { id: 'c7', name: 'Embedded Finance' },
      { id: 'c8', name: 'Microfinance' },
      { id: 'c9', name: 'E-Learning' },
    ],
    createdAt: new Date(),
    parentId: undefined,
    generation: 0,
    rootId: 'idea-3',
  },
];

const mockConsequences = {
  'idea-1': [
    {
      id: 'c1-1',
      title: 'Predatory Pricing & Hidden Fees',
      description:
        'On-demand insurance may start affordable, but platforms or third-party providers could introduce opaque pricing, dynamic premiums, or hidden fees that exploit financially vulnerable gig workers.',
      severity: 'high' as const,
    },
    {
      id: 'c1-2',
      title: 'Reduced Pressure on Platforms to Provide Benefits',
      description:
        'Gig platforms may use the existence of micro-insurance as justification to avoid offering full-time employment benefits or social protections, deepening precarious labor norms.',
      severity: 'high' as const,
    },
    {
      id: 'c1-3',
      title: 'Fragmented and Inadequate Coverage',
      description:
        'Micro-insurance might not meet real-life medical or legal needs—leaving gig workers with a false sense of security, unable to access comprehensive care when disaster strikes.',
      severity: 'medium' as const,
    },
    {
      id: 'c1-4',
      title: 'Behavioral Manipulation via Incentives',
      description:
        'Platforms could gamify insurance participation—offering lower premiums only to those who work a certain number of hours, effectively coercing labor under the guise of "choice."',
      severity: 'medium' as const,
    },
  ],
  'idea-2': [
    {
      id: 'c2-1',
      title: 'Financial Gatekeeping via Course Completion',
      description:
        'Tying loan access to course completion could exclude the most vulnerable (e.g. illiterate, neurodivergent, or elderly vendors) who cannot pass assessments, reinforcing inequality.',
      severity: 'high' as const,
    },
    {
      id: 'c2-2',
      title: 'One-Size-Fits-All Curriculum Risks Cultural Erasure',
      description:
        'Standardized teachings may marginalize traditional or localized knowledge about pricing, customer interaction, or trust-building, promoting a generic "formal sector" logic.',
      severity: 'medium' as const,
    },
    {
      id: 'c2-3',
      title: 'Increased Surveillance & Informal Data Extraction',
      description:
        "Vendors' engagement with the platform may become a means of collecting detailed data about sales, location, and behavior—raising privacy concerns, especially in informal economies.",
      severity: 'high' as const,
    },
    {
      id: 'c2-4',
      title: 'Tokenization of Education as Compliance',
      description:
        'Municipalities or regulators could require course certification to operate legally, turning the university into a barrier to entry rather than an empowerment tool.',
      severity: 'medium' as const,
    },
  ],
  'idea-3': [
    {
      id: 'c3-1',
      title: 'Perverse Incentives & Education-as-Debt Trap',
      description:
        'Tying loan forgiveness to course completion could pressure learners to rush through or game modules without real comprehension—devaluing the education itself.',
      severity: 'high' as const,
    },
    {
      id: 'c3-2',
      title: 'Exploitative Content Partnerships',
      description:
        'If courses are created or funded by private actors (banks, lenders), the curriculum might subtly encourage financial behaviors that benefit lenders rather than learners.',
      severity: 'medium' as const,
    },
    {
      id: 'c3-3',
      title: 'Dropout Penalties Disproportionately Hurt the Poor',
      description:
        'Users who cannot complete the course—due to external crises or lack of digital access—may be hit with high interest or debt accumulation, punishing the most vulnerable.',
      severity: 'high' as const,
    },
    {
      id: 'c3-4',
      title: 'Normalizing Conditional Access to Education',
      description:
        'This model might shift the norm from "education as a right" to "education as a reward for debt," reinforcing access models based on performance rather than need.',
      severity: 'medium' as const,
    },
  ],
};

const mockMitigations = {
  'c1-1': {
    title: 'Introduce Transparent, Union-Negotiated Plans',
    description:
      'All pricing models must be co-developed with gig worker unions or cooperatives. The platform must disclose actuarial assumptions and renewal terms in plain language, and workers vote on changes annually.',
  },
  'c1-2': {
    title: 'Tie Platform Contributions to Insurance Pool',
    description:
      'Platforms are legally required to match worker contributions to the insurance wallet as a form of basic social responsibility. The insurance system becomes a bridge to universal benefits, not a replacement.',
  },
  'c1-3': {
    title: 'Use a Tiered Model with Safety Nets',
    description:
      'Offer three tiers of coverage, including a baseline safety net co-funded by a public-private pool. This ensures that even the lowest-income workers have essential protection (e.g. ER visits, disability support).',
  },
  'c1-4': {
    title: 'Decouple Insurance Access from Labor Hours',
    description:
      'Access to insurance plans is not conditional on gig performance. Instead, workers opt in voluntarily and can set automatic weekly contributions from earnings—preserving autonomy.',
  },
  // ... (other mitigations as before)
};

interface InventionGeneratorProps {}

const InventionGenerator: React.FC<InventionGeneratorProps> = () => {
  const [activeTab, setActiveTab] = useState('generation');
  const [currentIdeas, setCurrentIdeas] = useState<IdeaSeed[]>([]);
  const [selectedRootIdea, setSelectedRootIdea] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [selectedBranchPath, setSelectedBranchPath] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    consequences: Consequence[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedConsequence, setSelectedConsequence] =
    useState<Consequence | null>(null);
  const [showMitigation, setShowMitigation] = useState(false);
  const [currentMitigation, setCurrentMitigation] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Get root ideas (generation 0)
  const rootIdeas = currentIdeas.filter((idea) => idea.generation === 0);

  // Get latest version for each root idea
  const getLatestVersionForRoot = (rootId: string) => {
    const allVersions = currentIdeas.filter((idea) => idea.rootId === rootId);
    return allVersions.reduce((latest, current) => {
      const latestGen = latest.generation || 0;
      const currentGen = current.generation || 0;
      return currentGen > latestGen ? current : latest;
    }, allVersions[0]);
  };

  // Build version tree for selected root idea
  const buildVersionTree = (rootId: string) => {
    const allVersions = currentIdeas.filter((idea) => idea.rootId === rootId);
    const tree: { [generation: number]: IdeaSeed[] } = {};

    allVersions.forEach((idea) => {
      const gen = idea.generation || 0;
      if (!tree[gen]) tree[gen] = [];
      tree[gen].push(idea);
    });

    return tree;
  };

  // Filter tree based on selected branch path
  const getFilteredTree = (tree: { [generation: number]: IdeaSeed[] }) => {
    if (selectedBranchPath.length === 0) return tree;

    const filtered: { [generation: number]: IdeaSeed[] } = {};

    // Always include generation 0 (root)
    if (tree[0]) filtered[0] = tree[0];

    // Filter subsequent generations based on path
    Object.keys(tree).forEach((genKey) => {
      const gen = parseInt(genKey);
      if (gen === 0) return; // Already included

      const pathIndex = gen - 1;
      if (pathIndex < selectedBranchPath.length) {
        const parentId = selectedBranchPath[pathIndex];
        filtered[gen] = tree[gen].filter((idea) => idea.parentId === parentId);
      }
    });

    return filtered;
  };

  // Generate new idea
  const handleGenerateIdea = useCallback(() => {
    setIsGenerating(true);

    setTimeout(() => {
      const nextIndex = currentIdeas.length;
      const newIdea = mockIdeas[nextIndex % mockIdeas.length];
      const ideaWithId = {
        ...newIdea,
        id: `idea-${Date.now()}`,
        rootId: `idea-${Date.now()}`,
        createdAt: new Date(),
      };

      setCurrentIdeas((prev) => [...prev, ideaWithId]);
      setSelectedRootIdea(ideaWithId.rootId);
      setSelectedVersionId(ideaWithId.id);
      setSelectedBranchPath([]);
      setIsGenerating(false);
    }, 2000);
  }, [currentIdeas.length]);

  // Select root idea
  const handleSelectRootIdea = useCallback(
    (rootId: string) => {
      setSelectedRootIdea(rootId);
      const latestVersion = getLatestVersionForRoot(rootId);
      setSelectedVersionId(latestVersion.id);
      setSelectedBranchPath([]);
      setAnalysisResult(null);
    },
    [currentIdeas]
  );

  // Select specific version
  const handleSelectVersion = useCallback(
    (versionId: string) => {
      const version = currentIdeas.find((idea) => idea.id === versionId);
      if (!version) return;

      setSelectedVersionId(versionId);

      // Update branch path based on selected version
      const newPath: string[] = [];
      let current = version;

      while (current && current.parentId) {
        newPath.unshift(current.parentId);
        current = currentIdeas.find((idea) => idea.id === current?.parentId);
      }

      setSelectedBranchPath(newPath);
    },
    [currentIdeas]
  );

  // Navigate to enhancement tab with selected version
  const handleEnhanceIdea = useCallback(() => {
    setActiveTab('enhancement');
  }, []);

  // Navigate to visualization tab with selected version
  const handleVisualizeIdea = useCallback(() => {
    setActiveTab('visualization');
  }, []);

  // Apply mitigation (create new version)
  const handleApplyMitigation = useCallback(() => {
    if (!selectedVersionId || !selectedConsequence || !currentMitigation)
      return;

    const selectedVersion = currentIdeas.find(
      (idea) => idea.id === selectedVersionId
    );
    if (!selectedVersion) return;

    const newVersion: IdeaSeed = {
      ...selectedVersion,
      id: `${selectedVersion.id}-enhanced-${Date.now()}`,
      version: `${selectedVersion.version.split('.')[0]}.${
        parseInt(selectedVersion.version.split('.')[1]) + 1
      }`,
      parentId: selectedVersion.id,
      title: `${selectedVersion.title} (Enhanced)`,
      description: `${selectedVersion.description}\n\n**Enhancement:** ${currentMitigation.description}`,
      branchedFrom: {
        version: selectedVersion.version,
        reason: `Mitigated: ${selectedConsequence.title}`,
        tool: 'Envision Consequences',
      },
      modifications: [`Applied mitigation for: ${selectedConsequence.title}`],
      generation: selectedVersion.generation + 1,
      rootId: selectedVersion.rootId,
      createdAt: new Date(),
    };

    setCurrentIdeas((prev) => [...prev, newVersion]);
    setSelectedVersionId(newVersion.id);
    setSelectedBranchPath([...selectedBranchPath, selectedVersion.id]);
    setAnalysisResult(null);
    setSelectedConsequence(null);
    setShowMitigation(false);
    setCurrentMitigation(null);
    setActiveTab('generation'); // Go back to see the new version

    // Scroll to show the tree area (accounting for navbar/floating nav)
    setTimeout(() => {
      const treeElement = document.getElementById('version-tree-section');
      if (treeElement) {
        const navbarHeight = 120; // Adjust this value based on your navbar height
        const elementTop =
          treeElement.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementTop - navbarHeight,
          behavior: 'smooth',
        });
      } else {
        // Fallback: scroll to a reasonable position from top
        window.scrollTo({ top: 200, behavior: 'smooth' });
      }
    }, 200);
  }, [
    selectedVersionId,
    selectedConsequence,
    currentMitigation,
    currentIdeas,
    selectedBranchPath,
  ]);

  // Analyze consequences for selected version
  const handleAnalyzeConsequences = useCallback(() => {
    if (!selectedVersionId) return;

    const selectedVersion = currentIdeas.find(
      (idea) => idea.id === selectedVersionId
    );
    if (!selectedVersion) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      // Map to the right consequences based on idea content
      let consequenceKey = 'idea-1';
      if (selectedVersion.title.includes('Street Vendor'))
        consequenceKey = 'idea-2';
      if (selectedVersion.title.includes('Microloan'))
        consequenceKey = 'idea-3';

      const consequences =
        mockConsequences[consequenceKey as keyof typeof mockConsequences] || [];
      setAnalysisResult({ consequences });
      setIsAnalyzing(false);

      // Scroll to consequences section after a brief delay
      setTimeout(() => {
        const consequencesElement = document.getElementById(
          'consequences-section'
        );
        if (consequencesElement) {
          consequencesElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 200);
    }, 1500);
  }, [selectedVersionId, currentIdeas]);

  // Select consequence for mitigation
  const handleSelectConsequence = useCallback((consequence: Consequence) => {
    setSelectedConsequence(consequence);
    const mitigation =
      mockMitigations[consequence.id as keyof typeof mockMitigations];
    setCurrentMitigation(mitigation);
    setShowMitigation(true);

    // Scroll to mitigation preview after a brief delay
    setTimeout(() => {
      const mitigationElement = document.getElementById('mitigation-preview');
      if (mitigationElement) {
        mitigationElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 200);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const selectedVersion = selectedVersionId
    ? currentIdeas.find((idea) => idea.id === selectedVersionId)
    : null;
  const versionTree = selectedRootIdea
    ? buildVersionTree(selectedRootIdea)
    : {};
  const filteredTree = getFilteredTree(versionTree);

  return (
    <VStack gap={6} align='stretch'>
      {/* Header Section */}
      <VStack gap={2} align='start'>
        <Heading as='h3' size='md' color='fg' fontFamily='heading'>
          <HStack gap={2}>
            <FiCpu size={20} />
            <Text>Invention Generator</Text>
            <Badge colorScheme='green' size='sm'>
              Available
            </Badge>
          </HStack>
        </Heading>
        <Text color='fg.muted' fontSize='sm' fontFamily='body'>
          Create and develop speculative idea seeds through systematic analysis
          and evolution.
        </Text>
      </VStack>

      <Card.Root
        variant='outline'
        borderColor='border.emphasized'
        bg='bg.canvas'
      >
        <Card.Body p={6}>
          <Tabs.Root
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value)}
          >
            <Tabs.List mb={6}>
              <Tabs.Trigger value='generation'>
                <FiCpu size={16} />
                Idea Generation
              </Tabs.Trigger>
              <Tabs.Trigger value='enhancement'>
                <FiTrendingUp size={16} />
                Enhancement
              </Tabs.Trigger>
              <Tabs.Trigger value='visualization'>
                <FiImage size={16} />
                Visualization
              </Tabs.Trigger>
              <Tabs.Trigger value='implementation'>
                <FiMap size={16} />
                Implementation
              </Tabs.Trigger>
            </Tabs.List>

            {/* Idea Generation Tab */}
            <Tabs.Content value='generation'>
              <VStack gap={6} align='stretch'>
                {!selectedRootIdea ? (
                  <>
                    {/* Generator Controls */}
                    <VStack gap={4} align='stretch'>
                      <HStack justify='space-between' align='center'>
                        <Text fontSize='md' fontWeight='medium' color='fg'>
                          Generate New Idea Seed
                        </Text>
                        <Button
                          onClick={handleGenerateIdea}
                          loading={isGenerating}
                          colorScheme='blue'
                          size='md'
                        >
                          <FiPlay size={16} />
                          Generate Idea
                        </Button>
                      </HStack>

                      <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                        Combines 3-5 concepts into speculative invention seeds.
                        Each generation creates unique combinations from
                        embedded finance, gig economy, e-learning, and other
                        emerging domains.
                      </Text>
                    </VStack>

                    {/* Root Ideas List */}
                    {rootIdeas.length > 0 && (
                      <VStack gap={3} align='stretch'>
                        <Text fontSize='md' fontWeight='medium' color='fg'>
                          Idea Seeds ({rootIdeas.length})
                        </Text>

                        {rootIdeas.map((rootIdea) => {
                          const latestVersion = getLatestVersionForRoot(
                            rootIdea.rootId
                          );
                          return (
                            <Card.Root
                              key={rootIdea.id}
                              variant='outline'
                              borderColor='border.muted'
                              bg='bg.canvas'
                              cursor='pointer'
                              onClick={() =>
                                handleSelectRootIdea(rootIdea.rootId)
                              }
                              _hover={{
                                borderColor: 'brand',
                                bg: 'bg',
                              }}
                            >
                              <Card.Body p={4}>
                                <VStack gap={3} align='stretch'>
                                  <HStack gap={2} align='center'>
                                    <Badge colorScheme='green' size='sm'>
                                      Root
                                    </Badge>
                                    {latestVersion.id !== rootIdea.id && (
                                      <Badge colorScheme='blue' size='sm'>
                                        Latest: v{latestVersion.version}
                                      </Badge>
                                    )}
                                    <Text
                                      fontSize='md'
                                      fontWeight='medium'
                                      color='fg'
                                    >
                                      {latestVersion.title}
                                    </Text>
                                  </HStack>

                                  <Text
                                    fontSize='sm'
                                    color='fg.muted'
                                    lineHeight='1.5'
                                  >
                                    {latestVersion.description}
                                  </Text>

                                  <HStack gap={2} flexWrap='wrap'>
                                    {latestVersion.concepts.map((concept) => (
                                      <Badge
                                        key={concept.id}
                                        colorScheme='gray'
                                        size='sm'
                                      >
                                        {concept.name}
                                      </Badge>
                                    ))}
                                  </HStack>
                                </VStack>
                              </Card.Body>
                            </Card.Root>
                          );
                        })}
                      </VStack>
                    )}
                  </>
                ) : (
                  <>
                    {/* Version Tree View */}
                    <VStack gap={4} align='stretch'>
                      <HStack justify='space-between' align='center'>
                        <Text fontSize='md' fontWeight='medium' color='fg'>
                          Version History
                        </Text>
                        <HStack gap={2}>
                          <Button
                            onClick={() => setSelectedRootIdea(null)}
                            variant='ghost'
                            size='sm'
                            color='fg'
                          >
                            ← Back to All Ideas
                          </Button>
                          <Button
                            onClick={handleGenerateIdea}
                            variant='outline'
                            size='sm'
                            color='fg'
                          >
                            <FiPlay size={14} />
                            Generate New
                          </Button>
                        </HStack>
                      </HStack>

                      {/* Version Tree */}
                      <VStack id='version-tree-section' gap={6} align='stretch'>
                        {Object.keys(filteredTree)
                          .sort((a, b) => parseInt(a) - parseInt(b))
                          .map((genKey) => {
                            const generation = parseInt(genKey);
                            const versions = filteredTree[generation];

                            return (
                              <VStack key={generation} gap={3} align='stretch'>
                                <Text
                                  fontSize='sm'
                                  fontWeight='medium'
                                  color='fg.muted'
                                >
                                  {generation === 0
                                    ? 'Original Idea'
                                    : `Generation ${generation}`}
                                </Text>

                                <HStack gap={4} align='start' flexWrap='wrap'>
                                  {versions.map((version, index) => (
                                    <VStack
                                      key={version.id}
                                      gap={2}
                                      align='center'
                                    >
                                      {/* Connection Line */}
                                      {generation > 0 && (
                                        <Box
                                          w='2px'
                                          h='20px'
                                          bg='border.muted'
                                        />
                                      )}

                                      {/* Version Box */}
                                      <Card.Root
                                        variant='outline'
                                        borderColor={
                                          selectedVersionId === version.id
                                            ? 'brand'
                                            : 'border.muted'
                                        }
                                        bg={
                                          selectedVersionId === version.id
                                            ? 'brand'
                                            : 'bg.canvas'
                                        }
                                        cursor='pointer'
                                        onClick={() =>
                                          handleSelectVersion(version.id)
                                        }
                                        w={
                                          selectedVersionId === version.id
                                            ? '300px'
                                            : '200px'
                                        }
                                        transition='all 0.2s'
                                        _hover={{
                                          borderColor: 'brand',
                                          transform: 'translateY(-2px)',
                                        }}
                                      >
                                        <Card.Body p={3}>
                                          <VStack gap={2} align='stretch'>
                                            <HStack gap={2}>
                                              <Badge
                                                colorScheme={
                                                  generation === 0
                                                    ? 'green'
                                                    : 'blue'
                                                }
                                                size='sm'
                                              >
                                                v{version.version}
                                              </Badge>
                                              {version.branchedFrom && (
                                                <Badge
                                                  colorScheme='purple'
                                                  size='xs'
                                                >
                                                  Enhanced
                                                </Badge>
                                              )}
                                            </HStack>

                                            <Text
                                              fontSize={
                                                selectedVersionId === version.id
                                                  ? 'sm'
                                                  : 'xs'
                                              }
                                              fontWeight='medium'
                                              color={
                                                selectedVersionId === version.id
                                                  ? 'white'
                                                  : 'fg'
                                              }
                                              noOfLines={
                                                selectedVersionId === version.id
                                                  ? undefined
                                                  : 2
                                              }
                                            >
                                              {version.title}
                                            </Text>

                                            {selectedVersionId ===
                                              version.id && (
                                              <>
                                                <Box
                                                  bg='bg.canvas'
                                                  borderRadius='md'
                                                  p={3}
                                                  border='1px solid'
                                                  borderColor='border.muted'
                                                >
                                                  <Text
                                                    fontSize='xs'
                                                    color='fg'
                                                    lineHeight='1.4'
                                                  >
                                                    {version.description}
                                                  </Text>
                                                </Box>

                                                <HStack gap={2} flexWrap='wrap'>
                                                  {version.concepts
                                                    .slice(0, 3)
                                                    .map((concept) => (
                                                      <Badge
                                                        key={concept.id}
                                                        colorScheme='gray'
                                                        size='xs'
                                                      >
                                                        {concept.name}
                                                      </Badge>
                                                    ))}
                                                </HStack>

                                                {version.branchedFrom && (
                                                  <Box
                                                    bg='bg.canvas'
                                                    border='1px solid'
                                                    borderColor='success'
                                                    borderRadius='md'
                                                    p={2}
                                                  >
                                                    <Text
                                                      fontSize='xs'
                                                      color='success'
                                                      fontWeight='medium'
                                                    >
                                                      {
                                                        version.branchedFrom
                                                          .reason
                                                      }
                                                    </Text>
                                                  </Box>
                                                )}

                                                <HStack gap={2} mt={2}>
                                                  <Button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleEnhanceIdea();
                                                    }}
                                                    size='xs'
                                                    colorScheme='blue'
                                                    variant='outline'
                                                    px={3}
                                                    py={2}
                                                    color='fg'
                                                  >
                                                    <FiEdit3 size={12} />
                                                    Enhance
                                                  </Button>
                                                  <Button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleVisualizeIdea();
                                                    }}
                                                    size='xs'
                                                    colorScheme='green'
                                                    variant='outline'
                                                    px={3}
                                                    py={2}
                                                    color='fg'
                                                  >
                                                    <FiImage size={12} />
                                                    Visualize
                                                  </Button>
                                                </HStack>
                                              </>
                                            )}
                                          </VStack>
                                        </Card.Body>
                                      </Card.Root>
                                    </VStack>
                                  ))}

                                  {/* Suggestion for next enhancement */}
                                  {generation ===
                                    Math.max(
                                      ...Object.keys(filteredTree).map((k) =>
                                        parseInt(k)
                                      )
                                    ) && (
                                    <VStack gap={2} align='center'>
                                      {generation > 0 && (
                                        <Box
                                          w='2px'
                                          h='20px'
                                          bg='border.muted'
                                        />
                                      )}

                                      <Card.Root
                                        variant='outline'
                                        borderColor='border.muted'
                                        borderStyle='dashed'
                                        bg='bg.subtle'
                                        w='200px'
                                        cursor='pointer'
                                        onClick={handleEnhanceIdea}
                                        _hover={{
                                          borderColor: 'brand',
                                          bg: 'brand.subtle',
                                        }}
                                      >
                                        <Card.Body p={3}>
                                          <VStack gap={2}>
                                            <FiEdit3
                                              size={20}
                                              color='var(--chakra-colors-fg-muted)'
                                            />
                                            <Text
                                              fontSize='xs'
                                              color='fg.muted'
                                              textAlign='center'
                                            >
                                              Use enhancement tools
                                            </Text>
                                          </VStack>
                                        </Card.Body>
                                      </Card.Root>
                                    </VStack>
                                  )}
                                </HStack>
                              </VStack>
                            );
                          })}
                      </VStack>
                    </VStack>
                  </>
                )}
              </VStack>
            </Tabs.Content>

            {/* Enhancement Tab */}
            <Tabs.Content value='enhancement'>
              <VStack gap={6} align='stretch'>
                {selectedVersion ? (
                  <>
                    {/* Current Version Display */}
                    <VStack gap={4} align='stretch'>
                      <HStack justify='space-between' align='center'>
                        <Text fontSize='md' fontWeight='medium' color='fg'>
                          Enhancing: {selectedVersion.title} (v
                          {selectedVersion.version})
                        </Text>
                        <Button
                          onClick={() => setActiveTab('generation')}
                          variant='ghost'
                          size='sm'
                          color='fg'
                        >
                          ← Back to Tree
                        </Button>
                      </HStack>

                      <Box
                        bg='bg.subtle'
                        borderRadius='md'
                        border='1px solid'
                        borderColor='border.muted'
                        p={4}
                      >
                        <Text fontSize='sm' color='fg' lineHeight='1.5'>
                          {selectedVersion.description}
                        </Text>
                      </Box>
                    </VStack>

                    {/* Development Tools */}
                    <VStack gap={4} align='stretch'>
                      <Text fontSize='md' fontWeight='medium' color='fg'>
                        Development Tools
                      </Text>

                      <Button
                        onClick={handleAnalyzeConsequences}
                        loading={isAnalyzing}
                        variant='outline'
                        size='md'
                        justifyContent='flex-start'
                        h='auto'
                        p={4}
                        bg='fg'
                        color='bg.canvas'
                        borderColor='fg'
                        _hover={{
                          bg: 'fg',
                          color: 'bg.canvas',
                        }}
                      >
                        <VStack gap={2} align='start' flex='1'>
                          <HStack gap={2}>
                            <FiAlertCircle size={16} />
                            <Text fontSize='sm' fontWeight='medium'>
                              Envision Consequences
                            </Text>
                          </HStack>
                          <Text fontSize='xs' textAlign='left'>
                            {isAnalyzing
                              ? 'Analyzing potential societal, ethical, and technological impacts...'
                              : 'Explore potential negative consequences and develop mitigations'}
                          </Text>
                        </VStack>
                      </Button>

                      {/* Placeholder for other tools */}
                      <Button
                        variant='outline'
                        size='md'
                        justifyContent='flex-start'
                        h='auto'
                        p={4}
                        disabled
                        opacity={0.5}
                      >
                        <VStack gap={2} align='start' flex='1'>
                          <HStack gap={2}>
                            <FiTrendingUp size={16} />
                            <Text fontSize='sm' fontWeight='medium'>
                              Market Analysis
                            </Text>
                          </HStack>
                          <Text fontSize='xs' color='fg.muted' textAlign='left'>
                            Coming soon - Analyze market forces and business
                            viability
                          </Text>
                        </VStack>
                      </Button>
                    </VStack>

                    {/* Consequences Results */}
                    {analysisResult && (
                      <VStack id='consequences-section' gap={4} align='stretch'>
                        <Text fontSize='md' fontWeight='medium' color='fg'>
                          Identified Consequences
                        </Text>

                        {analysisResult.consequences.map((consequence) => (
                          <Card.Root
                            key={consequence.id}
                            variant='outline'
                            borderColor='border.muted'
                            bg='bg.canvas'
                          >
                            <Card.Body p={4}>
                              <VStack gap={3} align='stretch'>
                                <HStack justify='space-between' align='start'>
                                  <VStack gap={1} align='start' flex='1'>
                                    <HStack gap={2}>
                                      <Text
                                        fontSize='sm'
                                        fontWeight='medium'
                                        color='fg'
                                      >
                                        {consequence.title}
                                      </Text>
                                      <Badge
                                        colorScheme={getSeverityColor(
                                          consequence.severity
                                        )}
                                        size='sm'
                                      >
                                        {consequence.severity}
                                      </Badge>
                                    </HStack>
                                    <Text
                                      fontSize='sm'
                                      color='fg.muted'
                                      lineHeight='1.5'
                                    >
                                      {consequence.description}
                                    </Text>
                                  </VStack>
                                  <Button
                                    onClick={() =>
                                      handleSelectConsequence(consequence)
                                    }
                                    size='sm'
                                    bg='brand'
                                    color='white'
                                    border='none'
                                    _hover={{
                                      bg: 'brand',
                                    }}
                                  >
                                    Mitigate
                                  </Button>
                                </HStack>
                              </VStack>
                            </Card.Body>
                          </Card.Root>
                        ))}
                      </VStack>
                    )}

                    {/* Mitigation Preview */}
                    {showMitigation &&
                      selectedConsequence &&
                      currentMitigation && (
                        <Card.Root
                          id='mitigation-preview'
                          variant='outline'
                          borderColor='success'
                          bg='success.subtle'
                        >
                          <Card.Body p={4}>
                            <VStack gap={4} align='stretch'>
                              <Text
                                fontSize='md'
                                fontWeight='medium'
                                color='fg'
                              >
                                Proposed Enhancement
                              </Text>

                              <VStack gap={3} align='stretch'>
                                <Box>
                                  <Text
                                    fontSize='sm'
                                    fontWeight='medium'
                                    color='fg'
                                    mb={1}
                                  >
                                    Addresses: {selectedConsequence.title}
                                  </Text>
                                  <Text fontSize='sm' color='fg.muted'>
                                    {selectedConsequence.description}
                                  </Text>
                                </Box>

                                <Box>
                                  <Text
                                    fontSize='sm'
                                    fontWeight='medium'
                                    color='success'
                                    mb={1}
                                  >
                                    Solution: {currentMitigation.title}
                                  </Text>
                                  <Text
                                    fontSize='sm'
                                    color='fg'
                                    lineHeight='1.5'
                                  >
                                    {currentMitigation.description}
                                  </Text>
                                </Box>
                              </VStack>

                              <HStack justify='flex-end' gap={3}>
                                <Button
                                  onClick={() => setShowMitigation(false)}
                                  variant='solid'
                                  size='sm'
                                  bg='error'
                                  color='white'
                                  border='none'
                                  _hover={{
                                    bg: 'error',
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleApplyMitigation}
                                  size='sm'
                                  bg='brand'
                                  border='none'
                                  color='white'
                                  _hover={{
                                    bg: 'brand',
                                  }}
                                >
                                  <FiTool size={12} />
                                  Apply Enhancement
                                </Button>
                              </HStack>
                            </VStack>
                          </Card.Body>
                        </Card.Root>
                      )}
                  </>
                ) : (
                  <Box textAlign='center' py={8}>
                    <Text color='fg.muted' fontSize='sm'>
                      Select a version from the Generation tab to begin
                      enhancement
                    </Text>
                  </Box>
                )}
              </VStack>
            </Tabs.Content>

            {/* Visualization Tab */}
            <Tabs.Content value='visualization'>
              <VStack gap={4} align='stretch'>
                {selectedVersion ? (
                  <>
                    <HStack justify='space-between' align='center'>
                      <Text fontSize='md' fontWeight='medium' color='fg'>
                        Visualizing: {selectedVersion.title} (v
                        {selectedVersion.version})
                      </Text>
                      <Button
                        onClick={() => setActiveTab('generation')}
                        variant='ghost'
                        size='sm'
                        color='fg'
                      >
                        ← Back to Tree
                      </Button>
                    </HStack>

                    <Box
                      bg='bg.subtle'
                      borderRadius='md'
                      border='1px solid'
                      borderColor='border.muted'
                      p={4}
                    >
                      <Text fontSize='sm' color='fg.muted' mb={2}>
                        Description to use for visualization:
                      </Text>
                      <Text fontSize='sm' color='fg' lineHeight='1.5'>
                        {selectedVersion.description}
                      </Text>
                    </Box>

                    <VStack gap={3} align='stretch'>
                      <Text fontSize='sm' color='fg.muted'>
                        Use the Futuregrapher and Future Stories tools below
                        with this description.
                      </Text>
                    </VStack>
                  </>
                ) : (
                  <Box textAlign='center' py={8}>
                    <VStack gap={3}>
                      <FiImage
                        size={48}
                        color='var(--chakra-colors-fg-muted)'
                      />
                      <Text color='fg.muted' fontSize='sm'>
                        Select a version from the Generation tab to visualize
                      </Text>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Tabs.Content>

            {/* Implementation Tab */}
            <Tabs.Content value='implementation'>
              <Box textAlign='center' py={8}>
                <VStack gap={3}>
                  <FiMap size={48} color='var(--chakra-colors-fg-muted)' />
                  <Text color='fg.muted' fontSize='sm'>
                    Implementation planning tools coming soon
                  </Text>
                </VStack>
              </Box>
            </Tabs.Content>
          </Tabs.Root>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
};

export default InventionGenerator;
