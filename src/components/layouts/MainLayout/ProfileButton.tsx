import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  HStack,
  Text,
  Button,
  Dialog,
  Menu,
  Portal,
} from '@chakra-ui/react';
import {
  LuUser,
  LuSettings,
  LuGraduationCap,
  LuCircleHelp,
  LuLogOut,
  LuUserCog,
} from 'react-icons/lu';

const ProfileButton: React.FC = () => {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false);

  // These would come from your auth context
  const user = {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://via.placeholder.com/40',
    isOrgAdmin: true,
  };
  const orgId = 'org123';

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logging out...');
    setIsLogoutOpen(false);
    navigate('/login');
  };

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box>
            <Avatar.Root _hover={{ opacity: 0.8 }} cursor='pointer'>
              <Avatar.Fallback name={user.name} />
              <Avatar.Image src={user.avatar} />
            </Avatar.Root>
          </Box>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              {user.isOrgAdmin && (
                <>
                  <Menu.Item value='org-management' asChild>
                    <RouterLink to={`/admin/${orgId}`}>
                      <HStack gap={2}>
                        <LuUserCog />
                        <Text>Org Management</Text>
                      </HStack>
                    </RouterLink>
                  </Menu.Item>
                  <Menu.Separator />
                </>
              )}

              <Menu.Item value='profile' asChild>
                <RouterLink to={`/user/${user.id}`}>
                  <HStack gap={2}>
                    <LuUser />
                    <Text>My Profile</Text>
                  </HStack>
                </RouterLink>
              </Menu.Item>

              <Menu.Item value='settings' asChild>
                <RouterLink to={`/user/${user.id}/settings`}>
                  <HStack gap={2}>
                    <LuSettings />
                    <Text>Settings</Text>
                  </HStack>
                </RouterLink>
              </Menu.Item>

              <Menu.Item value='tutorials' asChild>
                <RouterLink to='/tutorials'>
                  <HStack gap={2}>
                    <LuGraduationCap />
                    <Text>Tutorials</Text>
                  </HStack>
                </RouterLink>
              </Menu.Item>

              <Menu.Item value='help' asChild>
                <RouterLink to='/help'>
                  <HStack gap={2}>
                    <LuCircleHelp />
                    <Text>Help</Text>
                  </HStack>
                </RouterLink>
              </Menu.Item>

              <Menu.Separator />

              <Menu.Item
                value='logout'
                onClick={() => setIsLogoutOpen(true)}
                color='red.500'
              >
                <HStack gap={2}>
                  <LuLogOut />
                  <Text>Logout</Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {/* Logout Confirmation Dialog */}
      <Dialog.Root
        open={isLogoutOpen}
        onOpenChange={(e) => setIsLogoutOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Logout</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>Are you sure you want to logout?</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline'>Cancel</Button>
              </Dialog.CloseTrigger>
              <Button colorScheme='red' onClick={handleLogout}>
                Logout
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

export default ProfileButton;
