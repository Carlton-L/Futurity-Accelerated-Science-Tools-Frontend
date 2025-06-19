import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Button,
  Card,
  Fieldset,
  Heading,
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
      bg='gray.50'
      p={6}
      width='100%'
    >
      <Box maxW='400px' mx='auto'>
        <Card.Root w='full'>
          <Card.Body p={8}>
            <VStack gap={6} align='stretch'>
              {/* Header */}
              <Box textAlign='center'>
                <Heading as='h1' size='lg' mb={2}>
                  Welcome Back
                </Heading>
                <Text color='gray.600'>Sign in to your account</Text>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert.Root status='error' borderRadius='md'>
                  <Alert.Indicator />
                  <Alert.Title>Error</Alert.Title>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
              )}

              {/* Login Form */}
              <Box as='form' onSubmit={handleSubmit}>
                <VStack gap={4} align='stretch'>
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Fieldset.Legend>Username</Fieldset.Legend>
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
                      />
                    </Fieldset.Content>
                  </Fieldset.Root>

                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Fieldset.Legend>Password</Fieldset.Legend>
                      <Input
                        id='password'
                        type='password'
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder='Enter your password'
                        size='lg'
                        autoComplete='current-password'
                        required
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
                  >
                    Sign In
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Box>
    </Box>
  );
};

export default Login;
