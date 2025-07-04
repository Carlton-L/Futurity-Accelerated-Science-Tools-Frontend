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
  Dialog,
} from '@chakra-ui/react';
import { LuUsers, LuPlus, LuTrash, LuCheck } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import {
  relationshipService,
  type TeamUsersResponse,
  type TeamUser,
  type OrganizationUsersResponse,
  type OrganizationUser,
} from '../../services/relationshipService';

const TeamManage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user, token, userRelationships, currentTeam, setCurrentTeam } =
    useAuth();
  const [teamData, setTeamData] = useState<TeamUsersResponse | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Add member modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<Set<string>>(
    new Set()
  );
  const [selectedRole, setSelectedRole] = useState<
    'admin' | 'editor' | 'viewer'
  >('viewer');
  const [isAddingMembers, setIsAddingMembers] = useState<boolean>(false);
  const [isLoadingOrgUsers, setIsLoadingOrgUsers] = useState<boolean>(false);

  // Delete member confirmation
  const [deletingMember, setDeletingMember] = useState<TeamUser | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState<boolean>(false);

  // Role change loading states - track by team member uniqueID
  const [changingRoleUserUniqueId, setChangingRoleUserUniqueId] = useState<
    string | null
  >(null);

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

    // Check if user can manage this team (must be admin)
    if (!team.user_relationships.includes('admin')) {
      console.log('User is not admin for this team, redirecting to team view');
      navigate(`/team/${teamId}`, { replace: true }); // Use replace to prevent back button issues
      return;
    }

    // Update current team if it's different
    if (!currentTeam || currentTeam.uniqueID !== teamId) {
      console.log('Updating current team from TeamManage:', team.ent_name);
      setCurrentTeam(team);
    }
  }, [teamId, userRelationships, currentTeam, setCurrentTeam, navigate]);

  // Effect to load team data
  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId || !token || !userRelationships) {
        setIsLoading(false);
        return;
      }

      // Check if user has admin access to this team (double-check)
      const team = userRelationships.teams.find((t) => t.uniqueID === teamId);
      if (!team || !team.user_relationships.includes('admin')) {
        console.log('User lost admin access or team not found, redirecting');
        navigate(`/team/${teamId}`, { replace: true });
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

  // Load organization users when add member dialog opens
  const loadOrgUsers = async () => {
    if (!userRelationships?.organizations[0]?.uniqueID || !token) return;

    try {
      setIsLoadingOrgUsers(true);
      const orgUsersData = await relationshipService.getOrganizationUsers(
        userRelationships.organizations[0].uniqueID,
        token
      );
      setOrgUsers(orgUsersData.users);
    } catch (err) {
      console.error('Failed to load organization users:', err);
      setError('Failed to load organization users');
    } finally {
      setIsLoadingOrgUsers(false);
    }
  };

  // Check if org user is already in team (compare by uniqueID)
  const isUserInTeam = (orgUser: OrganizationUser): boolean => {
    if (!teamData) return false;
    return teamData.users.some(
      (teamMember) => teamMember.uniqueID === orgUser.uniqueID
    );
  };

  // Check if a team member is the current user (comprehensive comparison)
  const isCurrentUser = (member: TeamUser | OrganizationUser): boolean => {
    if (!user) return false;

    // Method 1: Compare by uniqueID (most reliable)
    if (user.guid && member.uniqueID && user.guid === member.uniqueID) {
      return true;
    }

    // Method 2: Compare by _id (for current user from auth context)
    if (user._id && member._id && user._id === member._id) {
      return true;
    }

    // Method 3: Compare by email (fallback)
    if (user.email && member.email && user.email === member.email) {
      return true;
    }

    // Method 4: Compare by fullname if available and not empty
    if (
      user.fullname &&
      member.profile?.fullname &&
      user.fullname.trim() !== '' &&
      member.profile.fullname.trim() !== '' &&
      user.fullname === member.profile.fullname
    ) {
      return true;
    }

    return false;
  };

  // Get the correct user ID to use for API calls
  const getUserIdForApiCall = (member: TeamUser | OrganizationUser): string => {
    // For the current user, prefer their auth context _id, fallback to uniqueID
    if (isCurrentUser(member)) {
      return user?._id || member.uniqueID;
    }
    // For other users, always use uniqueID (never use _id from relationship endpoints)
    return member.uniqueID;
  };

  // Get available users (not in team) and existing users (in team)
  const getAvailableAndExistingUsers = () => {
    const available: OrganizationUser[] = [];
    const existing: OrganizationUser[] = [];

    orgUsers.forEach((orgUser) => {
      if (isUserInTeam(orgUser)) {
        existing.push(orgUser);
      } else {
        available.push(orgUser);
      }
    });

    return { available, existing };
  };

  const handleAddMemberDialogOpen = () => {
    setIsAddMemberOpen(true);
    setSelectedUsersToAdd(new Set());
    loadOrgUsers();
  };

  const handleUserSelection = (userUniqueId: string, checked: boolean) => {
    const newSelection = new Set(selectedUsersToAdd);
    if (checked) {
      newSelection.add(userUniqueId);
    } else {
      newSelection.delete(userUniqueId);
    }
    setSelectedUsersToAdd(newSelection);
  };

  const handleAddMembers = async () => {
    if (!teamId || !token || selectedUsersToAdd.size === 0) return;

    try {
      setIsAddingMembers(true);
      setError('');

      // Add each selected user to the team
      for (const userUniqueId of selectedUsersToAdd) {
        // Find the org user to determine correct ID to use
        const orgUser = orgUsers.find((u) => u.uniqueID === userUniqueId);
        if (!orgUser) continue;

        const request = {
          user_id: getUserIdForApiCall(orgUser), // Use correct ID based on whether it's current user
          entity_id: teamId,
        };

        // Assign the selected role
        if (selectedRole === 'admin') {
          await relationshipService.assignTeamAdmin(request, token);
        } else if (selectedRole === 'editor') {
          await relationshipService.assignTeamEditor(request, token);
        } else {
          await relationshipService.assignTeamViewer(request, token);
        }
      }

      // Refresh team data
      const updatedTeamData = await relationshipService.getTeamUsers(
        teamId,
        token
      );
      setTeamData(updatedTeamData);

      // Reset form and close modal
      setSelectedUsersToAdd(new Set());
      setSelectedRole('viewer');
      setIsAddMemberOpen(false);
    } catch (err) {
      console.error('Failed to add members:', err);
      setError(err instanceof Error ? err.message : 'Failed to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleEditMemberRole = async (
    member: TeamUser,
    newRole: 'admin' | 'editor' | 'viewer'
  ) => {
    if (!teamId || !token || !user) return;

    // Don't allow users to change their own role
    if (isCurrentUser(member)) {
      setError('You cannot change your own role');
      return;
    }

    try {
      setChangingRoleUserUniqueId(member.uniqueID);
      setError('');

      // Use the correct ID for API call
      await relationshipService.changeTeamUserRole(
        getUserIdForApiCall(member), // Use correct ID based on whether it's current user
        teamId,
        newRole,
        member.team_relationships,
        token
      );

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
    } finally {
      setChangingRoleUserUniqueId(null);
    }
  };

  const handleDeleteMember = async () => {
    if (!teamId || !token || !deletingMember || !user) return;

    // Don't allow users to remove themselves
    if (isCurrentUser(deletingMember)) {
      setError('You cannot remove yourself from the team');
      setDeletingMember(null);
      return;
    }

    try {
      setIsDeletingMember(true);
      setError('');

      // Use the correct ID for API call
      await relationshipService.removeAllTeamRoles(
        getUserIdForApiCall(deletingMember), // Use correct ID based on whether it's current user
        teamId,
        token
      );

      // Refresh team data
      const updatedTeamData = await relationshipService.getTeamUsers(
        teamId,
        token
      );
      setTeamData(updatedTeamData);

      setDeletingMember(null);
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

  const { available: availableUsers, existing: existingUsers } =
    getAvailableAndExistingUsers();

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

                {/* Team Name Display */}
                <VStack align='start' gap={2}>
                  <Text fontWeight='medium' color='fg' fontFamily='body'>
                    Team Name
                  </Text>
                  <Text fontSize='lg' color='fg' fontFamily='body'>
                    {currentTeam.ent_name}
                  </Text>
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
                  onClick={handleAddMemberDialogOpen}
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
                {teamData.users.map((member) => {
                  const isCurrentUserMember = isCurrentUser(member);
                  const isChangingRole =
                    changingRoleUserUniqueId === member.uniqueID;

                  return (
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
                          <Text
                            fontWeight='medium'
                            color='fg'
                            fontFamily='body'
                          >
                            {member.profile.fullname || member.email}
                            {isCurrentUserMember && ' (You)'}
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
                        {/* Role selector with loading state */}
                        <Box position='relative'>
                          <select
                            value={getDisplayRole(member.team_relationships)}
                            onChange={(e) =>
                              handleEditMemberRole(
                                member,
                                e.target.value as 'admin' | 'editor' | 'viewer'
                              )
                            }
                            disabled={isCurrentUserMember || isChangingRole}
                            style={{
                              width: '120px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border:
                                '1px solid var(--chakra-colors-border-emphasized)',
                              backgroundColor: 'var(--chakra-colors-bg-canvas)',
                              color: isCurrentUserMember
                                ? 'var(--chakra-colors-fg-muted)'
                                : 'var(--chakra-colors-fg)',
                              fontSize: '14px',
                              fontFamily: 'var(--chakra-fonts-body)',
                              opacity: isChangingRole
                                ? 0.5
                                : isCurrentUserMember
                                ? 0.6
                                : 1,
                              cursor: isCurrentUserMember
                                ? 'not-allowed'
                                : 'pointer',
                            }}
                          >
                            <option value='admin'>Admin</option>
                            <option value='editor'>Editor</option>
                            <option value='viewer'>Viewer</option>
                          </select>
                          {isChangingRole && (
                            <Box
                              position='absolute'
                              top='50%'
                              right='8px'
                              transform='translateY(-50%)'
                              pointerEvents='none'
                            >
                              <Spinner size='sm' color='brand' />
                            </Box>
                          )}
                        </Box>

                        {/* Delete button */}
                        <Button
                          onClick={() => setDeletingMember(member)}
                          variant='outline'
                          colorScheme='red'
                          size='sm'
                          disabled={isCurrentUserMember}
                          fontFamily='body'
                        >
                          <LuTrash size={16} />
                        </Button>
                      </HStack>
                    </HStack>
                  );
                })}

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
          <Dialog.Content maxW='lg'>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading'>Add Team Members</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                {/* Role selector */}
                <VStack align='start' gap={2}>
                  <Text fontWeight='medium' color='fg' fontFamily='body'>
                    Role for selected members
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

                {/* Loading state */}
                {isLoadingOrgUsers && (
                  <Box textAlign='center' py={4}>
                    <Spinner size='md' color='brand' />
                    <Text mt={2} color='fg.secondary' fontFamily='body'>
                      Loading organization members...
                    </Text>
                  </Box>
                )}

                {/* Available users */}
                {!isLoadingOrgUsers && availableUsers.length > 0 && (
                  <VStack align='start' gap={2}>
                    <Text fontWeight='medium' color='fg' fontFamily='body'>
                      Select members to add
                    </Text>
                    <VStack
                      gap={2}
                      align='stretch'
                      maxH='300px'
                      overflowY='auto'
                    >
                      {availableUsers.map((orgUser) => {
                        const isSelected = selectedUsersToAdd.has(
                          orgUser.uniqueID
                        );
                        console.log(
                          `User ${orgUser.email} - Selected:`,
                          isSelected,
                          'UniqueID:',
                          orgUser.uniqueID,
                          'Selected Set:',
                          Array.from(selectedUsersToAdd)
                        );
                        return (
                          <HStack key={orgUser.uniqueID} gap={3} align='center'>
                            {/* External checkbox */}

                            {/* User card */}
                            <Box
                              w='5'
                              h='5'
                              minW='5'
                              flexShrink={0}
                              borderRadius='sm'
                              border='2px solid'
                              borderColor={isSelected ? 'brand' : 'fg'}
                              bg={isSelected ? 'brand' : 'canvas'}
                              display='flex'
                              alignItems='center'
                              justifyContent='center'
                              onClick={() =>
                                handleUserSelection(
                                  orgUser.uniqueID,
                                  !isSelected
                                )
                              }
                              _hover={{
                                borderColor: 'fg.hover',
                                bg: isSelected ? 'brand.hover' : 'bg.hover',
                              }}
                            >
                              {isSelected ? (
                                <LuCheck size={12} style={{ color: 'white' }} />
                              ) : (
                                <Text fontSize='xs' color='fg.muted'>
                                  -
                                </Text>
                              )}
                            </Box>

                            {/* User card */}
                            <Box
                              flex='1'
                              p={3}
                              bg='bg.canvas'
                              borderRadius='md'
                              borderWidth='1px'
                              borderColor={
                                isSelected ? 'brand' : 'border.emphasized'
                              }
                              cursor='pointer'
                              onClick={() =>
                                handleUserSelection(
                                  orgUser.uniqueID,
                                  !isSelected
                                )
                              }
                              _hover={{
                                borderColor: 'brand',
                              }}
                              transition='all 0.2s'
                            >
                              <HStack gap={3}>
                                <Avatar.Root size='sm'>
                                  <Avatar.Fallback
                                    name={
                                      orgUser.profile.fullname || orgUser.email
                                    }
                                  />
                                  {orgUser.profile.picture_url && (
                                    <Avatar.Image
                                      src={orgUser.profile.picture_url}
                                    />
                                  )}
                                </Avatar.Root>
                                <VStack align='start' gap={0}>
                                  <Text
                                    fontWeight='medium'
                                    color='fg'
                                    fontFamily='body'
                                  >
                                    {orgUser.profile.fullname || orgUser.email}
                                    {isCurrentUser(orgUser) && ' (You)'}
                                  </Text>
                                  <Text
                                    fontSize='sm'
                                    color='fg.secondary'
                                    fontFamily='body'
                                  >
                                    {orgUser.email}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Box>
                          </HStack>
                        );
                      })}
                    </VStack>
                  </VStack>
                )}

                {/* Existing users */}
                {!isLoadingOrgUsers && existingUsers.length > 0 && (
                  <VStack align='start' gap={2}>
                    <Text
                      fontWeight='medium'
                      color='fg.muted'
                      fontFamily='body'
                    >
                      Already in team
                    </Text>
                    <VStack
                      gap={2}
                      align='stretch'
                      maxH='200px'
                      overflowY='auto'
                    >
                      {existingUsers.map((orgUser) => (
                        <HStack key={orgUser.uniqueID} gap={3} align='center'>
                          {/* Disabled external checkbox */}
                          <Box
                            w='5'
                            h='5'
                            minW='5'
                            flexShrink={0}
                            borderRadius='sm'
                            border='2px solid'
                            borderColor='brand'
                            bg='brand'
                            display='flex'
                            alignItems='center'
                            justifyContent='center'
                            opacity={0.6}
                          >
                            <LuCheck size={12} color='white' />
                          </Box>

                          {/* User card */}
                          <Box
                            flex='1'
                            p={3}
                            bg='bg.muted'
                            borderRadius='md'
                            borderWidth='1px'
                            borderColor='border.muted'
                            opacity={0.6}
                          >
                            <HStack gap={3}>
                              <Avatar.Root size='sm'>
                                <Avatar.Fallback
                                  name={
                                    orgUser.profile.fullname || orgUser.email
                                  }
                                />
                                {orgUser.profile.picture_url && (
                                  <Avatar.Image
                                    src={orgUser.profile.picture_url}
                                  />
                                )}
                              </Avatar.Root>
                              <VStack align='start' gap={0}>
                                <Text
                                  fontWeight='medium'
                                  color='fg.muted'
                                  fontFamily='body'
                                >
                                  {orgUser.profile.fullname || orgUser.email}
                                  {isCurrentUser(orgUser) && ' (You)'}
                                </Text>
                                <Text
                                  fontSize='sm'
                                  color='fg.muted'
                                  fontFamily='body'
                                >
                                  {orgUser.email}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                )}

                {/* No users available */}
                {!isLoadingOrgUsers && availableUsers.length === 0 && (
                  <Box textAlign='center' py={4}>
                    <Text color='fg.secondary' fontFamily='body'>
                      All organization members are already in this team.
                    </Text>
                  </Box>
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline' fontFamily='body'>
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button
                onClick={handleAddMembers}
                loading={isAddingMembers}
                bg='brand'
                color='white'
                fontFamily='body'
                _hover={{ bg: 'brand.hover' }}
                disabled={selectedUsersToAdd.size === 0}
              >
                Add {selectedUsersToAdd.size} Member
                {selectedUsersToAdd.size !== 1 ? 's' : ''}
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
                Are you sure you want to remove{' '}
                {deletingMember?.profile.fullname || deletingMember?.email} from
                the team? This action cannot be undone.
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
