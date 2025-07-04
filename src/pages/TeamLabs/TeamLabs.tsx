import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Alert,
  Card,
  Button,
  Badge,
  Skeleton,
  Dialog,
} from '@chakra-ui/react';
import {
  LuPlus,
  LuUsers,
  LuCalendar,
  LuArchive,
  LuUndo2,
  LuTrash2,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { labService, type Lab } from '../../services/labService';
// Import the same icon used in the navbar for labs
import LabsIcon from '../../assets/labs.svg';

// Helper function to validate if a string is a valid URL
const isValidUrl = (string: string): boolean => {
  try {
    // Check if it's just the word "string" or empty
    if (!string || string.trim() === '' || string.toLowerCase() === 'string') {
      return false;
    }
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Skeleton card component for loading state
const LabCardSkeleton: React.FC = () => (
  <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
    <Card.Body>
      <VStack align='stretch' gap={3}>
        <Skeleton height='120px' borderRadius='md' />
        <VStack align='stretch' gap={2}>
          <HStack justify='space-between' align='start'>
            <Skeleton height='24px' width='70%' />
            <Skeleton height='20px' width='60px' />
          </HStack>
          <Skeleton height='16px' width='100%' />
          <Skeleton height='16px' width='80%' />
          <Skeleton height='16px' width='60%' />
          <HStack gap={4} fontSize='xs'>
            <Skeleton height='12px' width='80px' />
            <Skeleton height='12px' width='100px' />
          </HStack>
        </VStack>
      </VStack>
    </Card.Body>
  </Card.Root>
);

const TeamLabs: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { token, userRelationships, currentTeam, setCurrentTeam, isTeamAdmin } =
    useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  // Modal states
  const [archiveDialogOpen, setArchiveDialogOpen] = useState<string | null>(
    null
  );
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState<string | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  // Check if user is admin for this team
  const isAdmin = isTeamAdmin(teamId);

  // Effect to handle team ID changes and sync with current team
  useEffect(() => {
    if (!teamId || !userRelationships) {
      return;
    }

    // Find the team in user's relationships
    const team = userRelationships.teams.find((t) => t.uniqueID === teamId);

    if (!team) {
      setError('Team not found or you do not have access to this team');
      return;
    }

    // Update current team if it's different
    if (!currentTeam || currentTeam.uniqueID !== teamId) {
      console.log('Updating current team from TeamLabs:', team.ent_name);
      setCurrentTeam(team);
    }
  }, [teamId, userRelationships, currentTeam, setCurrentTeam]);

  // Effect to load team labs using the labService
  useEffect(() => {
    const loadTeamLabs = async () => {
      if (!teamId || !token || !userRelationships) {
        setIsLoadingLabs(false);
        return;
      }

      // Check if user has access to this team
      const hasAccess = userRelationships.teams.some(
        (team) => team.uniqueID === teamId
      );

      if (!hasAccess) {
        setError('You do not have access to this team');
        setIsLoadingLabs(false);
        return;
      }

      try {
        setIsLoadingLabs(true);
        setError('');

        // Use the labService to fetch labs for this team
        const teamLabs = await labService.getLabsForTeam(teamId, token, false);

        // Filter labs based on user permissions
        let filteredLabs = teamLabs;
        if (!isAdmin) {
          // Non-admin users only see active labs
          filteredLabs = teamLabs.filter((lab) => lab.status === 'active');
        }

        setLabs(filteredLabs);
        console.log(
          `Loaded ${filteredLabs.length} labs for team (admin: ${isAdmin})`
        );
      } catch (err) {
        console.error('Failed to load team labs:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load team labs'
        );
      } finally {
        setIsLoadingLabs(false);
      }
    };

    loadTeamLabs();
  }, [teamId, token, userRelationships, isAdmin]);

  const handleLabClick = (labId: string, isArchived: boolean) => {
    // Don't navigate if lab is archived
    if (isArchived) {
      return;
    }
    navigate(`/lab/${labId}`);
  };

  const handleCreateLab = () => {
    navigate('/lab/create');
  };

  const handleArchiveLab = async (labId: string) => {
    console.log('Archive lab:', labId);
    // TODO: Implement archive API call
    setArchiveDialogOpen(null);
  };

  const handleUnarchiveLab = async (labId: string) => {
    console.log('Unarchive lab:', labId);
    // TODO: Implement unarchive API call
    setUnarchiveDialogOpen(null);
  };

  const handleDeleteLab = async (labId: string) => {
    console.log('Delete lab:', labId);
    // TODO: Implement delete API call
    setDeleteDialogOpen(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLabStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { color: 'green', label: 'Active' };
      case 'archived':
      case 'inactive':
        return { color: 'gray', label: 'Archived' };
      case 'draft':
        return { color: 'yellow', label: 'Draft' };
      default:
        return { color: 'gray', label: status };
    }
  };

  const toggleDescriptionExpansion = (labId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(labId)) {
      newExpanded.delete(labId);
    } else {
      newExpanded.add(labId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 240) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Show loading spinner only if we don't have basic auth context yet
  if (!userRelationships) {
    return (
      <Box
        minHeight='50vh'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <VStack gap={4}>
          <Spinner size='xl' color='brand' />
          <Text color='fg.secondary' fontFamily='body'>
            Loading...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} maxW='1440px' mx='auto'>
        <Alert.Root status='error'>
          <Alert.Indicator />
          <Alert.Title fontFamily='heading'>Error</Alert.Title>
          <Alert.Description fontFamily='body'>{error}</Alert.Description>
        </Alert.Root>
      </Box>
    );
  }

  if (!currentTeam) {
    return (
      <Box p={6} maxW='1440px' mx='auto'>
        <Alert.Root status='warning'>
          <Alert.Indicator />
          <Alert.Title fontFamily='heading'>Team Not Found</Alert.Title>
          <Alert.Description fontFamily='body'>
            The requested team could not be found.
          </Alert.Description>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <Box p={6} maxW='1440px' mx='auto'>
      <VStack gap={6} align='stretch'>
        {/* Header - loads instantly */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Body>
            <HStack justify='space-between' align='center'>
              <VStack align='start' gap={2}>
                <HStack gap={3} align='center'>
                  <Box
                    height='24px'
                    width='auto'
                    filter={{
                      _dark: 'brightness(0) invert(1)', // White icons in dark mode
                      _light: 'brightness(0)', // Black icons in light mode
                    }}
                  >
                    <img
                      src={LabsIcon}
                      alt='Labs'
                      style={{ height: '100%', width: 'auto' }}
                    />
                  </Box>
                  <Text
                    fontSize='2xl'
                    fontWeight='bold'
                    color='fg'
                    fontFamily='heading'
                  >
                    {currentTeam.ent_name} Labs
                  </Text>
                </HStack>
                <Text color='fg.secondary' fontFamily='body'>
                  {isLoadingLabs
                    ? 'Loading labs...'
                    : `${labs.length} lab${
                        labs.length !== 1 ? 's' : ''
                      } in this team${isAdmin ? ' (including archived)' : ''}`}
                </Text>
              </VStack>

              <HStack gap={2}>
                <Button
                  onClick={() => navigate(`/team/${teamId}`)}
                  variant='outline'
                  fontFamily='body'
                  color='fg'
                  borderColor='border.emphasized'
                  _hover={{
                    bg: 'bg.hover',
                  }}
                >
                  <LuUsers size={16} />
                  View Team
                </Button>
                <Button
                  onClick={handleCreateLab}
                  bg='brand'
                  color='white'
                  fontFamily='body'
                  _hover={{ bg: 'brand.hover' }}
                >
                  <LuPlus size={16} />
                  Create Lab
                </Button>
              </HStack>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Labs Grid with skeleton loading */}
        <Box
          display='grid'
          gridTemplateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {isLoadingLabs ? (
            // Show 4 skeleton cards while loading
            Array.from({ length: 4 }).map((_, index) => (
              <LabCardSkeleton key={index} />
            ))
          ) : labs.length > 0 ? (
            // Show actual lab cards
            [...labs]
              .sort((a, b) => a.ent_name.localeCompare(b.ent_name))
              .map((lab) => {
                const statusInfo = getLabStatus(lab.status);
                const summary = lab.ent_summary;
                const subjectCount = lab.subjects_config?.length || 0;
                const isExpanded = expandedDescriptions.has(lab._id);
                const isArchived = lab.status.toLowerCase() !== 'active';

                // Get picture URL from both possible locations and validate it
                const metadataPictureUrl =
                  lab.picture_url || lab.metadata?.picture_url;
                const validPictureUrl =
                  metadataPictureUrl && isValidUrl(metadataPictureUrl)
                    ? metadataPictureUrl
                    : null;

                return (
                  <Card.Root
                    key={lab._id}
                    bg='bg.canvas'
                    borderColor='border.emphasized'
                    cursor={isArchived ? 'default' : 'pointer'}
                    opacity={isArchived ? 0.6 : 1}
                    _hover={
                      isArchived
                        ? {}
                        : {
                            borderColor: 'brand',
                            transform: 'translateY(-2px)',
                            boxShadow: 'lg',
                          }
                    }
                    transition='all 0.2s'
                    onClick={() => handleLabClick(lab.uniqueID, isArchived)}
                  >
                    <Card.Body>
                      <VStack align='stretch' gap={3}>
                        {/* Lab Image */}
                        <Box
                          height='120px'
                          bg='bg.subtle'
                          borderRadius='md'
                          display='flex'
                          alignItems='center'
                          justifyContent='center'
                          overflow='hidden'
                          position='relative'
                        >
                          {validPictureUrl ? (
                            <img
                              src={validPictureUrl}
                              alt={lab.ent_name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '6px',
                              }}
                              onError={(e) => {
                                // Hide the broken image and show the icon instead
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const iconContainer =
                                    parent.querySelector('.fallback-icon');
                                  if (iconContainer) {
                                    (
                                      iconContainer as HTMLElement
                                    ).style.display = 'flex';
                                  }
                                }
                              }}
                            />
                          ) : null}
                          <Box
                            className='fallback-icon'
                            height='40px'
                            width='auto'
                            display={validPictureUrl ? 'none' : 'flex'}
                            alignItems='center'
                            justifyContent='center'
                            position={validPictureUrl ? 'absolute' : 'static'}
                            top={validPictureUrl ? '50%' : 'auto'}
                            left={validPictureUrl ? '50%' : 'auto'}
                            transform={
                              validPictureUrl ? 'translate(-50%, -50%)' : 'none'
                            }
                            filter={{
                              _dark: 'brightness(0) invert(0.6)',
                              _light: 'brightness(0) saturate(0) opacity(0.6)',
                            }}
                          >
                            <img
                              src={LabsIcon}
                              alt='Lab'
                              style={{ height: '100%', width: 'auto' }}
                            />
                          </Box>
                        </Box>

                        {/* Lab Info */}
                        <VStack align='stretch' gap={2}>
                          <HStack justify='space-between' align='start'>
                            <Text
                              fontSize='lg'
                              fontWeight='semibold'
                              color='fg'
                              fontFamily='heading'
                              css={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {lab.ent_name}
                            </Text>
                            <HStack gap={2} align='center'>
                              <Badge colorScheme={statusInfo.color} size='sm'>
                                {statusInfo.label}
                              </Badge>
                              {isAdmin && !isArchived && (
                                <Button
                                  size='xs'
                                  variant='solid'
                                  bg='red.500'
                                  border='red'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setArchiveDialogOpen(lab._id);
                                  }}
                                  fontFamily='body'
                                  fontSize='12px'
                                >
                                  <LuArchive size={12} />
                                  Archive
                                </Button>
                              )}
                              {isAdmin && isArchived && (
                                <HStack gap={1}>
                                  <Button
                                    size='xs'
                                    bg='brand'
                                    color='white'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUnarchiveDialogOpen(lab._id);
                                    }}
                                    fontFamily='body'
                                    _hover={{ bg: 'brand.hover' }}
                                  >
                                    <LuUndo2 size={12} />
                                    Unarchive
                                  </Button>
                                  <Button
                                    size='xs'
                                    colorScheme='red'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteDialogOpen(lab._id);
                                    }}
                                    fontFamily='body'
                                  >
                                    <LuTrash2 size={12} />
                                    Delete
                                  </Button>
                                </HStack>
                              )}
                            </HStack>
                          </HStack>

                          {summary && (
                            <Box>
                              <Text
                                fontSize='sm'
                                color='fg.secondary'
                                fontFamily='body'
                                lineHeight='1.5'
                              >
                                {isExpanded
                                  ? summary
                                  : truncateText(summary, 240)}
                              </Text>
                              {summary.length > 240 && (
                                <Text
                                  as='span'
                                  fontSize='sm'
                                  color='fg.muted'
                                  fontFamily='body'
                                  textDecoration='underline'
                                  cursor='pointer'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDescriptionExpansion(lab._id);
                                  }}
                                  ml={1}
                                >
                                  {isExpanded ? 'Show less' : 'Show more'}
                                </Text>
                              )}
                            </Box>
                          )}

                          <HStack gap={4} fontSize='xs' color='fg.muted'>
                            <HStack gap={1}>
                              <LuCalendar size={12} />
                              <Text fontFamily='body'>
                                {formatDate(lab.createdAt)}
                              </Text>
                            </HStack>
                            <HStack gap={1}>
                              <LuUsers size={12} />
                              <Text fontFamily='body'>
                                {subjectCount} subjects
                              </Text>
                            </HStack>
                          </HStack>
                        </VStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                );
              })
          ) : (
            /* Empty State */
            <Box gridColumn='1 / -1'>
              <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
                <Card.Body>
                  <VStack gap={4} py={8} textAlign='center'>
                    <Box
                      height='64px'
                      width='auto'
                      filter={{
                        _dark: 'brightness(0) invert(0.6)',
                        _light: 'brightness(0) saturate(0) opacity(0.6)',
                      }}
                    >
                      <img
                        src={LabsIcon}
                        alt='Labs'
                        style={{ height: '100%', width: 'auto' }}
                      />
                    </Box>
                    <VStack gap={2}>
                      <Text
                        fontSize='lg'
                        fontWeight='semibold'
                        color='fg'
                        fontFamily='heading'
                      >
                        No labs yet
                      </Text>
                      <Text color='fg.secondary' fontFamily='body'>
                        Create your first lab to get started with research and
                        analysis.
                      </Text>
                    </VStack>
                    <Button
                      onClick={handleCreateLab}
                      bg='brand'
                      color='white'
                      fontFamily='body'
                      _hover={{ bg: 'brand.hover' }}
                      size='lg'
                    >
                      <LuPlus size={20} />
                      Create Your First Lab
                    </Button>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Box>
          )}
        </Box>
      </VStack>

      {/* Archive Lab Dialog */}
      <Dialog.Root
        open={!!archiveDialogOpen}
        onOpenChange={(e) => !e.open && setArchiveDialogOpen(null)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading'>Archive Lab</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontFamily='body' lineHeight='1.6'>
                Archiving this lab will make it inaccessible to all team
                members. The lab and its data will be preserved, but team
                members will not be able to view or work with it.
              </Text>
              <Text
                fontFamily='body'
                lineHeight='1.6'
                mt={3}
                color='fg.secondary'
              >
                You can unarchive the lab later if needed.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline' fontFamily='body' color='fg'>
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button
                variant='solid'
                border='red'
                bg='red.500'
                onClick={() =>
                  archiveDialogOpen && handleArchiveLab(archiveDialogOpen)
                }
                fontFamily='body'
              >
                <LuArchive size={16} />
                Archive Lab
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Unarchive Lab Dialog */}
      <Dialog.Root
        open={!!unarchiveDialogOpen}
        onOpenChange={(e) => !e.open && setUnarchiveDialogOpen(null)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading'>Unarchive Lab</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontFamily='body' lineHeight='1.6'>
                Are you sure you want to unarchive this lab? This will make it
                accessible to all team members again.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline' fontFamily='body'>
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button
                bg='brand'
                color='white'
                onClick={() =>
                  unarchiveDialogOpen && handleUnarchiveLab(unarchiveDialogOpen)
                }
                fontFamily='body'
                _hover={{ bg: 'brand.hover' }}
              >
                <LuUndo2 size={16} />
                Unarchive Lab
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete Lab Dialog */}
      <Dialog.Root
        open={!!deleteDialogOpen}
        onOpenChange={(e) => !e.open && setDeleteDialogOpen(null)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading'>
                Delete Lab Permanently
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align='start' gap={3}>
                <Text fontFamily='body' lineHeight='1.6' color='error'>
                  <strong>Warning:</strong> This action cannot be undone.
                </Text>
                <Text fontFamily='body' lineHeight='1.6'>
                  Deleting this lab will permanently remove all lab data,
                  including:
                </Text>
                <VStack align='start' gap={1} pl={4}>
                  <Text fontFamily='body' fontSize='sm'>
                    • All analyses and research
                  </Text>
                  <Text fontFamily='body' fontSize='sm'>
                    • Lab configuration and settings
                  </Text>
                  <Text fontFamily='body' fontSize='sm'>
                    • Subject data and relationships
                  </Text>
                  <Text fontFamily='body' fontSize='sm'>
                    • All associated files and documents
                  </Text>
                </VStack>
                <Text fontFamily='body' lineHeight='1.6' mt={2}>
                  This data cannot be recovered once deleted.
                </Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline' fontFamily='body'>
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button
                colorScheme='red'
                onClick={() =>
                  deleteDialogOpen && handleDeleteLab(deleteDialogOpen)
                }
                fontFamily='body'
              >
                <LuTrash2 size={16} />
                Delete Permanently
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default TeamLabs;
