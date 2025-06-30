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
import { teamspaceService } from '../../context/AuthContext';
import type { Teamspace } from '../../context/AuthContext';

const TeamView: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { token, workspace } = useAuth();
  const [teamspace, setTeamspace] = useState<Teamspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Check if user can manage this team
  const canManage =
    teamspace &&
    (teamspace.user_access_level === 'owner' ||
      teamspace.user_access_level === 'admin' ||
      workspace?.user_access_level === 'owner' ||
      workspace?.user_access_level === 'admin');

  useEffect(() => {
    const loadTeamspace = async () => {
      if (!teamId || !token) {
        setError('Missing team ID or authentication');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const teamspaceData = await teamspaceService.getTeamspace(
          teamId,
          token
        );
        setTeamspace(teamspaceData);
      } catch (err) {
        console.error('Failed to load teamspace:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamspace();
  }, [teamId, token]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'blue';
      case 'admin':
        return 'purple';
      case 'viewer':
        return 'gray';
      default:
        return 'gray';
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

  if (!teamspace) {
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
                    {teamspace.name}
                  </Text>
                </HStack>
                <Text color='fg.secondary' fontFamily='body'>
                  Created {formatDate(teamspace.created_at)}
                </Text>
                <Badge
                  colorScheme={getRoleBadgeColor(teamspace.user_access_level)}
                >
                  Your role: {teamspace.user_access_level}
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
              Team Members ({teamspace.member_details?.length || 0})
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align='stretch'>
              {teamspace.member_details?.map((member) => (
                <HStack
                  key={member.user_id}
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
                        name={member.user.fullname || member.user.username}
                      />
                      {member.user.picture_url && (
                        <Avatar.Image src={member.user.picture_url} />
                      )}
                    </Avatar.Root>
                    <VStack align='start' gap={1}>
                      <Text fontWeight='medium' color='fg' fontFamily='body'>
                        {member.user.displayName ||
                          member.user.fullname ||
                          member.user.username}
                      </Text>
                      <Text
                        fontSize='sm'
                        color='fg.secondary'
                        fontFamily='body'
                      >
                        @{member.user.username}
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge colorScheme={getRoleBadgeColor(member.role)}>
                    {member.role}
                  </Badge>
                </HStack>
              ))}

              {(!teamspace.member_details ||
                teamspace.member_details.length === 0) && (
                <Box textAlign='center' py={8}>
                  <Text color='fg.secondary' fontFamily='body'>
                    No members found
                  </Text>
                </Box>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Team Labs - Placeholder for now */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Header>
            <Text
              fontSize='lg'
              fontWeight='semibold'
              color='fg'
              fontFamily='heading'
            >
              Team Labs
            </Text>
          </Card.Header>
          <Card.Body>
            <Box textAlign='center' py={8}>
              <Text color='fg.secondary' fontFamily='body'>
                Lab listing functionality coming soon...
              </Text>
            </Box>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default TeamView;
