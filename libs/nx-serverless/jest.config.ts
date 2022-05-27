/* eslint-disable */
export default {
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  // moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/nx-serverless',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  displayName: 'nx-serverless',
  testEnvironment: 'node',
};
