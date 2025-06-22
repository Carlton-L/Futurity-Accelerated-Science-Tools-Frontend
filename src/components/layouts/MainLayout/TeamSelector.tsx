import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Text, HStack, Box } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import { LuChevronDown, LuUsers, LuSettings } from 'react-icons/lu';

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  currentTeam: Team;
  teams: Team[];
  isAdmin: boolean;
  onTeamChange: (teamId: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  currentTeam,
  teams,
  isAdmin,
  onTeamChange,
}) => {
  // Filter out the current team from the switch options
  const otherTeams = teams.filter((team) => team.id !== currentTeam.id);

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant='ghost' size='sm' color='fg' fontFamily='body'>
          {currentTeam.name}
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
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
                {/* View Team Button */}
                <Button
                  asChild
                  flex='1'
                  size='sm'
                  bg='brand'
                  color='white'
                  borderWidth='1px'
                  borderColor='border.emphasized'
                  _hover={{
                    bg: 'brand.hover',
                  }}
                  fontFamily='body'
                >
                  <RouterLink to={`/team/${currentTeam.id}`}>
                    <LuUsers size={16} />
                    View Team
                  </RouterLink>
                </Button>

                {/* Manage Button */}
                <Button
                  asChild
                  flex='1'
                  size='sm'
                  bg='secondary'
                  color='white'
                  borderWidth='1px'
                  borderColor='border.emphasized'
                  _hover={{
                    bg: 'secondary.hover',
                  }}
                  fontFamily='body'
                >
                  <RouterLink to={`/team/${currentTeam.id}/admin`}>
                    <LuSettings size={16} />
                    Manage
                  </RouterLink>
                </Button>
              </HStack>
            ) : (
              // Single View Team Button for non-admin users
              <Button
                asChild
                width='100%'
                size='sm'
                bg='brand'
                color='white'
                borderWidth='1px'
                borderColor='border.emphasized'
                _hover={{
                  bg: 'brand.hover',
                }}
                fontFamily='body'
              >
                <RouterLink to={`/team/${currentTeam.id}`}>
                  <LuUsers size={16} />
                  View Team
                </RouterLink>
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
    </Menu.Root>
  );
};

export default TeamSelector;
