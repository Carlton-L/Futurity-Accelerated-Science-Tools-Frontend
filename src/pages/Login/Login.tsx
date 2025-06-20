import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/shared/GlassCard/GlassCard';
import ColorModeToggle from '../../components/shared/ColorModeToggle';
import FastLogo from '../../assets/fast_logo.svg';
import {
  Box,
  Button,
  Fieldset,
  Input,
  Text,
  VStack,
  Alert,
} from '@chakra-ui/react';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Reset error state
    setError('');

    // Validate form
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    try {
      // Call login function
      await login({
        username: username.trim(),
        password: password.trim(),
      });

      // Navigate to home page
      navigate('/', { replace: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An error occurred during login. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    }
  };

  const handleUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setUsername(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <Box
      minHeight='100vh'
      display='flex'
      alignItems='center'
      justifyContent='center'
      bg='bg' // Uses your dark background (#111111) in dark mode
      p={6}
      width='100%'
      position='relative'
    >
      {/* Color Mode Toggle in top right */}
      <Box position='absolute' top={4} right={4}>
        <ColorModeToggle />
      </Box>

      <Box maxW='400px' mx='auto'>
        <GlassCard variant='solid' w='full'>
          <Box p={8}>
            <VStack gap={6} align='stretch'>
              {/* Header with Logo */}
              <VStack gap={4} textAlign='center'>
                <Box
                  height='48px'
                  width='auto'
                  filter={{ base: 'none', _light: 'invert(1)' }} // Invert colors in light mode (white -> black)
                >
                  <img
                    src={FastLogo}
                    alt='FAST Logo'
                    style={{ height: '100%', width: 'auto' }}
                  />
                </Box>
                <Box>
                  <Text
                    fontSize='xl'
                    fontWeight='normal'
                    mb={2}
                    color={{ base: '#FFFFFF', _light: '#000000' }} // Explicit colors
                    fontFamily='body' // JetBrains Mono instead of heading
                  >
                    Welcome! 👋
                  </Text>
                  <Text
                    color={{ base: '#A0A0A0', _light: '#666666' }} // Explicit muted colors
                    fontFamily='body' // JetBrains Mono
                  >
                    Sign in to your account to continue
                  </Text>
                </Box>
              </VStack>

              {/* Error Alert */}
              {error && (
                <Alert.Root status='error' borderRadius='md'>
                  <Alert.Indicator />
                  <Alert.Title fontFamily='heading'>Error</Alert.Title>
                  <Alert.Description fontFamily='body'>
                    {error}
                  </Alert.Description>
                </Alert.Root>
              )}

              {/* Login Form */}
              <Box as='form' onSubmit={handleSubmit}>
                <VStack gap={4} align='stretch'>
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Fieldset.Legend
                        color={{ base: '#FFFFFF', _light: '#000000' }}
                        fontFamily='body'
                      >
                        Username
                      </Fieldset.Legend>
                      <Input
                        id='username'
                        type='text'
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder='Enter your username'
                        size='lg'
                        autoComplete='username'
                        autoFocus
                        required
                        bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
                        borderColor={{ base: '#333333', _light: '#E0E0E0' }}
                        color={{ base: '#FFFFFF', _light: '#000000' }}
                        fontFamily='body'
                        _placeholder={{
                          color: { base: '#707070', _light: '#888888' },
                        }}
                        _focus={{
                          borderColor: '#0005E9',
                          boxShadow: '0 0 0 1px #0005E9',
                        }}
                      />
                    </Fieldset.Content>
                  </Fieldset.Root>

                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Fieldset.Legend
                        color={{ base: '#FFFFFF', _light: '#000000' }}
                        fontFamily='body'
                      >
                        Password
                      </Fieldset.Legend>
                      <Input
                        id='password'
                        type='password'
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder='Enter your password'
                        size='lg'
                        autoComplete='current-password'
                        required
                        bg={{ base: '#1a1a1a', _light: '#FFFFFF' }}
                        borderColor={{ base: '#333333', _light: '#E0E0E0' }}
                        color={{ base: '#FFFFFF', _light: '#000000' }}
                        fontFamily='body'
                        _placeholder={{
                          color: { base: '#707070', _light: '#888888' },
                        }}
                        _focus={{
                          borderColor: '#0005E9',
                          boxShadow: '0 0 0 1px #0005E9',
                        }}
                      />
                    </Fieldset.Content>
                  </Fieldset.Root>

                  <Button
                    type='submit'
                    colorScheme='blue'
                    size='lg'
                    width='full'
                    loading={isLoading}
                    loadingText='Signing in...'
                    bg='brand.500' // Your brand color
                    color='white'
                    fontFamily='heading' // TT Norms Pro
                    _hover={{
                      bg: 'brand.600',
                    }}
                    _active={{
                      bg: 'brand.700',
                    }}
                  >
                    Sign In
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </GlassCard>
      </Box>
    </Box>
  );
};

export default Login;
