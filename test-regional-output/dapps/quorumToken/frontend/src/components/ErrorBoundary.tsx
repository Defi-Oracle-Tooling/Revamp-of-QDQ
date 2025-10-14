import React from 'react';
import { Alert, AlertIcon, Box, Button, Code } from '@chakra-ui/react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box p={4}>
          <Alert status='error' mb={4} borderRadius='md'>
            <AlertIcon />
            <Box flex='1'>
              <strong>Something went wrong.</strong>
              {this.state.errorMessage && (
                <Box mt={2} fontSize='sm'>
                  <Code colorScheme='red'>{this.state.errorMessage}</Code>
                </Box>
              )}
            </Box>
            <Button ml={4} size='sm' onClick={this.handleReset}>
              Retry
            </Button>
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}

export function withErrorBoundary<T extends object>(Component: React.ComponentType<T>) {
  return function Wrapped(props: T) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}