module.exports = {
  displayName: 'aws-cdk-stack-e2e',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/aws-cdk-stack-e2e',
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};
