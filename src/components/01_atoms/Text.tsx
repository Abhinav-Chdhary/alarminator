import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface Props extends RNTextProps {
  variant?: keyof typeof theme.typography;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Text: React.FC<Props> = ({ 
  variant = 'body', 
  color = theme.colors.onBackground, 
  align = 'auto',
  style, 
  children, 
  ...rest 
}) => {
  return (
    <RNText 
      style={[
        theme.typography[variant] as import('react-native').TextStyle, 
        { color, textAlign: align }, 
        style
      ]} 
      {...rest}
    >
      {children}
    </RNText>
  );
};
