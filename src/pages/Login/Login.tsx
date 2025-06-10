import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
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
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { login } = useAuth();

  const navigate = useNavigate();

  const userData = {
    id: uuidv4(), // Instead of generateId()
    name: name.trim(),
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Reset error state
    setError('');

    // Validate form
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      // Call login function
      login(userData);

      // Navigate to home page
      navigate('/', { replace: true });
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
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
                <Text color='gray.600'>Enter your name to continue</Text>
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
                      <Fieldset.Legend>Name</Fieldset.Legend>
                      <Input
                        id='name'
                        type='text'
                        value={name}
                        onChange={handleNameChange}
                        placeholder='Enter your name'
                        size='lg'
                        autoComplete='name'
                        autoFocus
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

              {/* Demo Notice */}
              <Box
                p={4}
                bg='blue.50'
                borderRadius='md'
                border='1px solid'
                borderColor='blue.200'
              >
                <Text fontSize='sm' color='blue.700' textAlign='center'>
                  <strong>Demo Mode:</strong> This is a fake login page. Enter
                  any name to access the application.
                </Text>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Box>
    </Box>
  );
};

export default Login;
