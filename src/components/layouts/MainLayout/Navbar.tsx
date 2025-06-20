import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  Button,
  Input,
  Avatar,
  IconButton,
  Text,
  Menu,
  Portal,
} from '@chakra-ui/react';
import {
  LuPenTool,
  LuSun,
  LuMoon,
  LuChevronDown,
  LuTriangleAlert,
  LuUser,
  LuSettings,
  LuLogOut,
} from 'react-icons/lu';
import { FaFlask } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import FastIcon from '../../../assets/fast_icon.svg';

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
  const navHeight = '40px';

  return (
    <Box position='fixed' top={0} left={0} right={0} zIndex={1001} h='64px'>
      <Flex h='full' align='center' justify='space-between' px={4} maxW='full'>
        {/* Left side */}
        <HStack gap={6} flex={1}>
          {/* Logo */}
          <Box
            onClick={() => navigate('/')}
            height='32px'
            width='auto'
            filter={{ base: 'none', _light: 'invert(1)' }}
            _hover={{ opacity: 0.8 }}
            cursor='pointer'
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
            height={navHeight}
            borderColor={{ base: '#FFFFFF', _light: '#000000' }}
            borderWidth='1px'
            color={{ base: '#FFFFFF', _light: '#000000' }}
            bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
            fontFamily='body'
            fontSize='sm'
            _hover={{
              bg: {
                base: 'rgba(255, 255, 255, 0.1)',
                _light: 'rgba(0, 0, 0, 0.1)',
              },
            }}
            display='flex'
            alignItems='center'
            gap={2}
          >
            <LuPenTool size={16} />
            whiteboard
          </Button>

          {/* Team Selector */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button
                variant='outline'
                size='sm'
                height={navHeight}
                borderColor={{ base: '#FFFFFF', _light: '#000000' }}
                borderWidth='1px'
                color={{ base: '#FFFFFF', _light: '#000000' }}
                bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
                fontFamily='body'
                fontSize='sm'
                _hover={{
                  bg: {
                    base: 'rgba(255, 255, 255, 0.1)',
                    _light: 'rgba(0, 0, 0, 0.1)',
                  },
                }}
                px={3}
                display='flex'
                alignItems='center'
                gap={2}
              >
                <HStack gap={2} align='center'>
                  <Text
                    fontSize='sm'
                    fontFamily='body'
                    color={{ base: '#888888', _light: '#666666' }}
                  >
                    team:
                  </Text>
                  {hasNoTeam ? (
                    <HStack gap={2} align='center'>
                      <Text fontSize='sm' fontFamily='body' color='#888888'>
                        {isLoadingTeams ? 'Loading...' : '[ NONE ]'}
                      </Text>
                      {!isLoadingTeams && (
                        <Box position='relative'>
                          <LuTriangleAlert size={14} color='#ef4444' />
                        </Box>
                      )}
                    </HStack>
                  ) : (
                    <Text fontSize='sm' fontFamily='body'>
                      {currentTeam.name}
                    </Text>
                  )}
                </HStack>
                <LuChevronDown size={16} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
                  borderColor={{ base: '#FFFFFF', _light: '#000000' }}
                  borderWidth='1px'
                  borderRadius='8px'
                >
                  {userTeams.map((team) => (
                    <Menu.Item
                      key={team.id}
                      value={team.id}
                      onClick={() => handleTeamChange(team.id)}
                      color={{ base: '#FFFFFF', _light: '#000000' }}
                      fontFamily='body'
                      fontSize='sm'
                      _hover={{
                        bg: {
                          base: 'rgba(255, 255, 255, 0.1)',
                          _light: 'rgba(0, 0, 0, 0.1)',
                        },
                      }}
                    >
                      {team.name}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>

          {/* Labs Button */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button
                variant='outline'
                size='sm'
                height={navHeight}
                borderColor={{
                  base: hasNoTeam ? '#888888' : '#FFFFFF',
                  _light: hasNoTeam ? '#888888' : '#000000',
                }}
                borderWidth='1px'
                color={{
                  base: hasNoTeam ? '#888888' : '#FFFFFF',
                  _light: hasNoTeam ? '#888888' : '#000000',
                }}
                bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
                fontFamily='body'
                fontSize='sm'
                disabled={hasNoTeam}
                _hover={{
                  bg: hasNoTeam
                    ? 'transparent'
                    : {
                        base: 'rgba(255, 255, 255, 0.1)',
                        _light: 'rgba(0, 0, 0, 0.1)',
                      },
                }}
                _disabled={{
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  bg: 'transparent',
                }}
                display='flex'
                alignItems='center'
                gap={2}
              >
                <FaFlask size={16} />
                labs
                {!hasNoTeam && <LuChevronDown size={16} />}
              </Button>
            </Menu.Trigger>
            {!hasNoTeam && (
              <Portal>
                <Menu.Positioner>
                  <Menu.Content
                    bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
                    borderColor={{ base: '#FFFFFF', _light: '#000000' }}
                    borderWidth='1px'
                    borderRadius='8px'
                  >
                    {isLoadingLabs ? (
                      <Menu.Item
                        value='loading'
                        color={{ base: '#FFFFFF', _light: '#000000' }}
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
                          color={{ base: '#FFFFFF', _light: '#000000' }}
                          fontFamily='body'
                          fontSize='sm'
                          _hover={{
                            bg: {
                              base: 'rgba(255, 255, 255, 0.1)',
                              _light: 'rgba(0, 0, 0, 0.1)',
                            },
                          }}
                        >
                          {lab.name}
                        </Menu.Item>
                      ))
                    ) : (
                      <Menu.Item
                        value='no-labs'
                        color={{ base: '#888888', _light: '#666666' }}
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
        </HStack>

        {/* Right side */}
        <HStack gap={4} flex={1} justify='flex-end'>
          {/* Search Field - takes remaining space */}
          <Input
            placeholder='Search...'
            size='sm'
            height={navHeight}
            bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
            borderColor={{ base: '#FFFFFF', _light: '#000000' }}
            borderWidth='1px'
            color={{ base: '#FFFFFF', _light: '#000000' }}
            fontFamily='body'
            fontSize='sm'
            flex={1}
            maxW='400px'
            _placeholder={{
              color: { base: '#888888', _light: '#666666' },
            }}
            _focus={{
              borderColor: '#0005E9',
              boxShadow: '0 0 0 1px #0005E9',
            }}
          />

          {/* Color Mode Toggle */}
          <IconButton
            aria-label='Toggle color mode'
            onClick={toggleColorMode}
            variant='outline'
            size='sm'
            height={navHeight}
            width={navHeight}
            borderColor={{ base: '#FFFFFF', _light: '#000000' }}
            borderWidth='1px'
            color={{ base: '#FFFFFF', _light: '#000000' }}
            bg='transparent'
            _hover={{
              bg: {
                base: 'rgba(255, 255, 255, 0.1)',
                _light: 'rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            {isDark ? <LuSun size={16} /> : <LuMoon size={16} />}
          </IconButton>

          {/* Profile Button */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <Box
                height={navHeight}
                width={navHeight}
                borderRadius='8px'
                borderWidth='1px'
                borderColor={{ base: '#FFFFFF', _light: '#000000' }}
                overflow='hidden'
                cursor='pointer'
                _hover={{
                  opacity: 0.8,
                }}
              >
                <Avatar.Root size='full' height='100%' width='100%'>
                  <Avatar.Fallback
                    name={user?.fullname || user?.username || 'User'}
                    bg='#0005E9'
                    color='white'
                    fontSize='sm'
                    fontFamily='body'
                  />
                  {user?.picture_url && <Avatar.Image src={user.picture_url} />}
                </Avatar.Root>
              </Box>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
                  borderColor={{ base: '#FFFFFF', _light: '#000000' }}
                  borderWidth='1px'
                  borderRadius='8px'
                >
                  <Menu.Item
                    value='profile'
                    onClick={() => navigate(`/user/${user?._id}`)}
                    color={{ base: '#FFFFFF', _light: '#000000' }}
                    fontFamily='body'
                    fontSize='sm'
                    _hover={{
                      bg: {
                        base: 'rgba(255, 255, 255, 0.1)',
                        _light: 'rgba(0, 0, 0, 0.1)',
                      },
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
                    color={{ base: '#FFFFFF', _light: '#000000' }}
                    fontFamily='body'
                    fontSize='sm'
                    _hover={{
                      bg: {
                        base: 'rgba(255, 255, 255, 0.1)',
                        _light: 'rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <HStack gap={2}>
                      <LuSettings size={16} />
                      <Text>Settings</Text>
                    </HStack>
                  </Menu.Item>

                  <Menu.Separator
                    borderColor={{ base: '#333333', _light: '#E0E0E0' }}
                  />

                  <Menu.Item
                    value='logout'
                    onClick={handleLogout}
                    color='#ef4444'
                    fontFamily='body'
                    fontSize='sm'
                    _hover={{
                      bg: {
                        base: 'rgba(239, 68, 68, 0.1)',
                        _light: 'rgba(239, 68, 68, 0.1)',
                      },
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
      </Flex>
    </Box>
  );
};

export default Navbar;
