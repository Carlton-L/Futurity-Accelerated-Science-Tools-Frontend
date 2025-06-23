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
} from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import FastIcon from '../../../assets/fast_icon.svg';
import WhiteboardIcon from '../../../assets/whiteboard.svg';
import LabsIcon from '../../../assets/labs.svg';
import SearchField from './SearchField';

// Types for team and lab data
interface Team {
  id: string;
  name: string;
}

interface Lab {
  id: string;
  name: string;
  slug: string;
  teamId: string;
}

// TODO: Remove all mock data below when real API endpoints are available
// Mock team data - will be replaced with API call
const mockTeams: Team[] = [
  { id: '1', name: 'Demo Research Team' },
  { id: '2', name: 'Innovation Lab' },
  { id: '3', name: 'Product Development' },
];

// Mock labs data - will be replaced with API call
const mockLabs: Lab[] = [
  { id: '1', name: 'Demo Lab 1', slug: 'demo-lab-1', teamId: '1' },
  { id: '2', name: 'Analysis Lab', slug: 'analysis-lab', teamId: '1' },
  { id: '3', name: 'Research Hub', slug: 'research-hub', teamId: '2' },
  {
    id: '4',
    name: 'Innovation Studio',
    slug: 'innovation-studio',
    teamId: '2',
  },
];

// TeamSelector Component - Inline for simplicity
interface TeamSelectorProps {
  currentTeam: Team;
  teams: Team[];
  isAdmin: boolean;
  onTeamChange: (teamId: string) => void;
  isCompact: boolean;
  navigate: (path: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  currentTeam,
  teams,
  isAdmin,
  onTeamChange,
  isCompact,
  navigate,
}) => {
  // Filter out the current team from the switch options
  const otherTeams = teams.filter((team) => team.id !== currentTeam.id);
  const teamFontSize = isCompact ? '16px' : '24px';

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
                  {currentTeam.name}
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
                {currentTeam.name}
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
              {isAdmin ? (
                <HStack gap={2} align='stretch'>
                  {/* View Team Button - FIXED */}
                  <Button
                    onClick={() => navigate(`/team/${currentTeam.id}`)}
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

                  {/* Manage Button */}
                  <Button
                    onClick={() => navigate(`/team/${currentTeam.id}/admin`)}
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
                // Single View Team Button for non-admin users - FIXED
                <Button
                  onClick={() => navigate(`/team/${currentTeam.id}`)}
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
                    key={team.id}
                    value={team.id}
                    onClick={() => onTeamChange(team.id)}
                    color='fg'
                    fontFamily='body'
                    fontSize='sm'
                    _hover={{
                      bg: 'bg.hover',
                    }}
                  >
                    {team.name}
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State for team and labs management
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamLabs, setTeamLabs] = useState<Lab[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

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

  // Fetch user's teams on component mount
  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        setIsLoadingTeams(true);
        // TODO: Replace with actual API call when ready
        // const response = await fetch(`/api/users/${user?.id}/teams`);
        // const teams = await response.json();

        // Mock API delay for demo
        await new Promise((resolve) => setTimeout(resolve, 500));

        // TODO: Remove this - for demo purposes, always give user the first team
        const teams = mockTeams;

        setUserTeams(teams);
        setCurrentTeam(teams.length > 0 ? teams[0] : null);
      } catch (error) {
        console.error('Failed to fetch user teams:', error);
        setUserTeams([]);
        setCurrentTeam(null);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    if (user) {
      fetchUserTeams();
    }
  }, [user]);

  // Fetch labs when current team changes
  useEffect(() => {
    const fetchTeamLabs = async () => {
      if (!currentTeam) {
        setTeamLabs([]);
        return;
      }

      try {
        setIsLoadingLabs(true);
        // TODO: Replace with actual API call when ready
        // const response = await fetch(`/api/teams/${currentTeam.id}/labs`);
        // const labs = await response.json();

        // Mock API delay for demo
        await new Promise((resolve) => setTimeout(resolve, 300));

        // TODO: Remove this - filter mock labs by team ID for demo
        const labs = mockLabs.filter((lab) => lab.teamId === currentTeam.id);
        setTeamLabs(labs);
      } catch (error) {
        console.error('Failed to fetch team labs:', error);
        setTeamLabs([]);
      } finally {
        setIsLoadingLabs(false);
      }
    };

    fetchTeamLabs();
  }, [currentTeam]);

  const handleTeamChange = (teamId: string) => {
    const selectedTeam = userTeams.find((team) => team.id === teamId);
    if (selectedTeam) {
      setCurrentTeam(selectedTeam);
    }
  };

  const handleLabSelect = (labId: string) => {
    // TODO: Update route when lab pages are properly set up
    navigate(`/lab/${labId}`);
  };

  const hasNoTeam = !currentTeam;
  const isCompact = windowWidth <= 1100;
  const navHeight = isCompact ? '58px' : '64px';
  const teamFontSize = isCompact ? '16px' : '24px';

  return (
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
        <Box
          onClick={() => navigate('/')}
          height='100%'
          width='auto'
          filter={{
            _dark: 'brightness(0) invert(1)', // White logo in dark mode
            _light: 'brightness(0)', // Black logo in light mode
          }}
          _hover={{ opacity: 0.8 }}
          cursor='pointer'
          flexShrink={0}
        >
          <img
            src={FastIcon}
            alt='FAST Icon'
            style={{ height: '100%', width: 'auto' }}
          />
        </Box>

        {/* Whiteboard Button */}
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
              alt='Whiteboard'
              style={{ height: '100%', width: 'auto' }}
            />
          </Box>
          whiteboard
        </Button>

        {/* Team Selector */}
        {currentTeam ? (
          <TeamSelector
            currentTeam={currentTeam}
            teams={userTeams}
            isAdmin={user?.role === 'admin'}
            onTeamChange={handleTeamChange}
            isCompact={isCompact}
            navigate={navigate}
          />
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
            fontSize={teamFontSize}
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
                  <Text
                    fontSize={teamFontSize}
                    fontFamily='body'
                    color='fg.muted'
                  >
                    {isLoadingTeams ? 'Loading...' : '[ NONE ]'}
                  </Text>
                  {!isLoadingTeams && (
                    <Box position='relative'>
                      <LuTriangleAlert size={14} color='#ef4444' />
                    </Box>
                  )}
                </HStack>
              </VStack>
            ) : (
              <HStack gap={2} align='center'>
                <Text fontSize='24px' fontFamily='body' color='fg.secondary'>
                  team:
                </Text>
                <HStack gap={2} align='center'>
                  <Text
                    fontSize={teamFontSize}
                    fontFamily='body'
                    color='fg.muted'
                  >
                    {isLoadingTeams ? 'Loading...' : '[ NONE ]'}
                  </Text>
                  {!isLoadingTeams && (
                    <Box position='relative'>
                      <LuTriangleAlert size={14} color='#ef4444' />
                    </Box>
                  )}
                </HStack>
              </HStack>
            )}
          </Button>
        )}

        {/* Labs Button */}
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
                    <Menu.ItemGroupLabel color='fg.secondary'>
                      {`${currentTeam.name} labs`}
                    </Menu.ItemGroupLabel>
                  </Menu.ItemGroup>
                  {isLoadingLabs ? (
                    <Menu.Item
                      value='loading'
                      color='fg'
                      fontFamily='body'
                      fontSize='sm'
                      disabled
                    >
                      Loading labs...
                    </Menu.Item>
                  ) : teamLabs.length > 0 ? (
                    teamLabs.map((lab) => (
                      <Menu.Item
                        key={lab.id}
                        value={lab.id}
                        onClick={() => handleLabSelect(lab.id)}
                        color='fg'
                        fontFamily='body'
                        fontSize='sm'
                        _hover={{
                          bg: 'bg.hover',
                        }}
                      >
                        {lab.name}
                      </Menu.Item>
                    ))
                  ) : (
                    <Menu.Item
                      value='no-labs'
                      color='fg.secondary'
                      fontFamily='body'
                      fontSize='sm'
                      disabled
                    >
                      No labs available
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          )}
        </Menu.Root>

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

        {/* Profile Button */}
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

                {/* Admin Org Management - only show for admin users */}
                {user?.role === 'admin' && (
                  <>
                    <Box p={2}>
                      <Button
                        onClick={() => navigate(`/admin/${user?.team_id}`)}
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
                          <Text>Org Management</Text>
                        </HStack>
                      </Button>
                    </Box>
                    <Menu.Separator borderColor='border.muted' />
                  </>
                )}

                <Menu.Item
                  value='profile'
                  onClick={() => navigate(`/user/${user?._id}`)}
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

                <Menu.Item
                  value='settings'
                  onClick={() => navigate(`/user/${user?._id}/settings`)}
                  color='fg'
                  fontFamily='body'
                  fontSize='sm'
                  _hover={{
                    bg: 'bg.hover',
                  }}
                >
                  <HStack gap={2}>
                    <LuSettings size={16} />
                    <Text>Settings</Text>
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
      </HStack>
    </Box>
  );
};

export default Navbar;
