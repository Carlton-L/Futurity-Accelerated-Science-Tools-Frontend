import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Badge,
  Tabs,
  Input,
} from '@chakra-ui/react';
import {
  FiTarget,
  FiCpu,
  FiEye,
  FiMap,
  FiPlay,
  FiDownload,
  FiShare,
  FiRefreshCw,
  FiSettings,
  FiUsers,
  FiImage,
  FiFileText,
  FiTrendingUp,
  FiExternalLink,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaLightbulb } from 'react-icons/fa';

// Types
interface Subject {
  id: string;
  name: string;
  description: string;
}

interface IdeaSeed {
  id: string;
  name: string;
  description: string;
  relatedSubjects: string[];
  consequences?: string[];
  improvements?: string[];
  stories?: string[];
  personas?: string[];
  roadmap?: string[];
  createdAt: string;
}

interface LabGoal {
  id: string;
  problem: string;
  userGroup: string;
  impact: number;
}

interface MiroTemplate {
  id: string;
  name: string;
  type: 'blank' | 'synthesizing' | 'custom';
}

interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  inputs: string[];
  outputs: string[];
  status: 'available' | 'development' | 'coming_soon';
  requiresIdeaSeed?: boolean;
}

interface ToolResult {
  [key: string]: any;
}

interface BrainstormResult {
  miroBoard: string;
  populatedItems: number;
  template: string;
}

interface InventionGeneratorResult {
  generatedIdea: IdeaSeed;
  topCombinations: string[];
}

interface ConsequencesResult {
  steepAnalysis: {
    social: string[];
    technological: string[];
    economic: string[];
    environmental: string[];
    political: string[];
  };
}

interface GenericToolResult {
  improvements: string[];
  confidence: number;
}

interface InventProps {
  labId: string;
}

const Invent: React.FC<InventProps> = ({ labId }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [ideaSeeds, setIdeaSeeds] = useState<IdeaSeed[]>([]);
  const [labGoals, setLabGoals] = useState<LabGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('generation');

  // Lab Goals state
  const [labGoalsCompleted, setLabGoalsCompleted] = useState<boolean>(false);
  const [newGoal, setNewGoal] = useState({
    problem: '',
    userGroup: '',
    impact: 50,
  });

  // Brainstorm Starter state
  const [brainstormCompleted, setBrainstormCompleted] =
    useState<boolean>(false);
  const [selectedMiroTemplate, setSelectedMiroTemplate] = useState<string>('');

  // Tool-specific state
  const [selectedIdeaSeed, setSelectedIdeaSeed] = useState<string>('');
  const [toolResults, setToolResults] = useState<Record<string, ToolResult>>(
    {}
  );
  const [toolLoading, setToolLoading] = useState<Record<string, boolean>>({});

  // Tool configurations (reorganized)
  const toolConfigs: ToolConfig[] = [
    // Idea Generation - Only Invention Generator
    {
      id: 'invention-generator',
      name: 'Invention Generator',
      description:
        'Use combinatorial innovation to generate new IdeaSeeds from your subjects and lab goals.',
      icon: FiCpu,
      category: 'generation',
      inputs: ['Subjects', 'Lab Goals'],
      outputs: ['FS IdeaSeed'],
      status: 'available',
    },

    // Idea Enhancement Tools (moved Envision Consequences here)
    {
      id: 'envision-consequences',
      name: 'Envision Consequences',
      description:
        'Use the STEEP framework to explore positive, negative, and neutral consequences of your ideas.',
      icon: FiEye,
      category: 'enhancement',
      inputs: ['FS IdeaSeed'],
      outputs: ['STEEP Consequences'],
      status: 'available',
      requiresIdeaSeed: true,
    },
    {
      id: 'triz-agent',
      name: 'TRIZ Agent',
      description:
        'Apply TRIZ methodology to find innovative solutions through contradiction resolution.',
      icon: FiCpu,
      category: 'enhancement',
      inputs: ['FS IdeaSeed'],
      outputs: ['TRIZ Operations'],
      status: 'development',
      requiresIdeaSeed: true,
    },
    {
      id: 'innovation-genome',
      name: 'Innovation Genome 7/49',
      description:
        'Generate improvements using the Innovation Genome framework questions.',
      icon: FiTrendingUp,
      category: 'enhancement',
      inputs: ['FS IdeaSeed'],
      outputs: ['IG Questions & Answers'],
      status: 'available',
      requiresIdeaSeed: true,
    },
    {
      id: 'lateral-thinking',
      name: 'Lateral Thinking Tools',
      description:
        'Break thinking patterns with focus, harvest, and treatment tools for better ideation.',
      icon: FaLightbulb,
      category: 'enhancement',
      inputs: ['FS IdeaSeed'],
      outputs: ['LT Improvements'],
      status: 'available',
      requiresIdeaSeed: true,
    },
    {
      id: 'cognitive-bias-checker',
      name: 'Cognitive Bias Checker',
      description:
        'Identify and work around cognitive biases that might be limiting your ideas.',
      icon: FiEye,
      category: 'enhancement',
      inputs: ['FS IdeaSeed'],
      outputs: ['Bias-Free Improvements'],
      status: 'available',
      requiresIdeaSeed: true,
    },
    {
      id: 'edgepushers',
      name: 'Edgepushers',
      description:
        'Push ideas to extremes with archetypal futures, user scenarios, and conflicting pairs.',
      icon: FiTrendingUp,
      category: 'enhancement',
      inputs: ['FS IdeaSeed'],
      outputs: ['Edge-Pushed Ideas'],
      status: 'available',
      requiresIdeaSeed: true,
    },
    {
      id: 'scamper',
      name: 'SCAMPER',
      description:
        'Systematic creative thinking using Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse.',
      icon: FiSettings,
      category: 'enhancement',
      inputs: ['FS IdeaSeed'],
      outputs: ['SCAMPER Variations'],
      status: 'coming_soon',
      requiresIdeaSeed: true,
    },

    // Idea Visualization Tools
    {
      id: 'futurestories',
      name: 'Futurestories',
      description:
        'Generate compelling stories, news articles, or advertisements set in the future.',
      icon: FiFileText,
      category: 'visualization',
      inputs: ['IdeaSeed'],
      outputs: ['Future Stories'],
      status: 'available',
      requiresIdeaSeed: true,
    },
    {
      id: 'futuregrapher',
      name: 'Futuregrapher',
      description:
        'Create visual representations and images of your future concepts.',
      icon: FiImage,
      category: 'visualization',
      inputs: ['IdeaSeed'],
      outputs: ['Future Images'],
      status: 'available',
      requiresIdeaSeed: true,
    },
    {
      id: 'futurefolks',
      name: 'Futurefolks',
      description:
        'Generate detailed personas with life stories connecting today to your future vision.',
      icon: FiUsers,
      category: 'visualization',
      inputs: ['IdeaSeed', 'Lab Goals'],
      outputs: ['Personas & Agents'],
      status: 'available',
      requiresIdeaSeed: true,
    },

    // Implementation Tools
    {
      id: 'roadmap-backcast',
      name: 'Roadmap/Backcast',
      description:
        'Create implementation plans by working backwards from your future vision to today.',
      icon: FiMap,
      category: 'implementation',
      inputs: ['IdeaSeed'],
      outputs: ['Ishikawa Diagram'],
      status: 'available',
      requiresIdeaSeed: true,
    },
  ];

  // Mock data loading
  useEffect(() => {
    const loadInventData = async () => {
      setLoading(true);

      // TODO: Replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock subjects
      const mockSubjects: Subject[] = [
        {
          id: 'subj-1',
          name: 'Luxury Fashion Trends',
          description: 'Analysis of luxury fashion market trends',
        },
        {
          id: 'subj-2',
          name: 'Sustainable Materials',
          description: 'Research on eco-friendly material innovations',
        },
        {
          id: 'subj-3',
          name: 'Consumer Behavior',
          description: 'Studies on luxury consumer preferences',
        },
        {
          id: 'subj-4',
          name: 'Digital Transformation',
          description: 'Technology adoption in luxury retail',
        },
      ];

      // Mock idea seeds
      const mockIdeaSeeds: IdeaSeed[] = [
        {
          id: 'idea-1',
          name: 'Smart Fabric Authentication',
          description: 'Blockchain-enabled fabric tags for luxury authenticity',
          relatedSubjects: ['subj-1', 'subj-4'],
          consequences: ['Reduced counterfeiting', 'Higher consumer trust'],
          createdAt: '2024-03-15T10:30:00Z',
        },
        {
          id: 'idea-2',
          name: 'Circular Fashion Platform',
          description:
            'Digital marketplace for luxury item lifecycle management',
          relatedSubjects: ['subj-2', 'subj-3'],
          improvements: ['Subscription model', 'AR try-on feature'],
          createdAt: '2024-03-14T14:20:00Z',
        },
      ];

      // Mock lab goals - check if they exist
      const mockLabGoals: LabGoal[] = [
        {
          id: 'goal-1',
          problem: 'Reduce fashion waste',
          userGroup: 'Eco-conscious consumers',
          impact: 85,
        },
        {
          id: 'goal-2',
          problem: 'Combat counterfeiting',
          userGroup: 'Luxury buyers',
          impact: 92,
        },
      ];

      setSubjects(mockSubjects);
      setIdeaSeeds(mockIdeaSeeds);
      setLabGoals(mockLabGoals);
      setLabGoalsCompleted(mockLabGoals.length > 0);
      setLoading(false);
    };

    loadInventData();
  }, [labId]);

  // Mock Miro templates
  const miroTemplates: MiroTemplate[] = [
    { id: 'template-1', name: 'Blank Board', type: 'blank' },
    { id: 'template-2', name: 'Synthesizing Futures', type: 'synthesizing' },
    { id: 'template-3', name: 'Innovation Canvas', type: 'custom' },
  ];

  // Lab Goals handlers
  const addLabGoal = () => {
    if (!newGoal.problem || !newGoal.userGroup) return;

    const goal: LabGoal = {
      id: `goal-${Date.now()}`,
      ...newGoal,
    };

    setLabGoals((prev) => [...prev, goal]);
    setNewGoal({ problem: '', userGroup: '', impact: 50 });

    if (labGoals.length === 0) {
      setLabGoalsCompleted(true);
    }
  };

  const removeLabGoal = (goalId: string) => {
    setLabGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    if (labGoals.length <= 1) {
      setLabGoalsCompleted(false);
    }
  };

  // Brainstorm Starter handlers
  const runBrainstormStarter = async () => {
    if (!selectedMiroTemplate) return;

    setToolLoading((prev) => ({ ...prev, 'brainstorm-starter': true }));

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResult: BrainstormResult = {
      miroBoard: 'https://miro.com/board/mock-brainstorm-id',
      populatedItems: subjects.length,
      template: selectedMiroTemplate,
    };

    setToolResults((prev) => ({ ...prev, 'brainstorm-starter': mockResult }));
    setToolLoading((prev) => ({ ...prev, 'brainstorm-starter': false }));
    setBrainstormCompleted(true);
  };

  // Tool handlers
  const runTool = async (toolId: string) => {
    setToolLoading((prev) => ({ ...prev, [toolId]: true }));

    // TODO: Replace with actual API calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock results based on tool type
    let mockResult: ToolResult;
    switch (toolId) {
      case 'invention-generator': {
        const newIdeaSeed: IdeaSeed = {
          id: `idea-${Date.now()}`,
          name: `Generated Idea ${ideaSeeds.length + 1}`,
          description:
            'AI-generated innovative concept combining selected subjects',
          relatedSubjects: subjects.slice(0, 2).map((s) => s.id),
          createdAt: new Date().toISOString(),
        };
        setIdeaSeeds((prev) => [...prev, newIdeaSeed]);
        mockResult = {
          generatedIdea: newIdeaSeed,
          topCombinations: [
            'Sustainable Materials + Digital Transformation',
            'Consumer Behavior + Luxury Fashion Trends',
            'Authentication + Circular Economy',
          ],
        } as InventionGeneratorResult;
        break;
      }
      case 'envision-consequences': {
        mockResult = {
          steepAnalysis: {
            social: ['Increased consumer awareness', 'Changed shopping habits'],
            technological: ['New authentication methods', 'Enhanced tracking'],
            economic: ['New revenue streams', 'Reduced waste costs'],
            environmental: [
              'Lower carbon footprint',
              'Circular economy growth',
            ],
            political: ['New regulations needed', 'Policy support required'],
          },
        } as ConsequencesResult;
        break;
      }
      default: {
        mockResult = {
          improvements: [
            `Generated improvements for ${toolId}`,
            'Enhanced idea clarity',
            'New perspectives added',
          ],
          confidence: Math.random() * 0.3 + 0.7,
        } as GenericToolResult;
        break;
      }
    }

    setToolResults((prev) => ({ ...prev, [toolId]: mockResult }));
    setToolLoading((prev) => ({ ...prev, [toolId]: false }));
  };

  // Utility functions
  const exportResults = (toolId: string) => {
    console.log(`Exporting results for ${toolId}:`, toolResults[toolId]);
    alert(`Results exported for ${toolId}! (Mock implementation)`);
  };

  const shareResults = (toolId: string) => {
    console.log(`Sharing results for ${toolId}:`, toolResults[toolId]);
    alert(`Results shared for ${toolId}! (Mock implementation)`);
  };

  const getToolsByCategory = (category: string) => {
    return toolConfigs.filter((tool) => tool.category === category);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <Badge colorScheme='green' size='sm'>
            Available
          </Badge>
        );
      case 'development':
        return (
          <Badge colorScheme='orange' size='sm'>
            In Development
          </Badge>
        );
      case 'coming_soon':
        return (
          <Badge colorScheme='gray' size='sm'>
            Coming Soon
          </Badge>
        );
      default:
        return (
          <Badge colorScheme='gray' size='sm'>
            Unknown
          </Badge>
        );
    }
  };

  const navigateToIdeaSeed = (ideaId: string) => {
    // TODO: Implement navigation to IdeaSeed detail page
    console.log(`Navigate to IdeaSeed: ${ideaId}`);
    alert(
      `Navigate to IdeaSeed page for ${
        ideaSeeds.find((idea) => idea.id === ideaId)?.name
      } (Mock implementation)`
    );
  };

  const ToolCard: React.FC<{ tool: ToolConfig }> = ({ tool }) => {
    const IconComponent = tool.icon;
    const hasResults = toolResults[tool.id];
    const isLoading = toolLoading[tool.id];
    const isDisabled = tool.requiresIdeaSeed && !selectedIdeaSeed;

    return (
      <Card.Root opacity={isDisabled ? 0.6 : 1}>
        <Card.Body p={4}>
          <VStack gap={3} align='stretch'>
            <HStack justify='space-between' align='start'>
              <HStack>
                <IconComponent size={20} />
                <VStack gap={1} align='start'>
                  <Heading as='h4' size='sm'>
                    {tool.name}
                  </Heading>
                  {getStatusBadge(tool.status)}
                </VStack>
              </HStack>
            </HStack>

            <Text fontSize='sm' color='gray.600' lineHeight='1.4'>
              {tool.description}
            </Text>

            <Box>
              <Text fontSize='xs' fontWeight='medium' color='gray.500' mb={1}>
                Inputs: {tool.inputs.join(', ')}
              </Text>
              <Text fontSize='xs' fontWeight='medium' color='gray.500'>
                Outputs: {tool.outputs.join(', ')}
              </Text>
            </Box>

            {tool.requiresIdeaSeed && (
              <Box>
                <Text fontSize='xs' fontWeight='medium' mb={1}>
                  Required IdeaSeed
                </Text>
                <Box
                  border='1px solid'
                  borderColor={selectedIdeaSeed ? 'green.200' : 'red.200'}
                  borderRadius='md'
                  p={2}
                >
                  <Text fontSize='sm' color='gray.500' mb={1}>
                    {selectedIdeaSeed
                      ? ideaSeeds.find((idea) => idea.id === selectedIdeaSeed)
                          ?.name || 'Unknown'
                      : 'No IdeaSeed selected'}
                  </Text>
                  {!selectedIdeaSeed && ideaSeeds.length === 0 && (
                    <Text fontSize='xs' color='red.500'>
                      Create an IdeaSeed using the Invention Generator first
                    </Text>
                  )}
                </Box>
              </Box>
            )}

            <Button
              colorScheme='blue'
              size='sm'
              onClick={() => runTool(tool.id)}
              loading={isLoading}
              disabled={
                tool.status === 'coming_soon' || isLoading || isDisabled
              }
            >
              <FiPlay size={14} />
              Run Tool
            </Button>

            {hasResults && (
              <Box p={3} bg='gray.50' borderRadius='md'>
                <Text fontSize='xs' fontWeight='medium' mb={2}>
                  Results
                </Text>
                <Text fontSize='xs' color='gray.600' mb={2}>
                  Tool completed successfully. View details below.
                </Text>
                <HStack>
                  <Button
                    size='xs'
                    variant='outline'
                    onClick={() => exportResults(tool.id)}
                  >
                    <FiDownload size={12} />
                    Export
                  </Button>
                  <Button
                    size='xs'
                    variant='outline'
                    onClick={() => shareResults(tool.id)}
                  >
                    <FiShare size={12} />
                    Share
                  </Button>
                </HStack>
              </Box>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  };

  if (loading) {
    return (
      <Box>
        <Card.Root>
          <Card.Body p={6}>
            <Text>Loading invention tools...</Text>
          </Card.Body>
        </Card.Root>
      </Box>
    );
  }

  return (
    <Box>
      <VStack gap={6} align='stretch'>
        {/* Header */}
        <Card.Root>
          <Card.Body p={6}>
            <Heading as='h2' size='lg' mb={2}>
              Invention Tools
            </Heading>
            <Text color='gray.600'>
              Transform your research into breakthrough innovations using our
              comprehensive invention toolkit.
            </Text>
          </Card.Body>
        </Card.Root>

        {/* Lab Goals - Required Foundation */}
        <Card.Root
          borderColor={labGoalsCompleted ? 'green.200' : 'orange.200'}
          borderWidth='2px'
        >
          <Card.Body p={6}>
            <HStack justify='space-between' align='start' mb={4}>
              <VStack gap={1} align='start'>
                <HStack>
                  <FiTarget size={20} />
                  <Heading as='h3' size='md'>
                    Lab Goals
                  </Heading>
                  {labGoalsCompleted ? (
                    <Badge colorScheme='green'>
                      <FiCheck size={12} /> Complete
                    </Badge>
                  ) : (
                    <Badge colorScheme='orange'>
                      <FiAlertCircle size={12} /> Required
                    </Badge>
                  )}
                </HStack>
                <Text color='gray.600' fontSize='sm'>
                  Define the problems your lab aims to solve. This is required
                  before using other invention tools.
                </Text>
              </VStack>
            </HStack>

            {/* Existing Lab Goals */}
            {labGoals.length > 0 && (
              <VStack gap={2} align='stretch' mb={4}>
                <Text fontWeight='medium' fontSize='sm'>
                  Current Lab Goals:
                </Text>
                {labGoals.map((goal) => (
                  <HStack
                    key={goal.id}
                    p={3}
                    bg='gray.50'
                    borderRadius='md'
                    justify='space-between'
                  >
                    <VStack gap={1} align='start' flex='1'>
                      <Text fontSize='sm' fontWeight='medium'>
                        {goal.problem}
                      </Text>
                      <Text fontSize='xs' color='gray.600'>
                        Target: {goal.userGroup} • Impact Score: {goal.impact}
                        /100
                      </Text>
                    </VStack>
                    <Button
                      size='xs'
                      colorScheme='red'
                      variant='ghost'
                      onClick={() => removeLabGoal(goal.id)}
                    >
                      Remove
                    </Button>
                  </HStack>
                ))}
              </VStack>
            )}

            {/* Add New Lab Goal */}
            <VStack gap={3} align='stretch'>
              <Text fontWeight='medium' fontSize='sm'>
                Add New Lab Goal:
              </Text>
              <Grid templateColumns='2fr 2fr 1fr auto' gap={3} alignItems='end'>
                <Box>
                  <Text fontSize='xs' mb={1}>
                    Problem Statement
                  </Text>
                  <Input
                    size='sm'
                    placeholder='e.g., Reduce fashion waste'
                    value={newGoal.problem}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        problem: e.target.value,
                      }))
                    }
                  />
                </Box>
                <Box>
                  <Text fontSize='xs' mb={1}>
                    Target User Group
                  </Text>
                  <Input
                    size='sm'
                    placeholder='e.g., Eco-conscious consumers'
                    value={newGoal.userGroup}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        userGroup: e.target.value,
                      }))
                    }
                  />
                </Box>
                <Box>
                  <Text fontSize='xs' mb={1}>
                    Impact Score
                  </Text>
                  <Input
                    size='sm'
                    type='number'
                    min='1'
                    max='100'
                    value={newGoal.impact}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        impact: parseInt(e.target.value) || 50,
                      }))
                    }
                  />
                </Box>
                <Button
                  size='sm'
                  colorScheme='blue'
                  onClick={addLabGoal}
                  disabled={!newGoal.problem || !newGoal.userGroup}
                >
                  Add Goal
                </Button>
              </Grid>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Brainstorm Starter - One-time Lab Setup */}
        <Card.Root
          opacity={!labGoalsCompleted ? 0.6 : 1}
          borderColor={brainstormCompleted ? 'green.200' : 'blue.200'}
          borderWidth='2px'
        >
          <Card.Body p={6}>
            <HStack justify='space-between' align='start' mb={4}>
              <VStack gap={1} align='start'>
                <HStack>
                  <FaLightbulb size={20} />
                  <Heading as='h3' size='md'>
                    Brainstorm Starter
                  </Heading>
                  {brainstormCompleted ? (
                    <Badge colorScheme='green'>
                      <FiCheck size={12} /> Complete
                    </Badge>
                  ) : (
                    <Badge colorScheme='blue'>One-time Setup</Badge>
                  )}
                </HStack>
                <Text color='gray.600' fontSize='sm'>
                  Create your lab's brainstorming board with all subjects. This
                  is done once per lab.
                </Text>
              </VStack>
            </HStack>

            <Grid templateColumns='1fr auto' gap={4} alignItems='end'>
              <Box>
                <Text fontSize='sm' fontWeight='medium' mb={2}>
                  Miro Template ({subjects.length} subjects will be added)
                </Text>
                <VStack gap={2} align='stretch'>
                  {miroTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={
                        selectedMiroTemplate === template.id
                          ? 'solid'
                          : 'outline'
                      }
                      size='sm'
                      onClick={() => setSelectedMiroTemplate(template.id)}
                      justifyContent='flex-start'
                      disabled={!labGoalsCompleted}
                    >
                      {template.name}
                    </Button>
                  ))}
                </VStack>
              </Box>

              <VStack gap={3}>
                <Button
                  colorScheme='blue'
                  onClick={runBrainstormStarter}
                  loading={toolLoading['brainstorm-starter']}
                  disabled={
                    !labGoalsCompleted ||
                    !selectedMiroTemplate ||
                    brainstormCompleted
                  }
                >
                  <FiPlay size={16} />
                  {brainstormCompleted ? 'Board Created' : 'Create Board'}
                </Button>

                {toolResults['brainstorm-starter'] && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      window.open(
                        (toolResults['brainstorm-starter'] as BrainstormResult)
                          .miroBoard,
                        '_blank'
                      )
                    }
                  >
                    <FiExternalLink size={12} />
                    Open Board
                  </Button>
                )}
              </VStack>
            </Grid>
          </Card.Body>
        </Card.Root>

        {/* Tool Categories */}
        <Card.Root opacity={!labGoalsCompleted ? 0.6 : 1}>
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

              {/* Idea Generation - Invention Generator + IdeaSeeds */}
              <Tabs.Content value='generation'>
                <VStack gap={6} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={2}>
                      Idea Generation
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Generate new IdeaSeeds and manage your existing ideas.
                    </Text>
                  </Box>

                  <Grid templateColumns='1fr 2fr' gap={6}>
                    {/* Invention Generator Tool */}
                    <Box>
                      <Text fontWeight='medium' mb={3}>
                        Invention Generator
                      </Text>
                      <ToolCard tool={getToolsByCategory('generation')[0]} />
                    </Box>

                    {/* IdeaSeeds List */}
                    <Box>
                      <HStack justify='space-between' mb={3}>
                        <Text fontWeight='medium'>
                          Your IdeaSeeds ({ideaSeeds.length})
                        </Text>
                        <Text fontSize='xs' color='gray.500'>
                          Click to view/edit details
                        </Text>
                      </HStack>

                      {ideaSeeds.length === 0 ? (
                        <Box
                          p={6}
                          textAlign='center'
                          border='2px dashed'
                          borderColor='gray.200'
                          borderRadius='md'
                        >
                          <Text color='gray.500' mb={2}>
                            No IdeaSeeds yet
                          </Text>
                          <Text fontSize='sm' color='gray.400'>
                            Use the Invention Generator to create your first
                            idea
                          </Text>
                        </Box>
                      ) : (
                        <VStack
                          gap={3}
                          align='stretch'
                          maxH='400px'
                          overflowY='auto'
                        >
                          {ideaSeeds.map((idea) => (
                            <Card.Root
                              key={idea.id}
                              cursor='pointer'
                              _hover={{ shadow: 'md' }}
                              onClick={() => navigateToIdeaSeed(idea.id)}
                            >
                              <Card.Body p={4}>
                                <HStack justify='space-between' align='start'>
                                  <VStack gap={1} align='start' flex='1'>
                                    <HStack>
                                      <Text fontWeight='medium'>
                                        {idea.name}
                                      </Text>
                                      <Button
                                        size='xs'
                                        variant={
                                          selectedIdeaSeed === idea.id
                                            ? 'solid'
                                            : 'outline'
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedIdeaSeed(
                                            selectedIdeaSeed === idea.id
                                              ? ''
                                              : idea.id
                                          );
                                        }}
                                      >
                                        {selectedIdeaSeed === idea.id
                                          ? 'Selected'
                                          : 'Select'}
                                      </Button>
                                    </HStack>
                                    <Text fontSize='sm' color='gray.600'>
                                      {idea.description}
                                    </Text>
                                    <Text fontSize='xs' color='gray.500'>
                                      Created:{' '}
                                      {new Date(
                                        idea.createdAt
                                      ).toLocaleDateString()}{' '}
                                      •{idea.relatedSubjects.length} subjects
                                    </Text>
                                  </VStack>
                                  <FiExternalLink size={16} color='gray.400' />
                                </HStack>
                              </Card.Body>
                            </Card.Root>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </Grid>
                </VStack>
              </Tabs.Content>

              {/* Enhancement Tools */}
              <Tabs.Content value='enhancement'>
                <VStack gap={4} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={2}>
                      Idea Enhancement Tools
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Refine and improve your IdeaSeeds using proven innovation
                      methodologies.
                    </Text>
                    {!selectedIdeaSeed && (
                      <Box
                        p={3}
                        bg='orange.50'
                        borderRadius='md'
                        border='1px solid'
                        borderColor='orange.200'
                      >
                        <Text fontSize='sm' color='orange.700'>
                          Select an IdeaSeed from the Generation tab to use
                          these tools.
                        </Text>
                      </Box>
                    )}
                  </Box>

                  <Grid
                    templateColumns='repeat(auto-fit, minmax(350px, 1fr))'
                    gap={4}
                  >
                    {getToolsByCategory('enhancement').map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </Grid>
                </VStack>
              </Tabs.Content>

              {/* Visualization Tools */}
              <Tabs.Content value='visualization'>
                <VStack gap={4} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={2}>
                      Idea Visualization Tools
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Bring your IdeaSeeds to life with stories, images, and
                      personas.
                    </Text>
                    {!selectedIdeaSeed && (
                      <Box
                        p={3}
                        bg='orange.50'
                        borderRadius='md'
                        border='1px solid'
                        borderColor='orange.200'
                      >
                        <Text fontSize='sm' color='orange.700'>
                          Select an IdeaSeed from the Generation tab to use
                          these tools.
                        </Text>
                      </Box>
                    )}
                  </Box>

                  <Grid
                    templateColumns='repeat(auto-fit, minmax(350px, 1fr))'
                    gap={4}
                  >
                    {getToolsByCategory('visualization').map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </Grid>
                </VStack>
              </Tabs.Content>

              {/* Implementation Tools */}
              <Tabs.Content value='implementation'>
                <VStack gap={4} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={2}>
                      Implementation Tools
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Create actionable plans to bring your IdeaSeeds to
                      reality.
                    </Text>
                    {!selectedIdeaSeed && (
                      <Box
                        p={3}
                        bg='orange.50'
                        borderRadius='md'
                        border='1px solid'
                        borderColor='orange.200'
                      >
                        <Text fontSize='sm' color='orange.700'>
                          Select an IdeaSeed from the Generation tab to use
                          these tools.
                        </Text>
                      </Box>
                    )}
                  </Box>

                  <Grid
                    templateColumns='repeat(auto-fit, minmax(350px, 1fr))'
                    gap={4}
                  >
                    {getToolsByCategory('implementation').map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </Grid>
                </VStack>
              </Tabs.Content>
            </Tabs.Root>
          </Card.Body>
        </Card.Root>

        {/* Quick Actions */}
        <Card.Root opacity={!labGoalsCompleted ? 0.6 : 1}>
          <Card.Body p={6}>
            <Heading as='h3' size='md' mb={4}>
              Quick Actions
            </Heading>
            <HStack gap={4} wrap='wrap'>
              <Button
                size='sm'
                variant='outline'
                colorScheme='gray'
                disabled={!labGoalsCompleted}
              >
                <FiRefreshCw size={14} />
                Refresh Data
              </Button>
              <Button
                size='sm'
                variant='outline'
                colorScheme='gray'
                disabled={!labGoalsCompleted}
              >
                <FiDownload size={14} />
                Export All Results
              </Button>
              <Button
                size='sm'
                variant='outline'
                colorScheme='gray'
                disabled={!labGoalsCompleted}
              >
                <FiShare size={14} />
                Share Lab Innovations
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default Invent;
