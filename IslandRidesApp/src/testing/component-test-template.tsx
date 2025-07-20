import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { render, createMockNavigation, createMockRoute } from './test-utils';

// Template for component tests
// Copy this template and adapt it for your components

// Placeholder component for template compilation
import { View, Text, ActivityIndicator, Button, TextInput } from 'react-native';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Text>Something went wrong</Text>;
    }

    return this.props.children;
  }
}

interface ComponentNameProps {
  title?: string;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  onSubmit?: () => void;
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  apiCall?: () => Promise<void> | void;
  data?: Array<{ id: number; name: string }>;
  navigation?: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

function ComponentName(props: ComponentNameProps) {
  const [isToggled, setIsToggled] = useState(false);
  const [asyncData, setAsyncData] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [apiError, setApiError] = useState('');

  const handleToggle = () => {
    setIsToggled(true);
  };

  const handleAsyncAction = () => {
    setTimeout(() => {
      setAsyncData('Async Data Loaded');
    }, 100);
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
    if (props.onChangeText) {
      props.onChangeText(text);
    }
  };

  const handleApiCall = async () => {
    try {
      setApiError('');
      if (props.apiCall) {
        await props.apiCall();
      }
    } catch (error) {
      setApiError('Failed to load data');
    }
  };

  return <View testID="component-name" accessibilityLabel="Component Name" accessibilityState={{disabled: props.disabled}}>
    {props.title && <Text>{props.title}</Text>}
    {props.loading && <ActivityIndicator testID="loading-indicator" />}
    {props.error && <Text>{props.error}</Text>}
    {apiError && <Text>{apiError}</Text>}
    {isToggled && <Text>State Updated</Text>}
    {asyncData && <Text>{asyncData}</Text>}
    <TextInput
      value={inputValue}
      onChangeText={handleTextChange}
      placeholder="Enter text"
      testID="text-input"
    />
    <Button title="Submit" onPress={props.onSubmit || (() => {})} />
    <Button title="Press Me" onPress={props.onPress || (() => {})} />
    {props.navigation && (
      <>
        <Button title="Navigate" onPress={() => props.navigation?.navigate('DestinationScreen')} />
        <Button title="Back" onPress={() => props.navigation?.goBack()} />
      </>
    )}
    <Button title="Toggle" onPress={handleToggle} />
    <Button title="Async Action" onPress={handleAsyncAction} />
    <Button title="Load Data" onPress={handleApiCall} />
  </View>;
}

describe('ComponentName', () => {
  // Mock dependencies
  const mockNavigation = createMockNavigation();
  const mockRoute = createMockRoute();

  // Default props
  const defaultProps = {
    navigation: mockNavigation,
    route: mockRoute,
    // Add other required props
  };

  // Helper function to render component with default props
  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByTestId } = renderComponent();
      
      expect(getByTestId('component-name')).toBeTruthy();
    });

    it('renders with custom props', () => {
      const customProps = {
        title: 'Custom Title',
      };
      
      const { getByText } = renderComponent(customProps);
      
      expect(getByText('Custom Title')).toBeTruthy();
    });

    it('renders loading state', () => {
      const { getByTestId } = renderComponent({ loading: true });
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('renders error state', () => {
      const errorMessage = 'Something went wrong';
      const { getByText } = renderComponent({ error: errorMessage });
      
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('handles button press', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderComponent({ onPress: mockOnPress });
      
      fireEvent.press(getByRole('button'));
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('handles text input', () => {
      const mockOnChangeText = jest.fn();
      const { getByTestId } = renderComponent({ onChangeText: mockOnChangeText });
      
      fireEvent.changeText(getByTestId('text-input'), 'test input');
      
      expect(mockOnChangeText).toHaveBeenCalledWith('test input');
    });

    it('handles form submission', async () => {
      const mockOnSubmit = jest.fn();
      const { getByRole } = renderComponent({ onSubmit: mockOnSubmit });
      
      fireEvent.press(getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to correct screen', () => {
      const { getByRole } = renderComponent();
      
      fireEvent.press(getByRole('button', { name: /navigate/i }));
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('DestinationScreen', {
        // Expected parameters
      });
    });

    it('goes back when back button is pressed', () => {
      const { getByRole } = renderComponent();
      
      fireEvent.press(getByRole('button', { name: /back/i }));
      
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Management', () => {
    it('updates local state correctly', () => {
      const { getByRole, getByText } = renderComponent();
      
      fireEvent.press(getByRole('button', { name: /toggle/i }));
      
      expect(getByText('State Updated')).toBeTruthy();
    });

    it('handles async state updates', async () => {
      const { getByRole, getByText } = renderComponent();
      
      fireEvent.press(getByRole('button', { name: /async action/i }));
      
      await waitFor(() => {
        expect(getByText('Async Data Loaded')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByLabelText } = renderComponent();
      
      expect(getByLabelText('Component Name')).toBeTruthy();
    });

    it('has proper accessibility roles', () => {
      const { getByRole } = renderComponent();
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('has proper accessibility states', () => {
      const { getByRole } = renderComponent({ disabled: true });
      
      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', async () => {
      const renderTime = await measureRenderTime(() => {
        renderComponent();
      });
      
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });

    it('handles large data sets efficiently', () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));
      
      const { getByTestId } = renderComponent({ data: largeDataSet });
      
      expect(getByTestId('component-name')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const mockError = new Error('API Error');
      const mockApiCall = jest.fn().mockRejectedValue(mockError);
      
      const { getByRole, getByText } = renderComponent({ apiCall: mockApiCall });
      
      fireEvent.press(getByRole('button', { name: /load data/i }));
      
      await waitFor(() => {
        expect(getByText('Failed to load data')).toBeTruthy();
      });
    });

    it('displays error boundary for component crashes', () => {
      const ThrowError = () => {
        throw new Error('Component crashed');
      };
      
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(getByText(/something went wrong/i)).toBeTruthy();
    });
  });
});

// Additional test utilities for this component
const measureRenderTime = async (renderFunction: () => void) => {
  const start = performance.now();
  renderFunction();
  const end = performance.now();
  return end - start;
};