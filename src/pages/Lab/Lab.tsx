import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Textarea,
  IconButton,
  Dialog,
} from '@chakra-ui/react';
import { FiEdit, FiSave, FiX, FiSettings } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Lab as LabType, LabUpdateRequest } from './types';

const Lab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  // TODO: Replace with actual API call to fetch lab data
  useEffect(() => {
    const fetchLabData = async (): Promise<void> => {
      console.log('Starting to fetch lab data for id:', id); // Debug log
      setLoading(true);

      try {
        // TODO: Replace setTimeout with actual API call
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

        console.log('Creating mock lab data'); // Debug log

        // TODO: Replace mock data with actual API response
        const mockLab: LabType = {
          id: id || 'lab-1',
          name: 'Beyond Luxury',
          description:
            'Fashion, beauty, and luxury occupy the nexus of myriad social and technological innovations. Now all of them are shifting, from extravagance to sustainability, exclusivity to inclusivity, timeless traditions to advanced materials, digital interfaces, and experiential sensations. Beautiful Futures is about finding where they will lead, and leading the way to a more positive and purpose-driven lifestyle.',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-03-10T14:20:00Z',
          ownerId: 'user-1',
          adminIds: ['user-1', 'user-2'], // Mock admin IDs
          memberIds: ['user-1', 'user-2', 'user-3', 'user-4'],
          subjects: [],
          analyses: [],
        };

        console.log('Setting lab data:', mockLab); // Debug log
        setLab(mockLab);
        setEditForm({
          name: mockLab.name,
          description: mockLab.description,
        });
        setLoading(false);
        console.log('Lab data loaded successfully'); // Debug log
      } catch (error) {
        // TODO: Add proper error handling
        console.error('Failed to fetch lab:', error);
        setLoading(false);
      }
    };

    // Always fetch data regardless of id to test
    fetchLabData();
  }, [id]);

  // Check if current user is admin of this lab
  const isLabAdmin = (): boolean => {
    if (!user || !lab) return false;
    return lab.adminIds.includes(user.id);
  };

  // Handle edit mode toggle
  const handleEditToggle = (): void => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditForm({
        name: lab?.name || '',
        description: lab?.description || '',
      });
      setIsEditing(false);
      setIsEditDialogOpen(false);
    } else {
      // Start editing
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

    // TODO: Replace with actual API call to update lab
    const updateRequest: LabUpdateRequest = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
    };

    try {
      // TODO: Replace setTimeout with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // TODO: Replace mock response with actual API response
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
      // TODO: Add proper error handling
      console.error('Failed to update lab:', error);
      setSaving(false);
    }
  };

  // Handle navigation to lab admin settings
  const handleNavigateToSettings = (): void => {
    // TODO: Replace with actual navigation using useNavigate hook
    navigate(`/lab/${id}/admin`);
  };

  // TODO: Add error handling for failed API calls
  if (loading) {
    return (
      <Box p={6}>
        {/* TODO: Replace with proper loading component/skeleton */}
        <Text>Loading lab...</Text>
      </Box>
    );
  }

  if (!lab) {
    return (
      <Box p={6}>
        <Text>Lab not found</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg='gray.50' minHeight='calc(100vh - 64px)'>
      {/* Main Lab Card */}
      <Card.Root maxW='1024px' mb={6}>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            {/* Header with Title and Actions */}
            <Flex justify='space-between' align='flex-start'>
              <VStack gap={2} align='stretch' flex='1' mr={4}>
                <Heading as='h1' size='xl'>
                  {lab.name}
                </Heading>
                <Text color='gray.600' lineHeight='1.6'>
                  {lab.description}
                </Text>
              </VStack>

              <HStack gap={2}>
                <Button
                  size='md'
                  colorScheme='blue'
                  variant='outline'
                  onClick={handleEditToggle}
                >
                  <FiEdit size={16} />
                  Edit Lab
                </Button>

                {/* Lab Settings Button - Only show for admins */}
                {isLabAdmin() && (
                  <IconButton
                    size='md'
                    colorScheme='gray'
                    variant='outline'
                    onClick={handleNavigateToSettings}
                    aria-label='Lab Settings'
                  >
                    <FiSettings size={16} />
                  </IconButton>
                )}
              </HStack>
            </Flex>

            {/* Lab Metadata */}
            <HStack gap={6} pt={2} borderTop='1px solid' borderColor='gray.200'>
              <Text fontSize='sm' color='gray.500'>
                Created: {new Date(lab.createdAt).toLocaleDateString()}
              </Text>
              <Text fontSize='sm' color='gray.500'>
                Last updated: {new Date(lab.updatedAt).toLocaleDateString()}
              </Text>
              <Text fontSize='sm' color='gray.500'>
                Members: {lab.memberIds.length}
              </Text>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Edit Dialog */}
      <Dialog.Root
        open={isEditDialogOpen}
        onOpenChange={({ open }) => setIsEditDialogOpen(open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Edit Lab Details</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton size='sm' variant='ghost'>
                  <FiX />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <Box>
                  <Text fontSize='sm' fontWeight='medium' mb={2}>
                    Lab Name
                  </Text>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder='Enter lab name...'
                  />
                </Box>

                <Box>
                  <Text fontSize='sm' fontWeight='medium' mb={2}>
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
                <Button
                  colorScheme='blue'
                  onClick={handleSave}
                  loading={saving}
                >
                  <FiSave size={16} />
                  Save Changes
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* TODO: Add additional lab content sections */}
      {/* TODO: Add subjects section */}
      {/* TODO: Add analyses section */}
      {/* TODO: Add members section */}
      {/* TODO: Add activity feed */}
    </Box>
  );
};

export default Lab;
