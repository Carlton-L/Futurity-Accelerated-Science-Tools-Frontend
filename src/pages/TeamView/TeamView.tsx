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
  Avatar,
  Badge,
  Button,
} from '@chakra-ui/react';
import { LuUsers, LuSettings } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import {
  relationshipService,
  type TeamUsersResponse,
} from '../../services/relationshipService';

const TeamView: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { token, userRelationships, currentTeam, setCurrentTeam } = useAuth();
  const [teamData, setTeamData] = useState<TeamUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Check if user can manage this team
  const canManage =
    userRelationships?.teams
      .find((team) => team.uniqueID === teamId)
      ?.user_relationships.includes('admin') || false;

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
      console.log('Updating current team from TeamView:', team.ent_name);
      setCurrentTeam(team);
    }
  }, [teamId, userRelationships, currentTeam, setCurrentTeam]);

  // Effect to load team data
  useEffect(() => {
    const loadTeamData = async () => {
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

        // Fetch team users data
        const teamUsersData = await relationshipService.getTeamUsers(
          teamId,
          token
        );
        setTeamData(teamUsersData);
      } catch (err) {
        console.error('Failed to load team data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, [teamId, token, userRelationships]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeColor = (roles: string[]) => {
    if (roles.includes('admin')) {
      return 'purple';
    } else if (roles.includes('editor')) {
      return 'blue';
    } else if (roles.includes('viewer')) {
      return 'gray';
    }
    return 'gray';
  };

  const getDisplayRole = (roles: string[]) => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('editor')) return 'editor';
    if (roles.includes('viewer')) return 'viewer';
    return 'unknown';
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
            Loading team...
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

  if (!teamData || !currentTeam) {
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
        {/* Team Header */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Body>
            <HStack justify='space-between' align='start'>
              <VStack align='start' gap={2}>
                <HStack gap={3} align='center'>
                  <LuUsers size={24} color='var(--chakra-colors-brand)' />
                  <Text
                    fontSize='2xl'
                    fontWeight='bold'
                    color='fg'
                    fontFamily='heading'
                  >
                    {currentTeam.ent_name}
                  </Text>
                </HStack>
                <Text color='fg.secondary' fontFamily='body'>
                  Created {formatDate(currentTeam.createdAt)}
                </Text>
                <Badge
                  colorScheme={getRoleBadgeColor(
                    currentTeam.user_relationships
                  )}
                >
                  Your role: {getDisplayRole(currentTeam.user_relationships)}
                </Badge>
              </VStack>

              {canManage && (
                <Button
                  onClick={() => navigate(`/team/${teamId}/manage`)}
                  bg='secondary'
                  color='white'
                  fontFamily='body'
                  _hover={{
                    bg: 'secondary.hover',
                  }}
                >
                  <LuSettings size={16} />
                  Manage Team
                </Button>
              )}
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Team Members */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Header>
            <Text
              fontSize='lg'
              fontWeight='semibold'
              color='fg'
              fontFamily='heading'
            >
              Team Members ({teamData.total_users})
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align='stretch'>
              {teamData.users.map((member) => (
                <HStack
                  key={member.uniqueID}
                  justify='space-between'
                  p={3}
                  bg='bg.subtle'
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor='border.muted'
                >
                  <HStack gap={3}>
                    <Avatar.Root size='sm'>
                      <Avatar.Fallback
                        name={member.profile.fullname || member.email}
                      />
                      {member.profile.picture_url && (
                        <Avatar.Image src={member.profile.picture_url} />
                      )}
                    </Avatar.Root>
                    <VStack align='start' gap={1}>
                      <Text fontWeight='medium' color='fg' fontFamily='body'>
                        {member.profile.fullname || member.email}
                      </Text>
                      <Text
                        fontSize='sm'
                        color='fg.secondary'
                        fontFamily='body'
                      >
                        {member.email}
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge
                    colorScheme={getRoleBadgeColor(member.team_relationships)}
                  >
                    {getDisplayRole(member.team_relationships)}
                  </Badge>
                </HStack>
              ))}

              {teamData.users.length === 0 && (
                <Box textAlign='center' py={8}>
                  <Text color='fg.secondary' fontFamily='body'>
                    No members found
                  </Text>
                </Box>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Team Labs - Show a "View Labs" button that navigates to team labs page */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Header>
            <HStack justify='space-between' align='center'>
              <Text
                fontSize='lg'
                fontWeight='semibold'
                color='fg'
                fontFamily='heading'
              >
                Team Labs
              </Text>
              <Button
                onClick={() => navigate(`/team/${teamId}/labs`)}
                bg='brand'
                color='white'
                fontFamily='body'
                _hover={{
                  bg: 'brand.hover',
                }}
              >
                <LuUsers size={16} />
                View All Labs
              </Button>
            </HStack>
          </Card.Header>
          <Card.Body>
            <Box textAlign='center' py={8}>
              <Text color='fg.secondary' fontFamily='body'>
                Click "View All Labs" to see labs for this team
              </Text>
            </Box>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default TeamView;
