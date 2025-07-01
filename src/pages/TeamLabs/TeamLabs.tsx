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
  Image,
} from '@chakra-ui/react';
import { LuPlus, LuUsers, LuCalendar } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { labService, type Lab } from '../../services/labService';
// Import the same icon used in the navbar for labs
import LabsIcon from '../../assets/labs.svg';

const TeamLabs: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { token, userRelationships, currentTeam, setCurrentTeam, isTeamAdmin } =
    useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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
      setIsLoading(false);
      return;
    }

    // Update current team if it's different
    if (!currentTeam || currentTeam.uniqueID !== teamId) {
      console.log('Updating current team from TeamLabs:', team.ent_name);
      setCurrentTeam(team);
    }
  }, [teamId, userRelationships, currentTeam, setCurrentTeam]);

  // Effect to load team labs using the new API endpoint
  useEffect(() => {
    const loadTeamLabs = async () => {
      if (!teamId || !token || !userRelationships) {
        setIsLoading(false);
        return;
      }

      // Check if user has access to this team
      const hasAccess = userRelationships.teams.some(
        (team) => team.uniqueID === teamId
      );

      if (!hasAccess) {
        setError('You do not have access to this team');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    loadTeamLabs();
  }, [teamId, token, userRelationships, isAdmin]);

  const handleLabClick = (labId: string) => {
    navigate(`/lab/${labId}`);
  };

  const handleCreateLab = () => {
    navigate('/lab/create');
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

  if (isLoading) {
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
            Loading team labs...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} maxW='800px' mx='auto'>
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
      <Box p={6} maxW='800px' mx='auto'>
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
    <Box p={6} maxW='1200px' mx='auto'>
      <VStack gap={6} align='stretch'>
        {/* Header */}
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
                  {labs.length} lab{labs.length !== 1 ? 's' : ''} in this team
                  {isAdmin && ' (including archived)'}
                </Text>
              </VStack>

              <HStack gap={2}>
                <Button
                  onClick={() => navigate(`/team/${teamId}`)}
                  variant='outline'
                  fontFamily='body'
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

        {/* Labs Grid */}
        {labs.length > 0 ? (
          <Box
            display='grid'
            gridTemplateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {/* Sort labs alphabetically by name */}
            {[...labs]
              .sort((a, b) => a.ent_name.localeCompare(b.ent_name))
              .map((lab) => {
                const statusInfo = getLabStatus(lab.status);
                const summary = lab.ent_summary;
                const subjectCount = lab.subjects?.length || 0;

                return (
                  <Card.Root
                    key={lab._id}
                    bg='bg.canvas'
                    borderColor='border.emphasized'
                    cursor='pointer'
                    _hover={{
                      borderColor: 'brand',
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                    transition='all 0.2s'
                    onClick={() => handleLabClick(lab.uniqueID)}
                  >
                    <Card.Body>
                      <VStack align='stretch' gap={3}>
                        {/* Lab Image Placeholder */}
                        <Box
                          height='120px'
                          bg='bg.subtle'
                          borderRadius='md'
                          display='flex'
                          alignItems='center'
                          justifyContent='center'
                        >
                          <Box
                            height='40px'
                            width='auto'
                            filter={{
                              _dark: 'brightness(0) invert(0.6)', // Dimmed white in dark mode
                              _light: 'brightness(0) saturate(0) opacity(0.6)', // Dimmed black in light mode
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
                              noOfLines={2}
                            >
                              {lab.ent_name}
                            </Text>
                            <Badge colorScheme={statusInfo.color} size='sm'>
                              {statusInfo.label}
                            </Badge>
                          </HStack>

                          {summary && (
                            <Text
                              fontSize='sm'
                              color='fg.secondary'
                              fontFamily='body'
                              noOfLines={3}
                            >
                              {summary}
                            </Text>
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
              })}
          </Box>
        ) : (
          /* Empty State */
          <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
            <Card.Body>
              <VStack gap={4} py={8} textAlign='center'>
                <Box
                  height='64px'
                  width='auto'
                  filter={{
                    _dark: 'brightness(0) invert(0.6)', // Dimmed white in dark mode
                    _light: 'brightness(0) saturate(0) opacity(0.6)', // Dimmed black in light mode
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
        )}
      </VStack>
    </Box>
  );
};

export default TeamLabs;
