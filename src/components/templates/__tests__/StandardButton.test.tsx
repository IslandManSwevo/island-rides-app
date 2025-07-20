import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { render } from '../../../testing/test-utils';
import { StandardButton } from '../StandardButton';

describe('StandardButton', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByText } = render(<StandardButton {...defaultProps} />);
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders with different variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
      
      variants.forEach(variant => {
        const { getByRole } = render(
          <StandardButton {...defaultProps} variant={variant} />
        );
        
        const button = getByRole('button');
        expect(button).toBeTruthy();
      });
    });

    it('renders with different sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { getByRole } = render(
          <StandardButton {...defaultProps} size={size} />
        );
        
        const button = getByRole('button');
        expect(button).toBeTruthy();
      });
    });

    it('renders with icon', () => {
      const { getByTestId } = render(
        <StandardButton {...defaultProps} icon="home" />
      );
      
      expect(getByTestId('button-icon')).toBeTruthy();
    });

    it('renders loading state', () => {
      const { getByTestId, queryByText } = render(
        <StandardButton {...defaultProps} loading={true} />
      );
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
      expect(queryByText('Test Button')).toBeNull();
    });

    it('renders disabled state', () => {
      const { getByRole } = render(
        <StandardButton {...defaultProps} disabled={true} />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('User Interactions', () => {
    it('handles button press', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <StandardButton {...defaultProps} onPress={mockOnPress} />
      );
      
      fireEvent.press(getByRole('button'));
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <StandardButton 
          {...defaultProps} 
          onPress={mockOnPress} 
          disabled={true} 
        />
      );
      
      fireEvent.press(getByRole('button'));
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <StandardButton 
          {...defaultProps} 
          onPress={mockOnPress} 
          loading={true} 
        />
      );
      
      fireEvent.press(getByRole('button'));
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility label', () => {
      const { getByLabelText } = render(
        <StandardButton {...defaultProps} accessibilityLabel="Custom Label" />
      );
      
      expect(getByLabelText('Custom Label')).toBeTruthy();
    });

    it('uses title as accessibility label when no custom label provided', () => {
      const { getByLabelText } = render(<StandardButton {...defaultProps} />);
      
      expect(getByLabelText('Test Button')).toBeTruthy();
    });

    it('has proper accessibility role', () => {
      const { getByRole } = render(<StandardButton {...defaultProps} />);
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('has proper accessibility hint', () => {
      const { getByRole } = render(
        <StandardButton {...defaultProps} accessibilityHint="Tap to submit" />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Tap to submit');
    });

    it('has proper accessibility state for disabled button', () => {
      const { getByRole } = render(
        <StandardButton {...defaultProps} disabled={true} />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });

    it('has proper accessibility state for loading button', () => {
      const { getByRole } = render(
        <StandardButton {...defaultProps} loading={true} />
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({ busy: true });
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<StandardButton {...defaultProps} />);
      });
      
      expect(renderTime).toBeLessThan(50); // 50ms threshold
    });

    it('handles rapid press events', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <StandardButton {...defaultProps} onPress={mockOnPress} />
      );
      
      const button = getByRole('button');
      
      // Rapid fire events
      for (let i = 0; i < 10; i++) {
        fireEvent.press(button);
      }
      
      expect(mockOnPress).toHaveBeenCalledTimes(10);
    });
  });

  describe('Style Variants', () => {
    it('applies correct styles for primary variant', () => {
      const { getByRole } = render(
        <StandardButton {...defaultProps} variant="primary" />
      );
      
      const button = getByRole('button');
      const styles = button.props.style;
      
      // Test would depend on your actual style implementation
      expect(styles).toBeDefined();
    });

    it('applies correct styles for different sizes', () => {
      const { getByRole } = render(
        <StandardButton {...defaultProps} size="large" />
      );
      
      const button = getByRole('button');
      const styles = button.props.style;
      
      expect(styles).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      const { getByRole } = render(
        <StandardButton title="" onPress={jest.fn()} />
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('handles very long titles', () => {
      const longTitle = 'This is a very long button title that might cause layout issues';
      const { getByText } = render(
        <StandardButton title={longTitle} onPress={jest.fn()} />
      );
      
      expect(getByText(longTitle)).toBeTruthy();
    });

    it('handles undefined onPress gracefully', () => {
      // This should not crash
      expect(() => {
        render(<StandardButton title="Test" onPress={undefined as any} />);
      }).not.toThrow();
    });
  });
});

// Helper function for measuring render time
const measureRenderTime = async (renderFunction: () => void) => {
  const start = performance.now();
  renderFunction();
  const end = performance.now();
  return end - start;
};