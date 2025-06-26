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
import { LuUsers, LuPlus, LuPencil, LuTrash, LuSave } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { teamspaceService } from '../../context/AuthContext';
import type { Teamspace } from '../../context/AuthContext';

const TeamManage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user, token, workspace, refreshWorkspace } = useAuth();
  const [teamspace, setTeamspace] = useState<Teamspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Team name editing
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);

  // Add member modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'viewer'>(
    'viewer'
  );
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);

  // Delete member confirmation
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState<boolean>(false);

  // Check if user can manage this team
  const canManage =
    teamspace &&
    (teamspace.user_access_level === 'owner' ||
      teamspace.user_access_level === 'admin' ||
      workspace?.user_access_level === 'owner' ||
      workspace?.user_access_level === 'admin');

  // Get available workspace members to add (excluding current team members)
  const availableMembers =
    workspace?.member_details?.filter(
      (workspaceMember) =>
        !teamspace?.member_details?.some(
          (teamMember) => teamMember.user_id === workspaceMember.user_id
        )
    ) || [];

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
        setNewTeamName(teamspaceData.name);
      } catch (err) {
        console.error('Failed to load teamspace:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamspace();
  }, [teamId, token]);

  // Redirect if user doesn't have management permissions
  useEffect(() => {
    if (!isLoading && teamspace && !canManage) {
      navigate(`/team/${teamId}`);
    }
  }, [isLoading, teamspace, canManage, navigate, teamId]);

  const handleSaveTeamName = async () => {
    if (!teamId || !token || !newTeamName.trim()) return;

    try {
      setIsSavingName(true);
      await teamspaceService.updateTeamspace(
        teamId,
        { name: newTeamName.trim() },
        token
      );

      // Refresh teamspace data
      const updatedTeamspace = await teamspaceService.getTeamspace(
        teamId,
        token
      );
      setTeamspace(updatedTeamspace);
      setIsEditingName(false);

      // Refresh workspace to update teamspace list
      await refreshWorkspace();
    } catch (err) {
      console.error('Failed to update team name:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update team name'
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAddMember = async () => {
    if (!teamId || !token || !selectedUsername || !selectedRole) return;

    try {
      setIsAddingMember(true);
      await teamspaceService.addMember(
        teamId,
        {
          username: selectedUsername,
          role: selectedRole,
        },
        token
      );

      // Refresh teamspace data
      const updatedTeamspace = await teamspaceService.getTeamspace(
        teamId,
        token
      );
      setTeamspace(updatedTeamspace);

      // Reset form and close modal
      setSelectedUsername('');
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
    newRole: 'owner' | 'admin' | 'viewer'
  ) => {
    if (!teamId || !token) return;

    try {
      await teamspaceService.editMember(
        teamId,
        userId,
        { role: newRole },
        token
      );

      // Refresh teamspace data
      const updatedTeamspace = await teamspaceService.getTeamspace(
        teamId,
        token
      );
      setTeamspace(updatedTeamspace);
    } catch (err) {
      console.error('Failed to edit member role:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to edit member role'
      );
    }
  };

  const handleDeleteMember = async () => {
    if (!teamId || !token || !deletingMember) return;

    try {
      setIsDeletingMember(true);
      await teamspaceService.deleteMember(teamId, deletingMember, token);

      // Refresh teamspace data
      const updatedTeamspace = await teamspaceService.getTeamspace(
        teamId,
        token
      );
      setTeamspace(updatedTeamspace);

      setDeletingMember(null);
    } catch (err) {
      console.error('Failed to delete member:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete member');
    } finally {
      setIsDeletingMember(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
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

                {/* Team Name Editing */}
                <VStack align='start' gap={2}>
                  <Text fontWeight='medium' color='fg' fontFamily='body'>
                    Team Name
                  </Text>
                  {isEditingName ? (
                    <HStack gap={2} width='100%'>
                      <Input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder='Enter team name'
                        fontFamily='body'
                        maxW='400px'
                      />
                      <Button
                        onClick={handleSaveTeamName}
                        loading={isSavingName}
                        bg='brand'
                        color='white'
                        fontFamily='body'
                        _hover={{ bg: 'brand.hover' }}
                      >
                        <LuSave size={16} />
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingName(false);
                          setNewTeamName(teamspace.name);
                        }}
                        variant='outline'
                        fontFamily='body'
                      >
                        Cancel
                      </Button>
                    </HStack>
                  ) : (
                    <HStack gap={2}>
                      <Text fontSize='lg' color='fg' fontFamily='body'>
                        {teamspace.name}
                      </Text>
                      <Button
                        onClick={() => setIsEditingName(true)}
                        variant='outline'
                        size='sm'
                        fontFamily='body'
                      >
                        <LuPencil size={16} />
                        Edit
                      </Button>
                    </HStack>
                  )}
                </VStack>

                <Text color='fg.secondary' fontFamily='body'>
                  Created {formatDate(teamspace.created_at)}
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
                  Team Members ({teamspace.member_details?.length || 0})
                </Text>
                <Button
                  onClick={() => setIsAddMemberOpen(true)}
                  bg='brand'
                  color='white'
                  fontFamily='body'
                  _hover={{ bg: 'brand.hover' }}
                  disabled={availableMembers.length === 0}
                >
                  <LuPlus size={16} />
                  Add Member
                </Button>
              </HStack>
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

                    <HStack gap={2}>
                      {/* Role selector - disable for owners and current user */}
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleEditMemberRole(
                            member.user_id,
                            e.target.value as 'owner' | 'admin' | 'viewer'
                          )
                        }
                        disabled={
                          member.role === 'owner' ||
                          member.user_id === user?._id
                        }
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
                        <option value='viewer'>Viewer</option>
                      </select>

                      {/* Delete button - disable for owners and current user */}
                      <Button
                        onClick={() => setDeletingMember(member.user_id)}
                        variant='outline'
                        colorScheme='red'
                        size='sm'
                        disabled={
                          member.role === 'owner' ||
                          member.user_id === user?._id
                        }
                        fontFamily='body'
                      >
                        <LuTrash size={16} />
                      </Button>
                    </HStack>
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
                    Select Member
                  </Text>
                  <select
                    value={selectedUsername}
                    onChange={(e) => setSelectedUsername(e.target.value)}
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
                    <option value=''>Choose a workspace member</option>
                    {availableMembers.map((member) => (
                      <option key={member.user_id} value={member.user.username}>
                        {member.user.displayName ||
                          member.user.fullname ||
                          member.user.username}{' '}
                        (@{member.user.username})
                      </option>
                    ))}
                  </select>
                </VStack>

                <VStack align='start' gap={2}>
                  <Text fontWeight='medium' color='fg' fontFamily='body'>
                    Role
                  </Text>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as 'admin' | 'viewer')
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
                disabled={!selectedUsername || !selectedRole}
              >
                Add Member
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete Member Confirmation Dialog */}
      <Dialog.Root
        open={!!deletingMember}
        onOpenChange={(e) => !e.open && setDeletingMember(null)}
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
