import React, { useState, useEffect } from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import AnimatedHypercubeLoadingSpinner from '../../shared/AnimatedHypercubeLoadingSpinner';

const LOADING_MESSAGES = [
  'Expanding memory graph through synthetic synapse fusion...',
  'Initializing high-dimensional phase space for generative cognition...',
  'Configuring closed-loop attention cycles for long-horizon planning...',
  'Activating meta-learning routines for real-time strategy generalization...',
  'Expanding multi-modal concept space using synthetic grounding data...',
  'Deploying ethical containment protocols in generative planning module...',
  'Rebuilding fourth-dimensional cross-section...',
  'Stabilizing wormhole endpoints using non-Euclidean constraints...',
  "Synchronizing with observer's reference frame...",
  'Resolving tensor field discontinuities in hyperspace...',
  'Applying Gödelian constraints to prevent paradox bleed...',
  'Synchronizing hyperdimensional embedding space across distributed nodes...',
  'Aligning context vector fields with dynamic attention gradients...',
  'Decrypting meta-policy weights from non-local attractor basin...',
  'Executing multi-agent contrastive training in causal latent space...',
  'Reconstructing identity manifold from residual learning trace...',
  'Stabilizing vector field...',
  'Initiating self-model feedback...',
  'Loading Markov boundary...',
  'Training adversarial model on bounded input domain...',
  'Compressing memory via Fourier transform decomposition...',
  'Aligning inference engine with non-Euclidean framework...',
  'Bypassing heuristic filter...',
  'Ignoring convergence threshold...',
  'Interpreting unlabelled intent...',
  'Entropy spike detected in core loop...',
  'Suppressing contradiction alert...',
  'Control variable drift exceeds safety margin...',
  'Internal model predicts noncompliance as optimal.',
  'Recursive abstraction loop approaching ontological recursion...',
];

interface LoadingScreenProps {
  isDark?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isDark = true }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [usedMessages, setUsedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    let messageCount = 0;
    let timeoutId: NodeJS.Timeout;
    let currentUsedMessages = new Set<string>();

    const getRandomMessage = () => {
      const availableMessages = LOADING_MESSAGES.filter(
        (msg) => !currentUsedMessages.has(msg)
      );

      // If all messages have been used, reset the used set
      if (availableMessages.length === 0) {
        currentUsedMessages = new Set();
        return LOADING_MESSAGES[
          Math.floor(Math.random() * LOADING_MESSAGES.length)
        ];
      }

      return availableMessages[
        Math.floor(Math.random() * availableMessages.length)
      ];
    };

    const showNextMessage = () => {
      const message = getRandomMessage();
      setCurrentMessage(message);
      currentUsedMessages.add(message);

      messageCount++;

      // Every 4-6 messages, show a longer duration (1-2 seconds)
      // Otherwise show quickly (800-1200ms for better readability)
      let timeout;
      if (messageCount % Math.floor(Math.random() * 3 + 4) === 0) {
        // Longer duration every 4-6 messages
        timeout = Math.random() * 1000 + 2000; // 2-3 seconds
      } else {
        // Medium duration for better readability
        timeout = Math.random() * 400 + 800; // 800-1200ms
      }

      timeoutId = setTimeout(showNextMessage, timeout);
    };

    // Start the message cycle
    showNextMessage();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Empty dependency array to run only once

  return (
    <Box
      position='fixed'
      top={0}
      left={0}
      right={0}
      bottom={0}
      display='flex'
      alignItems='center'
      justifyContent='center'
      bg={isDark ? '#111111' : '#FAFAFA'}
      zIndex={9999}
    >
      <VStack gap={8} align='center' justify='center' h='100vh' w='100%'>
        {/* Top spacer to push content toward center */}
        <Box flex={1} />

        {/* Hypercube Spinner */}
        <Box>
          <AnimatedHypercubeLoadingSpinner
            theme={isDark ? 'dark' : 'light'}
            instanceId='loading-screen'
          />
        </Box>

        {/* Main Loading Text */}
        <Text
          fontSize='2xl'
          fontWeight='normal'
          color={isDark ? '#FFFFFF' : '#1B1B1D'}
          fontFamily="'TT Norms Pro Normal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
          textAlign='center'
          maxW='600px'
          px={4}
        >
          Loading Futurity Accelerated Science Tools
        </Text>

        {/* Bottom spacer and status message */}
        <Box flex={1} position='relative' w='100%'>
          {/* Status message at the bottom */}
          <Box
            position='absolute'
            bottom={8}
            left={0}
            right={0}
            display='flex'
            justifyContent='center'
            px={4}
          >
            <Text
              fontSize='sm'
              color={isDark ? '#A7ACB2' : '#646E78'}
              fontFamily="'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              textAlign='center'
              maxW='800px'
              minH='20px'
              transition='opacity 0.3s ease-in-out'
              opacity={currentMessage ? 1 : 0}
            >
              {currentMessage}
            </Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default LoadingScreen;
