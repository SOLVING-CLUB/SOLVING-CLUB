module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@core': './src/core',
          '@features': './src/features',
          '@shared': './src/shared',
          '@services': './src/services',
          '@types': './src/types',
        },
      },
    ],
  ],
};
