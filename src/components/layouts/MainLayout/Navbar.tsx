import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Button,
  Avatar,
  IconButton,
  Text,
  Menu,
  Portal,
  Spinner,
} from '@chakra-ui/react';
import {
  LuSun,
  LuMoon,
  LuChevronDown,
  LuTriangleAlert,
  LuUser,
  LuSettings,
  LuLogOut,
  LuUsers,
  LuUserCog,
  LuRefreshCw,
  LuPlus,
} from 'react-icons/lu';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { labService, type Lab } from '../../../services/labService';
// import FastIcon from '../../../assets/fast_icon.svg';
import AnimatedHypercube from '../../shared/AnimatedHypercube';
import WhiteboardIcon from '../../../assets/whiteboard.svg';
import LabsIcon from '../../../assets/labs.svg';
import SearchField from './SearchField';
import WorkspaceManageDialog from './WorkspaceManageDialog';

// TeamSelector Component - Updated to use relationship data
interface TeamSelectorProps {
  isCompact: boolean;
  navigate: (path: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ isCompact, navigate }) => {
  const { userRelationships, currentTeam, setCurrentTeam, isTeamAdmin } =
    useAuth();

  if (!userRelationships || !currentTeam) {
    return null;
  }

  // Filter out the current team from the switch options
  const otherTeams = userRelationships.teams.filter(
    (team) => team._id !== currentTeam._id
  );
  const teamFontSize = isCompact ? '16px' : '24px';

  // Check if user is team admin for current team
  const isCurrentTeamAdmin = isTeamAdmin(currentTeam.uniqueID);

  // Handle team switching with smart navigation
  const handleTeamChange = (newTeam: typeof currentTeam) => {
    setCurrentTeam(newTeam);

    // Check current URL to determine if we should navigate to the same page type for the new team
    const currentPath = window.location.pathname;

    if (currentPath.includes('/team/') && currentPath.includes('/manage')) {
      // User is on team manage page, navigate to manage page for new team
      navigate(`/team/${newTeam.uniqueID}/manage`);
    } else if (currentPath.includes('/team/')) {
      // User is on team view page, navigate to view page for new team
      navigate(`/team/${newTeam.uniqueID}`);
    }
    // Otherwise, stay on current page (home, lab, etc.)
  };

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          variant='outline'
          size='sm'
          borderColor='border.emphasized'
          borderWidth='1px'
          color='fg'
          bg='bg.canvas'
          fontFamily='body'
          fontSize={teamFontSize}
          flexShrink={0}
          py={isCompact ? '4px' : '8px'}
          px={isCompact ? '4px' : '16px'}
          _hover={{
            bg: 'bg.hover',
          }}
          display='flex'
          alignItems='center'
          gap={2}
          height='100%'
        >
          {isCompact ? (
            <VStack gap={1} align='flex-start'>
              <Text fontSize='13px' fontFamily='body' color='fg.secondary'>
                team:
              </Text>
              <HStack gap={2} align='center'>
                <Text fontSize={teamFontSize} fontFamily='body' color='fg'>
                  {currentTeam.ent_name}
                </Text>
                <LuChevronDown size={16} />
              </HStack>
            </VStack>
          ) : (
            <HStack gap={2} align='center'>
              <Text fontSize='24px' fontFamily='body' color='fg.secondary'>
                team:
              </Text>
              <Text fontSize={teamFontSize} fontFamily='body' color='fg'>
                {currentTeam.ent_name}
              </Text>
              <LuChevronDown size={16} />
            </HStack>
          )}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg='bg.canvas'
            borderColor='border.emphasized'
            borderWidth='1px'
            borderRadius='8px'
            minW='280px'
          >
            {/* Admin Controls Section */}
            <Box p={3}>
              {isCurrentTeamAdmin ? (
                <HStack gap={2} align='stretch'>
                  {/* View Team Button */}
                  <Button
                    onClick={() => navigate(`/team/${currentTeam.uniqueID}`)}
                    flex='1'
                    size='sm'
                    bg='#0005E9'
                    color='white'
                    borderWidth='1px'
                    borderColor={{
                      _light: '#111111',
                      _dark: '#FFFFFF',
                    }}
                    _hover={{
                      bg: '#000383',
                      borderColor: {
                        _light: '#111111',
                        _dark: '#FFFFFF',
                      },
                    }}
                    _active={{
                      bg: '#000266',
                    }}
                    fontFamily='body'
                  >
                    <LuUsers size={16} />
                    View Team
                  </Button>

                  {/* Manage Button - only show for team admins */}
                  <Button
                    onClick={() =>
                      navigate(`/team/${currentTeam.uniqueID}/manage`)
                    }
                    flex='1'
                    size='sm'
                    bg='secondary'
                    color='white'
                    _hover={{
                      bg: 'secondary.hover',
                    }}
                    fontFamily='body'
                  >
                    <LuSettings size={16} />
                    Manage
                  </Button>
                </HStack>
              ) : (
                // Single View Team Button for non-admin users
                <Button
                  onClick={() => navigate(`/team/${currentTeam.uniqueID}`)}
                  width='100%'
                  size='sm'
                  bg='#0005E9'
                  color='white'
                  borderWidth='1px'
                  borderColor={{
                    _light: '#111111',
                    _dark: '#FFFFFF',
                  }}
                  _hover={{
                    bg: '#000383',
                    borderColor: {
                      _light: '#111111',
                      _dark: '#FFFFFF',
                    },
                  }}
                  _active={{
                    bg: '#000266',
                  }}
                  fontFamily='body'
                >
                  <LuUsers size={16} />
                  View Team
                </Button>
              )}
            </Box>

            {/* Switch Teams Section - only show if there are other teams */}
            {otherTeams.length > 0 && (
              <>
                <Menu.Separator borderColor='border.muted' />

                <Menu.ItemGroup>
                  <Box textAlign='center' py={2}>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg.muted'
                      fontFamily='body'
                    >
                      switch to:
                    </Text>
                  </Box>
                </Menu.ItemGroup>

                {otherTeams.map((team) => (
                  <Menu.Item
                    key={team._id}
                    value={team._id}
                    onClick={() => handleTeamChange(team)}
                    color='fg'
                    fontFamily='body'
                    fontSize='sm'
                    _hover={{
                      bg: 'bg.hover',
                    }}
                  >
                    {team.ent_name}
                  </Menu.Item>
                ))}
              </>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

const Navbar: React.FC = () => {
  const { isDark, toggleColorMode } = useTheme();
  const { user, logout, currentTeam, token, isOrgAdmin } = useAuth();
  const navigate = useNavigate();

  // State for labs management
  const [teamLabs, setTeamLabs] = useState<Lab[]>([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [isWorkspaceManageOpen, setIsWorkspaceManageOpen] = useState(false);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  // Fetch labs when current team changes - UPDATED to use new lab API
  useEffect(() => {
    const fetchTeamLabs = async () => {
      if (!currentTeam || !token) {
        setTeamLabs([]);
        return;
      }

      try {
        setIsLoadingLabs(true);

        // Fetch lab data using the new lab service
        const labs = await labService.getLabsForTeam(
          currentTeam.uniqueID,
          token,
          false // don't include archived labs
        );

        setTeamLabs(labs);
      } catch (error) {
        console.error('Failed to fetch team labs:', error);
        // Set empty array on error
        setTeamLabs([]);
      } finally {
        setIsLoadingLabs(false);
      }
    };

    fetchTeamLabs();
  }, [currentTeam, token]);

  const handleLabSelect = (labUniqueId: string) => {
    navigate(`/lab/${labUniqueId}`);
  };

  const refreshLabsList = async () => {
    if (!currentTeam || !token) return;

    try {
      setIsLoadingLabs(true);

      // Re-fetch labs using the new lab service
      const labs = await labService.getLabsForTeam(
        currentTeam.uniqueID,
        token,
        false
      );

      setTeamLabs(labs);
    } catch (error) {
      console.error('Failed to refresh labs:', error);
    } finally {
      setIsLoadingLabs(false);
    }
  };

  const hasNoTeam = !currentTeam;
  const isCompact = windowWidth <= 1100;
  const navHeight = isCompact ? '58px' : '64px';

  return (
    <>
      <Box
        position='fixed'
        top={0}
        left={0}
        right={0}
        zIndex={1001}
        h={navHeight}
        pt='16px'
      >
        <HStack
          h='full'
          align='center'
          px={4}
          gap={4}
          w='full'
          minH={isCompact ? '58px' : '64px'}
        >
          {/* Left Navigation Items */}
          {/* Logo */}
          <RouterLink
            to='/'
            style={{
              height: '100%',
              width: 'auto',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'block',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <AnimatedHypercube theme={isDark ? 'dark' : 'light'} />
          </RouterLink>

          {/* TASK 1: Reordered navigation items - Team → Labs → My Whiteboard → Profile */}

          {/* Team Selector - MOVED TO FIRST POSITION */}
          {currentTeam ? (
            <TeamSelector isCompact={isCompact} navigate={navigate} />
          ) : (
            // No team button for when there's no current team
            <Button
              variant='outline'
              size='sm'
              borderColor='border.muted'
              borderWidth='1px'
              color='fg.muted'
              bg='bg.canvas'
              fontFamily='body'
              fontSize={isCompact ? '16px' : '24px'}
              flexShrink={0}
              py={isCompact ? '4px' : '8px'}
              px={isCompact ? '4px' : '16px'}
              disabled={true}
              _disabled={{
                opacity: 0.6,
                cursor: 'not-allowed',
                bg: 'transparent',
              }}
              display='flex'
              alignItems='center'
              gap={2}
              height='100%'
            >
              {isCompact ? (
                <VStack gap={1} align='flex-start'>
                  <Text fontSize='13px' fontFamily='body' color='fg.secondary'>
                    team:
                  </Text>
                  <HStack gap={1} align='center'>
                    <Text fontSize='16px' fontFamily='body' color='fg.muted'>
                      [ NONE ]
                    </Text>
                    <Box position='relative'>
                      <LuTriangleAlert size={14} color='#ef4444' />
                    </Box>
                  </HStack>
                </VStack>
              ) : (
                <HStack gap={2} align='center'>
                  <Text fontSize='24px' fontFamily='body' color='fg.secondary'>
                    team:
                  </Text>
                  <HStack gap={2} align='center'>
                    <Text fontSize='24px' fontFamily='body' color='fg.muted'>
                      [ NONE ]
                    </Text>
                    <Box position='relative'>
                      <LuTriangleAlert size={14} color='#ef4444' />
                    </Box>
                  </HStack>
                </HStack>
              )}
            </Button>
          )}

          {/* Labs Button - MOVED TO SECOND POSITION */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button
                variant='outline'
                size='sm'
                height={isCompact ? 'auto' : '64px'}
                borderColor={hasNoTeam ? 'border.muted' : 'border.emphasized'}
                borderWidth='1px'
                color={hasNoTeam ? 'fg.muted' : 'fg'}
                bg='bg.canvas'
                fontFamily='body'
                fontSize='15px'
                flexShrink={0}
                py={isCompact ? '4px' : '8px'}
                px={isCompact ? '4px' : '16px'}
                disabled={hasNoTeam}
                _hover={{
                  bg: hasNoTeam ? 'transparent' : 'bg.hover',
                }}
                _disabled={{
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  bg: 'transparent',
                }}
                display='flex'
                flexDirection='column'
                alignItems='center'
                gap={1}
              >
                <Box
                  height='24px'
                  width='auto'
                  filter={{
                    _dark: 'brightness(0) invert(1)', // White icons in dark mode
                    _light: 'brightness(0)', // Black icons in light mode
                  }}
                  opacity={hasNoTeam ? 0.6 : 1}
                >
                  <img
                    src={LabsIcon}
                    alt='Labs'
                    style={{ height: '100%', width: 'auto' }}
                  />
                </Box>
                <HStack gap={1} align='center'>
                  labs
                  {!hasNoTeam && <LuChevronDown size={16} />}
                </HStack>
              </Button>
            </Menu.Trigger>
            {!hasNoTeam && (
              <Portal>
                <Menu.Positioner>
                  <Menu.Content
                    bg='bg.canvas'
                    borderColor='border.emphasized'
                    borderWidth='1px'
                    borderRadius='8px'
                  >
                    <Menu.ItemGroup>
                      <HStack justify='space-between' px={3} py={2}>
                        <Text
                          fontSize='sm'
                          fontWeight='medium'
                          color='fg.secondary'
                          fontFamily='body'
                        >
                          {`${currentTeam?.ent_name} labs`}
                        </Text>
                        <Button
                          onClick={refreshLabsList}
                          variant='ghost'
                          size='xs'
                          disabled={isLoadingLabs}
                          fontFamily='body'
                        >
                          {isLoadingLabs ? (
                            <Spinner size='xs' />
                          ) : (
                            <LuRefreshCw size={12} />
                          )}
                        </Button>
                      </HStack>
                    </Menu.ItemGroup>

                    {isLoadingLabs ? (
                      <Menu.Item
                        value='loading'
                        color='fg'
                        fontFamily='body'
                        fontSize='sm'
                        disabled
                      >
                        <HStack gap={2}>
                          <Spinner size='xs' />
                          <Text>Loading labs...</Text>
                        </HStack>
                      </Menu.Item>
                    ) : teamLabs.length > 0 ? (
                      <>
                        {teamLabs.map((lab) => (
                          <Menu.Item
                            key={lab._id}
                            value={lab._id}
                            onClick={() => handleLabSelect(lab.uniqueID)}
                            color='fg'
                            fontFamily='body'
                            fontSize='sm'
                            _hover={{
                              bg: 'bg.hover',
                            }}
                          >
                            {lab.ent_name}
                          </Menu.Item>
                        ))}

                        <Menu.Separator borderColor='border.muted' />

                        <Menu.Item
                          value='create-lab'
                          onClick={() => navigate('/lab/create')}
                          color='brand'
                          fontFamily='body'
                          fontSize='sm'
                          _hover={{
                            bg: 'bg.hover',
                          }}
                        >
                          <HStack gap={2}>
                            <LuPlus size={14} />
                            <Text>Create New Lab</Text>
                          </HStack>
                        </Menu.Item>
                      </>
                    ) : (
                      <>
                        <Menu.Item
                          value='no-labs'
                          color='fg.secondary'
                          fontFamily='body'
                          fontSize='sm'
                          disabled
                        >
                          No labs available
                        </Menu.Item>

                        <Menu.Separator borderColor='border.muted' />

                        <Menu.Item
                          value='create-lab'
                          onClick={() => navigate('/lab/create')}
                          color='brand'
                          fontFamily='body'
                          fontSize='sm'
                          _hover={{
                            bg: 'bg.hover',
                          }}
                        >
                          <HStack gap={2}>
                            <LuPlus size={14} />
                            <Text>Create New Lab</Text>
                          </HStack>
                        </Menu.Item>
                      </>
                    )}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            )}
          </Menu.Root>

          {/* TASK 3: My Whiteboard Button - RENAMED and MOVED TO THIRD POSITION */}
          <Button
            onClick={() => navigate('/whiteboard')}
            variant='outline'
            size='sm'
            height={isCompact ? 'auto' : '64px'}
            borderColor='border.emphasized'
            borderWidth='1px'
            color='fg'
            bg='bg.canvas'
            fontFamily='body'
            fontSize='13px'
            flexShrink={0}
            py={isCompact ? '4px' : '8px'}
            px={isCompact ? '4px' : '16px'}
            _hover={{
              bg: 'bg.hover',
            }}
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={1}
          >
            <Box
              height='24px'
              width='auto'
              filter={{
                _dark: 'brightness(0) invert(1)', // White icons in dark mode
                _light: 'brightness(0)', // Black icons in light mode
              }}
            >
              <img
                src={WhiteboardIcon}
                alt='My Whiteboard'
                style={{ height: '100%', width: 'auto' }}
              />
            </Box>
            my whiteboard
          </Button>

          {/* Profile Button - MOVED TO FOURTH POSITION (before separator) */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <Box
                height={isCompact ? '58px' : '64px'}
                width={isCompact ? '58px' : '64px'}
                borderRadius='8px'
                borderWidth='1px'
                borderColor='border.emphasized'
                overflow='hidden'
                cursor='pointer'
                flexShrink={0}
                p={isCompact ? '4px' : '0'}
                bg='bg.canvas'
                _hover={{
                  bg: 'bg.hover',
                }}
              >
                <Avatar.Root
                  size='full'
                  height='100%'
                  width='100%'
                  shape='rounded'
                  variant='solid'
                  bg='bg.canvas'
                  _hover={{
                    bg: 'bg.hover',
                  }}
                >
                  <Avatar.Fallback
                    name={user?.fullname || user?.username || 'User'}
                    color='fg'
                    fontSize='lg'
                    fontFamily='body'
                  />
                  {user?.picture_url && <Avatar.Image src={user.picture_url} />}
                </Avatar.Root>
              </Box>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  bg='bg.canvas'
                  borderColor='border.emphasized'
                  borderWidth='1px'
                  borderRadius='8px'
                >
                  <Menu.ItemGroup>
                    <Menu.ItemGroupLabel color='fg.secondary'>
                      {user?.fullname}
                    </Menu.ItemGroupLabel>
                  </Menu.ItemGroup>

                  {/* Organization Management - only show for organization admin users */}
                  {isOrgAdmin() && (
                    <>
                      <Box p={2}>
                        <Button
                          onClick={() => setIsWorkspaceManageOpen(true)}
                          bg='secondary'
                          color='white'
                          fontFamily='body'
                          fontSize='sm'
                          size='sm'
                          width='100%'
                          _hover={{
                            bg: 'secondary.hover',
                          }}
                          borderRadius='md'
                        >
                          <HStack gap={2} justify='center'>
                            <LuUserCog size={16} />
                            <Text>Workspace Management</Text>
                          </HStack>
                        </Button>
                      </Box>
                      <Menu.Separator borderColor='border.muted' />
                    </>
                  )}

                  <Menu.Item
                    value='profile'
                    onClick={() => navigate(`/profile`)}
                    color='fg'
                    fontFamily='body'
                    fontSize='sm'
                    _hover={{
                      bg: 'bg.hover',
                    }}
                  >
                    <HStack gap={2}>
                      <LuUser size={16} />
                      <Text>My Profile</Text>
                    </HStack>
                  </Menu.Item>

                  <Menu.Separator borderColor='border.muted' />

                  <Menu.Item
                    value='logout'
                    onClick={handleLogout}
                    color='error'
                    fontFamily='body'
                    fontSize='sm'
                    _hover={{
                      bg: 'errorSubtle',
                    }}
                  >
                    <HStack gap={2}>
                      <LuLogOut size={16} />
                      <Text>Logout</Text>
                    </HStack>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>

          {/* TASK 2: Visual Separator - Added between navigation and search */}
          <Box
            height={isCompact ? '40px' : '48px'}
            width='1px'
            bg='border.emphasized'
            flexShrink={0}
          />

          {/* Search Field - Flex grow to take remaining space */}
          <SearchField />

          {/* Right Navigation Items */}
          {/* Color Mode Toggle */}
          <IconButton
            aria-label='Toggle color mode'
            onClick={toggleColorMode}
            variant='outline'
            size='sm'
            height={isCompact ? '58px' : '64px'}
            width={isCompact ? '58px' : '64px'}
            borderColor='border.emphasized'
            borderWidth='1px'
            color='fg'
            bg='bg.canvas'
            flexShrink={0}
            p={isCompact ? '4px' : '0'}
            _hover={{
              bg: 'bg.hover',
            }}
          >
            {isDark ? <LuSun size={40} /> : <LuMoon size={40} />}
          </IconButton>
        </HStack>
      </Box>

      {/* Workspace Management Dialog */}
      <WorkspaceManageDialog
        isOpen={isWorkspaceManageOpen}
        onClose={() => setIsWorkspaceManageOpen(false)}
      />
    </>
  );
};

export default Navbar;
