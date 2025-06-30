import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';

// Enhanced toast notifications with undo functionality
export interface ToastState {
  id: string;
  title: string;
  description?: string;
  status: 'success' | 'error' | 'warning' | 'info' | 'delete';
  isVisible: boolean;
  undoAction?: () => void;
  undoLabel?: string;
}

// Custom hook for enhanced toast notifications with undo support
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = useCallback(
    (options: {
      title: string;
      description?: string;
      status: 'success' | 'error' | 'warning' | 'info' | 'delete';
      duration?: number;
      undoAction?: () => void;
      undoLabel?: string;
    }) => {
      const toastId = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastState = {
        id: toastId,
        title: options.title,
        description: options.description,
        status: options.status,
        isVisible: true,
        undoAction: options.undoAction,
        undoLabel: options.undoLabel || 'Undo',
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove toast after duration (longer for undo actions)
      const duration = options.undoAction ? 8000 : options.duration || 5000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, duration);

      // Console log for debugging
      console.log(
        `[${options.status.toUpperCase()}] ${options.title}`,
        options.description
      );
    },
    []
  );

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const executeUndo = useCallback(
    (toastId: string, undoAction: () => void) => {
      undoAction();
      removeToast(toastId);
    },
    [removeToast]
  );

  return {
    toast: addToast,
    toasts,
    removeToast,
    executeUndo,
  };
};

// Enhanced Toast Display Component with undo functionality
export const ToastDisplay: React.FC<{
  toasts: ToastState[];
  onRemove: (id: string) => void;
  onUndo: (id: string, undoAction: () => void) => void;
}> = ({ toasts, onRemove, onUndo }) => {
  if (toasts.length === 0) return null;

  const getStatusStyles = (status: ToastState['status']) => {
    switch (status) {
      case 'success':
        return {
          bg: {
            _light: '#3DB462', // Light mode success color
            _dark: '#3DB462', // Use same green in dark mode (not the too-light one)
          },
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: {
            _light: '#2F8B49', // Darker success for border in light
            _dark: '#2F8B49', // Same darker green for border in dark
          },
        };
      case 'error':
        return {
          bg: {
            _light: '#FF4D53', // Light mode error color
            _dark: '#FF6860', // Dark mode error color
          },
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: {
            _light: '#E33C41', // Darker error for border in light
            _dark: '#FF5650', // Darker error for border in dark
          },
        };
      case 'warning':
        return {
          bg: '#F2CD5D', // Warning color (same for both modes)
          color: 'black',
          borderLeft: '4px solid',
          borderLeftColor: '#E6B84A',
        };
      case 'info':
        return {
          bg: {
            _light: '#0005E9', // Light mode brand color
            _dark: '#8285FF', // Dark mode brand color
          },
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: {
            _light: '#000383', // Darker brand for border in light
            _dark: '#6B6EFF', // Darker brand for border in dark
          },
        };
      case 'delete': // New case for deletion messages
        return {
          bg: {
            _light: '#FF4D53', // Same as error - red background
            _dark: '#FF6860', // Same as error - red background
          },
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: {
            _light: '#E33C41', // Darker red for border in light
            _dark: '#FF5650', // Darker red for border in dark
          },
        };
      default:
        return {
          bg: {
            _light: '#646E78', // Light mode muted
            _dark: '#A7ACB2', // Dark mode muted
          },
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: {
            _light: '#505A64',
            _dark: '#919BA6',
          },
        };
    }
  };

  return (
    <Box
      position='fixed'
      bottom='20px'
      right='20px'
      zIndex='9999'
      display='flex'
      flexDirection='column'
      gap={3}
      maxW='400px'
    >
      {toasts.map((toast, index) => {
        const styles = getStatusStyles(toast.status);
        return (
          <Box
            key={toast.id}
            bg={styles.bg}
            color={styles.color}
            borderLeft={styles.borderLeft}
            borderLeftColor={styles.borderLeftColor}
            p={4}
            borderRadius='md'
            boxShadow='xl'
            minW='300px'
            opacity={toast.isVisible ? 1 : 0}
            transform={
              toast.isVisible
                ? 'translateY(0) scale(1)'
                : 'translateY(20px) scale(0.95)'
            }
            transition='all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            style={{
              transformOrigin: 'bottom right',
              animationDelay: `${index * 100}ms`,
            }}
          >
            <HStack justify='space-between' align='flex-start'>
              <VStack align='stretch' gap={1} flex='1'>
                <Text fontSize='sm' fontWeight='semibold' fontFamily='heading'>
                  {toast.title}
                </Text>
                {toast.description && (
                  <Text
                    fontSize='xs'
                    opacity={0.9}
                    lineHeight='1.4'
                    fontFamily='body'
                  >
                    {toast.description}
                  </Text>
                )}
              </VStack>

              <HStack gap={2}>
                {/* Undo button for destructive actions */}
                {toast.undoAction && (
                  <Button
                    size='xs'
                    variant='outline'
                    borderColor='rgba(255, 255, 255, 0.5)'
                    color='white'
                    bg='rgba(255, 255, 255, 0.1)'
                    _hover={{
                      bg: 'rgba(255, 255, 255, 0.2)',
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                    }}
                    onClick={() => onUndo(toast.id, toast.undoAction!)}
                    fontSize='xs'
                    px={3}
                    py={1}
                    fontFamily='heading'
                  >
                    {toast.undoLabel}
                  </Button>
                )}

                {/* Close button */}
                <IconButton
                  size='xs'
                  variant='ghost'
                  color='white'
                  _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                  onClick={() => onRemove(toast.id)}
                  aria-label='Close notification'
                >
                  <FiX size={12} />
                </IconButton>
              </HStack>
            </HStack>
          </Box>
        );
      })}
    </Box>
  );
};
