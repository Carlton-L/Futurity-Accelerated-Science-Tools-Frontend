import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Text, VStack, HStack } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import { LuChevronDown, LuUsers, LuSettings } from 'react-icons/lu';

interface Team {
  id: string;
  name: string;
}

const TeamSelector: React.FC = () => {
  // These would come from your context/state management
  const currentTeam = { id: '1', name: 'Current Team' };
  const teams: Team[] = [
    { id: '1', name: 'Current Team' },
    { id: '2', name: 'Another Team' },
    { id: '3', name: 'Third Team' },
  ];
  const isAdmin = true; // This would come from user permissions

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant='ghost' size='sm'>
          {currentTeam.name}
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value='manage-team' asChild>
            <RouterLink to={`/team/${currentTeam.id}`}>
              <HStack>
                <LuUsers />

                <Text>View Team</Text>
              </HStack>
            </RouterLink>
          </Menu.Item>

          {isAdmin && (
            <Menu.Item value='manage' asChild>
              <RouterLink to={`/team/${currentTeam.id}/manage`}>
                <HStack>
                  <LuSettings />
                  <Text>Manage</Text>
                </HStack>
              </RouterLink>
            </Menu.Item>
          )}

          <Menu.Separator />

          <VStack align='start' px={3} py={2} gap={2}>
            <Text fontSize='sm' fontWeight='semibold' color='gray.500'>
              Switch to
            </Text>
            {teams.map((team) => (
              <Menu.Item value={team.id} key={team.id} asChild>
                <RouterLink to={`/team/${team.id}`}>
                  <Text fontSize='sm' py={1}>
                    {team.name}
                  </Text>
                </RouterLink>
              </Menu.Item>
            ))}
          </VStack>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

export default TeamSelector;
