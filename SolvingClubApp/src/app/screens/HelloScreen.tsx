import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useColors} from '../../core/theme/colors';
import {Text} from '../../shared/components';

/**
 * Hello Screen - Simple page with Hello World
 */
const HelloScreen: React.FC = () => {
  const colors = useColors();
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Text variant="h1" center>
        Hello World
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HelloScreen;

