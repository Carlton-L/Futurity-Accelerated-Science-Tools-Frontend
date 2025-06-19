import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, VStack, Text, Alert } from '@chakra-ui/react';
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartName?: string;
  fallbackHeight?: string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to your error reporting service
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { chartName = 'Chart', fallbackHeight = '400px' } = this.props;

      return (
        <Box
          height={fallbackHeight}
          display='flex'
          alignItems='center'
          justifyContent='center'
          border='1px solid'
          borderColor='red.200'
          borderRadius='md'
          bg='red.50'
        >
          <VStack gap={4} maxW='400px' textAlign='center' p={6}>
            <Box color='red.500'>
              <FiAlertTriangle size={48} />
            </Box>

            <VStack gap={2}>
              <Text fontSize='lg' fontWeight='bold' color='red.700'>
                {chartName} Error
              </Text>
              <Text fontSize='sm' color='red.600'>
                Something went wrong while rendering the chart.
              </Text>
            </VStack>

            <Button
              size='sm'
              colorScheme='red'
              variant='outline'
              onClick={this.handleRetry}
            >
              <FiRefreshCw size={14} />
              Retry
            </Button>

            {/* Development mode: Show error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert.Root status='error' size='sm' mt={4}>
                <Alert.Indicator />
                <Box fontSize='xs'>
                  <Alert.Title>Debug Info:</Alert.Title>
                  <Alert.Description>
                    <Text as='pre' whiteSpace='pre-wrap' textAlign='left'>
                      {this.state.error.message}
                    </Text>
                  </Alert.Description>
                </Box>
              </Alert.Root>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
