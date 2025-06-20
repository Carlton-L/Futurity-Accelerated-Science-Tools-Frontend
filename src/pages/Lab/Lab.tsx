import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Textarea,
  IconButton,
  Dialog,
  Tabs,
} from '@chakra-ui/react';
import { FiEdit, FiSave, FiX, FiSettings } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePage } from '../../context/PageContext';
import GlassCard from '../../components/shared/GlassCard';
import type { Lab as LabType, LabUpdateRequest } from './types';
import type { LabTab } from '../../context/PageContext/pageTypes';
import Gather from './Gather';
import Analyze from './Analyze';
import Forecast from './Forecast';
import Invent from './Invent';

const Lab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPageContext, clearPageContext } = usePage();

  const [lab, setLab] = useState<LabType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<LabTab>('gather');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  // Memoize the page context to prevent infinite re-renders
  const labPageContext = useMemo(() => {
    if (!lab) return null;

    return {
      pageType: 'lab' as const,
      pageTitle: `Lab: ${lab.name}`,
      lab: {
        id: lab.id,
        name: lab.name,
        title: lab.name,
      },
      currentTab: activeTab,
    };
  }, [lab, activeTab]);

  // Set up page context when lab data is loaded or tab changes
  useEffect(() => {
    if (labPageContext) {
      setPageContext(labPageContext);
    }

    return () => clearPageContext();
  }, [setPageContext, clearPageContext, labPageContext]);

  // TODO: Replace with actual API call to fetch lab data
  useEffect(() => {
    const fetchLabData = async (): Promise<void> => {
      console.log('Starting to fetch lab data for id:', id);
      setLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockLab: LabType = {
          id: id || 'lab-1',
          name: 'Beyond Luxury',
          description:
            'Fashion, beauty, and luxury occupy the nexus of myriad social and technological innovations. Now all of them are shifting, from extravagance to sustainability, exclusivity to inclusivity, timeless traditions to advanced materials, digital interfaces, and experiential sensations. Beautiful Futures is about finding where they will lead, and leading the way to a more positive and purpose-driven lifestyle.',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-03-10T14:20:00Z',
          ownerId: 'user-1',
          adminIds: ['user-1', 'user-2'],
          memberIds: ['user-1', 'user-2', 'user-3', 'user-4'],
          subjects: [],
          analyses: [],
        };

        setLab(mockLab);
        setEditForm({
          name: mockLab.name,
          description: mockLab.description,
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch lab:', error);
        setLoading(false);
      }
    };

    fetchLabData();
  }, [id]);

  // Check if current user is admin of this lab
  const isLabAdmin = (): boolean => {
    if (!user || !lab) return false;
    return lab.adminIds.includes(user._id);
  };

  // Handle edit mode toggle
  const handleEditToggle = (): void => {
    if (isEditing) {
      setEditForm({
        name: lab?.name || '',
        description: lab?.description || '',
      });
      setIsEditing(false);
      setIsEditDialogOpen(false);
    } else {
      setIsEditing(true);
      setIsEditDialogOpen(true);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    field: 'name' | 'description',
    value: string
  ): void => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save changes
  const handleSave = async (): Promise<void> => {
    if (!lab) return;

    setSaving(true);

    const updateRequest: LabUpdateRequest = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
    };

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedLab: LabType = {
        ...lab,
        name: updateRequest.name,
        description: updateRequest.description,
        updatedAt: new Date().toISOString(),
      };

      setLab(updatedLab);
      setIsEditing(false);
      setSaving(false);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update lab:', error);
      setSaving(false);
    }
  };

  // Handle navigation to lab admin settings
  const handleNavigateToSettings = (): void => {
    navigate(`/lab/${id}/admin`);
  };

  // Handle tab change with proper typing
  const handleTabChange = (value: string): void => {
    const validTabs: LabTab[] = ['gather', 'analyze', 'forecast', 'invent'];
    if (validTabs.includes(value as LabTab)) {
      setActiveTab(value as LabTab);
    }
  };

  if (loading) {
    return (
      <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
        <GlassCard variant='glass' p={6}>
          <Text>Loading lab...</Text>
        </GlassCard>
      </Box>
    );
  }

  if (!lab) {
    return (
      <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
        <GlassCard variant='glass' p={6}>
          <Text>Lab not found</Text>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
      {/* Main Lab Card */}
      <GlassCard variant='solid' w='100%' mb={6}>
        <Box p={6}>
          <VStack gap={4} align='stretch'>
            {/* Header with Title and Actions */}
            <Flex justify='space-between' align='flex-start'>
              <VStack gap={2} align='stretch' flex='1' mr={4}>
                <Heading as='h1' size='xl' fontFamily='heading' color='fg'>
                  {lab.name}
                </Heading>
                <Text color='fg.muted' lineHeight='1.6' fontFamily='body'>
                  {lab.description}
                </Text>
              </VStack>

              <HStack gap={2}>
                {/* Edit Lab Button - Only show for admins */}
                {isLabAdmin() && (
                  <Button
                    size='md'
                    variant='outline'
                    onClick={handleEditToggle}
                  >
                    <FiEdit size={16} />
                    Edit Lab
                  </Button>
                )}

                {/* Lab Settings Button - Only show for admins */}
                {isLabAdmin() && (
                  <IconButton
                    size='md'
                    variant='ghost'
                    onClick={handleNavigateToSettings}
                    aria-label='Lab Settings'
                  >
                    <FiSettings size={16} />
                  </IconButton>
                )}
              </HStack>
            </Flex>

            {/* Lab Metadata */}
            <HStack
              gap={6}
              pt={2}
              borderTop='1px solid'
              borderColor='border.muted'
            >
              <Text fontSize='sm' color='fg.subtle' fontFamily='body'>
                Members: {lab.memberIds.length}
              </Text>
              <Text fontSize='sm' color='fg.subtle' fontFamily='body'>
                Subjects: {lab.subjects.length}
              </Text>
              <Text fontSize='sm' color='fg.subtle' fontFamily='body'>
                Analyses: {lab.analyses.length}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </GlassCard>

      {/* Sticky Tab Navigation */}
      <Box position='sticky' top='64px' zIndex='10' mb={6}>
        <GlassCard variant='glass' w='100%'>
          <Box p={4}>
            <Tabs.Root
              value={activeTab}
              onValueChange={(details) => handleTabChange(details.value)}
            >
              <Tabs.List>
                <Tabs.Trigger value='gather'>Gather</Tabs.Trigger>
                <Tabs.Trigger value='analyze'>Analyze</Tabs.Trigger>
                <Tabs.Trigger value='forecast'>Forecast</Tabs.Trigger>
                <Tabs.Trigger value='invent'>Invent</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Box>
        </GlassCard>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 'gather' && <Gather labId={lab.id} />}
        {activeTab === 'analyze' && <Analyze labId={lab.id} />}
        {activeTab === 'forecast' && <Forecast labId={lab.id} />}
        {activeTab === 'invent' && <Invent labId={lab.id} />}
      </Box>

      {/* Edit Dialog */}
      <Dialog.Root
        open={isEditDialogOpen}
        onOpenChange={({ open }) => setIsEditDialogOpen(open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading'>Edit Lab Details</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton size='sm' variant='ghost'>
                  <FiX />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <Box>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    mb={2}
                    fontFamily='heading'
                    color='fg'
                  >
                    Lab Name
                  </Text>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder='Enter lab name...'
                    bg='bg.canvas'
                    borderColor='border'
                    color='fg'
                    _placeholder={{ color: 'fg.subtle' }}
                  />
                </Box>

                <Box>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    mb={2}
                    fontFamily='heading'
                    color='fg'
                  >
                    Lab Description
                  </Text>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder='Enter lab description...'
                    rows={6}
                    resize='vertical'
                    bg='bg.canvas'
                    borderColor='border'
                    color='fg'
                    _placeholder={{ color: 'fg.subtle' }}
                  />
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={3}>
                <Button
                  variant='outline'
                  onClick={handleEditToggle}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button variant='solid' onClick={handleSave} loading={saving}>
                  <FiSave size={16} />
                  Save Changes
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default Lab;
