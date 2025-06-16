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
  status: 'success' | 'error' | 'warning' | 'info';
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
      status: 'success' | 'error' | 'warning' | 'info';
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
          bg: 'green.500',
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: 'green.600',
        };
      case 'error':
        return {
          bg: 'red.500',
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: 'red.600',
        };
      case 'warning':
        return {
          bg: 'orange.500',
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: 'orange.600',
        };
      case 'info':
        return {
          bg: 'blue.500',
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: 'blue.600',
        };
      default:
        return {
          bg: 'gray.500',
          color: 'white',
          borderLeft: '4px solid',
          borderLeftColor: 'gray.600',
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
                <Text fontSize='sm' fontWeight='semibold'>
                  {toast.title}
                </Text>
                {toast.description && (
                  <Text fontSize='xs' opacity={0.9} lineHeight='1.4'>
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
                    colorScheme='whiteAlpha'
                    color='white'
                    borderColor='white'
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={() => onUndo(toast.id, toast.undoAction!)}
                    fontSize='xs'
                    px={3}
                    py={1}
                  >
                    {toast.undoLabel}
                  </Button>
                )}

                {/* Close button */}
                <IconButton
                  size='xs'
                  variant='ghost'
                  colorScheme='whiteAlpha'
                  color='white'
                  _hover={{ bg: 'whiteAlpha.200' }}
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
