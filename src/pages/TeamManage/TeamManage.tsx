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
  Button,
  Input,
  Dialog,
} from '@chakra-ui/react';
import { LuUsers, LuPlus, LuTrash } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import {
  relationshipService,
  type TeamUsersResponse,
  type RoleAssignmentRequest,
} from '../../services/relationshipService';

const TeamManage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user, token, userRelationships, currentTeam, setCurrentTeam } =
    useAuth();
  const [teamData, setTeamData] = useState<TeamUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Team name editing (placeholder - you may need to implement team name update API)
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');

  // Add member modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<
    'admin' | 'editor' | 'viewer'
  >('viewer');
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);

  // Delete member confirmation
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState<boolean>(false);

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

    // Check if user can manage this team
    if (!team.user_relationships.includes('admin')) {
      navigate(`/team/${teamId}`); // Redirect to view page if no admin access
      return;
    }

    // Update current team if it's different
    if (!currentTeam || currentTeam.uniqueID !== teamId) {
      console.log('Updating current team from TeamManage:', team.ent_name);
      setCurrentTeam(team);
    }

    setNewTeamName(team.ent_name);
  }, [teamId, userRelationships, currentTeam, setCurrentTeam, navigate]);

  // Effect to load team data
  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId || !token || !userRelationships) {
        setIsLoading(false);
        return;
      }

      // Check if user has admin access to this team
      const team = userRelationships.teams.find((t) => t.uniqueID === teamId);
      if (!team || !team.user_relationships.includes('admin')) {
        setError('You do not have permission to manage this team');
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

  const handleAddMember = async () => {
    if (!teamId || !token || !selectedUserEmail || !selectedRole || !user)
      return;

    try {
      setIsAddingMember(true);

      // Note: You'll need to implement a way to get user_id from email
      // This is a placeholder - you may need an additional API endpoint
      const request: RoleAssignmentRequest = {
        user_id: selectedUserEmail, // This should be the actual user ID
        entity_id: teamId,
      };

      // Assign the appropriate role
      if (selectedRole === 'admin') {
        await relationshipService.assignTeamAdmin(request, token);
      } else if (selectedRole === 'editor') {
        await relationshipService.assignTeamEditor(request, token);
      } else {
        await relationshipService.assignTeamViewer(request, token);
      }

      // Refresh team data
      const updatedTeamData = await relationshipService.getTeamUsers(
        teamId,
        token
      );
      setTeamData(updatedTeamData);

      // Reset form and close modal
      setSelectedUserEmail('');
      setSelectedRole('viewer');
      setIsAddMemberOpen(false);
    } catch (err) {
      console.error('Failed to add member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleEditMemberRole = async (
    userId: string,
    newRole: 'admin' | 'editor' | 'viewer'
  ) => {
    if (!teamId || !token) return;

    try {
      const request: RoleAssignmentRequest = {
        user_id: userId,
        entity_id: teamId,
      };

      // Remove existing roles first (you may need to check current roles)
      // Then assign new role
      if (newRole === 'admin') {
        await relationshipService.assignTeamAdmin(request, token);
      } else if (newRole === 'editor') {
        await relationshipService.assignTeamEditor(request, token);
      } else {
        await relationshipService.assignTeamViewer(request, token);
      }

      // Refresh team data
      const updatedTeamData = await relationshipService.getTeamUsers(
        teamId,
        token
      );
      setTeamData(updatedTeamData);
    } catch (err) {
      console.error('Failed to edit member role:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to edit member role'
      );
    }
  };

  const handleDeleteMember = async () => {
    if (!teamId || !token || !deletingMemberId) return;

    try {
      setIsDeletingMember(true);

      const request: RoleAssignmentRequest = {
        user_id: deletingMemberId,
        entity_id: teamId,
      };

      // Remove all roles for this user
      await relationshipService.removeTeamAdmin(request, token);
      await relationshipService.removeTeamEditor(request, token);
      await relationshipService.removeTeamViewer(request, token);

      // Refresh team data
      const updatedTeamData = await relationshipService.getTeamUsers(
        teamId,
        token
      );
      setTeamData(updatedTeamData);

      setDeletingMemberId(null);
    } catch (err) {
      console.error('Failed to delete member:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete member');
    } finally {
      setIsDeletingMember(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
            Loading team management...
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
    <>
      <Box p={6} maxW='1200px' mx='auto'>
        <VStack gap={6} align='stretch'>
          {/* Back button */}
          <Button
            onClick={() => navigate(`/team/${teamId}`)}
            variant='outline'
            alignSelf='flex-start'
            fontFamily='body'
          >
            ← Back to Team View
          </Button>

          {/* Team Header */}
          <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
            <Card.Body>
              <VStack align='stretch' gap={4}>
                <HStack gap={3} align='center'>
                  <LuUsers size={24} color='var(--chakra-colors-brand)' />
                  <Text
                    fontSize='2xl'
                    fontWeight='bold'
                    color='fg'
                    fontFamily='heading'
                  >
                    Manage Team
                  </Text>
                </HStack>

                {/* Team Name Display/Editing */}
                <VStack align='start' gap={2}>
                  <Text fontWeight='medium' color='fg' fontFamily='body'>
                    Team Name
                  </Text>
                  <HStack gap={2}>
                    <Text fontSize='lg' color='fg' fontFamily='body'>
                      {currentTeam.ent_name}
                    </Text>
                    {/* Note: Team name editing would require additional API endpoint */}
                  </HStack>
                </VStack>

                <Text color='fg.secondary' fontFamily='body'>
                  Created {formatDate(currentTeam.createdAt)}
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Team Members Management */}
          <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
            <Card.Header>
              <HStack justify='space-between'>
                <Text
                  fontSize='lg'
                  fontWeight='semibold'
                  color='fg'
                  fontFamily='heading'
                >
                  Team Members ({teamData.total_users})
                </Text>
                <Button
                  onClick={() => setIsAddMemberOpen(true)}
                  bg='brand'
                  color='white'
                  fontFamily='body'
                  _hover={{ bg: 'brand.hover' }}
                >
                  <LuPlus size={16} />
                  Add Member
                </Button>
              </HStack>
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

                    <HStack gap={2}>
                      {/* Role selector */}
                      <select
                        value={getDisplayRole(member.team_relationships)}
                        onChange={(e) =>
                          handleEditMemberRole(
                            member.uniqueID,
                            e.target.value as 'admin' | 'editor' | 'viewer'
                          )
                        }
                        disabled={member.uniqueID === user?._id}
                        style={{
                          width: '120px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border:
                            '1px solid var(--chakra-colors-border-emphasized)',
                          backgroundColor: 'var(--chakra-colors-bg-canvas)',
                          color: 'var(--chakra-colors-fg)',
                          fontSize: '14px',
                          fontFamily: 'var(--chakra-fonts-body)',
                        }}
                      >
                        <option value='admin'>Admin</option>
                        <option value='editor'>Editor</option>
                        <option value='viewer'>Viewer</option>
                      </select>

                      {/* Delete button */}
                      <Button
                        onClick={() => setDeletingMemberId(member.uniqueID)}
                        variant='outline'
                        colorScheme='red'
                        size='sm'
                        disabled={member.uniqueID === user?._id}
                        fontFamily='body'
                      >
                        <LuTrash size={16} />
                      </Button>
                    </HStack>
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
        </VStack>
      </Box>

      {/* Add Member Dialog */}
      <Dialog.Root
        open={isAddMemberOpen}
        onOpenChange={(e) => setIsAddMemberOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading'>Add Team Member</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <VStack align='start' gap={2}>
                  <Text fontWeight='medium' color='fg' fontFamily='body'>
                    User Email
                  </Text>
                  <Input
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    placeholder='Enter user email'
                    fontFamily='body'
                  />
                </VStack>

                <VStack align='start' gap={2}>
                  <Text fontWeight='medium' color='fg' fontFamily='body'>
                    Role
                  </Text>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(
                        e.target.value as 'admin' | 'editor' | 'viewer'
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border:
                        '1px solid var(--chakra-colors-border-emphasized)',
                      backgroundColor: 'var(--chakra-colors-bg-canvas)',
                      color: 'var(--chakra-colors-fg)',
                      fontSize: '14px',
                      fontFamily: 'var(--chakra-fonts-body)',
                    }}
                  >
                    <option value='admin'>Admin</option>
                    <option value='editor'>Editor</option>
                    <option value='viewer'>Viewer</option>
                  </select>
                </VStack>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline' fontFamily='body'>
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button
                onClick={handleAddMember}
                loading={isAddingMember}
                bg='brand'
                color='white'
                fontFamily='body'
                _hover={{ bg: 'brand.hover' }}
                disabled={!selectedUserEmail || !selectedRole}
              >
                Add Member
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete Member Confirmation Dialog */}
      <Dialog.Root
        open={!!deletingMemberId}
        onOpenChange={(e) => !e.open && setDeletingMemberId(null)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading'>
                Remove Team Member
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontFamily='body'>
                Are you sure you want to remove this member from the team? This
                action cannot be undone.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline' fontFamily='body'>
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button
                onClick={handleDeleteMember}
                loading={isDeletingMember}
                colorScheme='red'
                fontFamily='body'
              >
                Remove Member
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

export default TeamManage;
