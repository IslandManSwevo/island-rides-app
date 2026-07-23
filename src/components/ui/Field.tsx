import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

/**
 * Text input on the KeyLo kit: hairline Sand border, coral focus ring, Inter
 * body. Used across auth, storefront editing, and any form surface.
 */
export const Field: React.FC<FieldProps> = ({ label, error, className = '', ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <View className={className}>
      {label ? (
        <Text className="mb-1.5 font-ui-semibold text-overline uppercase tracking-wide text-stone dark:text-night-muted">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#C9C2B6"
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={`rounded-field border bg-white px-4 py-3.5 font-ui text-body text-ink dark:bg-night-raised dark:text-night-text ${
          error
            ? 'border-danger'
            : focused
              ? 'border-coral'
              : 'border-sand dark:border-night-line'
        }`}
        {...props}
      />
      {error ? <Text className="mt-1 font-ui text-meta text-danger">{error}</Text> : null}
    </View>
  );
};
