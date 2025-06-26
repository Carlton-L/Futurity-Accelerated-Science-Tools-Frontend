import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Alert,
} from '@chakra-ui/react';
import { LuMail, LuExternalLink, LuBuilding } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';

const WorkspaceView: React.FC = () => {
  const { workspace } = useAuth();

  const handleContactSupport = () => {
    window.open(
      'mailto:fasthelp@futurity.systems?subject=Workspace Management Request',
      '_blank'
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!workspace) {
    return (
      <Box p={6} maxW='800px' mx='auto'>
        <Alert.Root status='warning'>
          <Alert.Indicator />
          <Alert.Title fontFamily='heading'>No Workspace Data</Alert.Title>
          <Alert.Description fontFamily='body'>
            Unable to load workspace information. Please try refreshing the page
            or contact support.
          </Alert.Description>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <Box p={6} maxW='1200px' mx='auto'>
      <VStack gap={6} align='stretch'>
        {/* Workspace Header */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Body>
            <VStack align='stretch' gap={4}>
              <HStack gap={3} align='center'>
                <LuBuilding size={24} color='var(--chakra-colors-brand)' />
                <Text
                  fontSize='2xl'
                  fontWeight='bold'
                  color='fg'
                  fontFamily='heading'
                >
                  {workspace.name}
                </Text>
              </HStack>

              <VStack align='start' gap={2}>
                <Text color='fg.secondary' fontFamily='body'>
                  Created {formatDate(workspace.created_at)}
                </Text>
                <Text color='fg.secondary' fontFamily='body'>
                  Plan: {workspace.plan}
                </Text>
                <Text color='fg.secondary' fontFamily='body'>
                  Your role: {workspace.user_access_level}
                </Text>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Workspace Members */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Header>
            <Text
              fontSize='lg'
              fontWeight='semibold'
              color='fg'
              fontFamily='heading'
            >
              Workspace Members ({workspace.member_details?.length || 0})
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align='stretch'>
              {workspace.member_details?.map((member) => (
                <HStack
                  key={member.user_id}
                  justify='space-between'
                  p={3}
                  bg='bg.subtle'
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor='border.muted'
                >
                  <VStack align='start' gap={1}>
                    <Text fontWeight='medium' color='fg' fontFamily='body'>
                      {member.user.displayName ||
                        member.user.fullname ||
                        member.user.username}
                    </Text>
                    <Text fontSize='sm' color='fg.secondary' fontFamily='body'>
                      @{member.user.username}
                    </Text>
                  </VStack>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color={member.role === 'owner' ? 'blue.500' : 'purple.500'}
                    fontFamily='body'
                    textTransform='capitalize'
                  >
                    {member.role}
                  </Text>
                </HStack>
              ))}

              {(!workspace.member_details ||
                workspace.member_details.length === 0) && (
                <Box textAlign='center' py={8}>
                  <Text color='fg.secondary' fontFamily='body'>
                    No members found
                  </Text>
                </Box>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Teams */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Header>
            <Text
              fontSize='lg'
              fontWeight='semibold'
              color='fg'
              fontFamily='heading'
            >
              Teams ({workspace.teamspaces_details?.length || 0})
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align='stretch'>
              {workspace.teamspaces_details?.map((team) => (
                <HStack
                  key={team._id}
                  justify='space-between'
                  p={3}
                  bg='bg.subtle'
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor='border.muted'
                >
                  <VStack align='start' gap={1}>
                    <Text fontWeight='medium' color='fg' fontFamily='body'>
                      {team.name}
                    </Text>
                    <Text fontSize='sm' color='fg.secondary' fontFamily='body'>
                      {team.members?.length || 0} members • Created{' '}
                      {formatDate(team.created_at)}
                    </Text>
                  </VStack>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color={
                      team.user_access_level === 'owner'
                        ? 'blue.500'
                        : team.user_access_level === 'admin'
                        ? 'purple.500'
                        : 'gray.500'
                    }
                    fontFamily='body'
                    textTransform='capitalize'
                  >
                    {team.user_access_level}
                  </Text>
                </HStack>
              ))}

              {(!workspace.teamspaces_details ||
                workspace.teamspaces_details.length === 0) && (
                <Box textAlign='center' py={8}>
                  <Text color='fg.secondary' fontFamily='body'>
                    No teams found
                  </Text>
                </Box>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Management Notice */}
        <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
          <Card.Header>
            <Text
              fontSize='lg'
              fontWeight='semibold'
              color='fg'
              fontFamily='heading'
            >
              Workspace Management
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align='stretch'>
              <Text fontFamily='body' lineHeight='1.6'>
                To manage your workspace settings, add new users, or modify
                workspace permissions, please reach out to our FAST support
                team.
              </Text>
              <Text fontFamily='body' lineHeight='1.6' color='fg.secondary'>
                Our team can help you with:
              </Text>
              <VStack align='start' gap={2} pl={4}>
                <Text fontFamily='body' fontSize='sm'>
                  • Adding new users to your workspace
                </Text>
                <Text fontFamily='body' fontSize='sm'>
                  • Modifying user permissions
                </Text>
                <Text fontFamily='body' fontSize='sm'>
                  • Workspace settings and billing
                </Text>
                <Text fontFamily='body' fontSize='sm'>
                  • Creating additional workspaces
                </Text>
              </VStack>

              <HStack justify='flex-start'>
                <Button
                  onClick={handleContactSupport}
                  bg='brand'
                  color='white'
                  fontFamily='body'
                  _hover={{ bg: 'brand.hover' }}
                >
                  <LuMail size={16} />
                  Contact FAST Support
                  <LuExternalLink size={14} />
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default WorkspaceView;
