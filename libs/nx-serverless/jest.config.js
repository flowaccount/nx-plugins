module.exports = {
  name: 'nx-serverless',
  preset: '../../jest.config.js',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest'
  },
  // moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/nx-serverless',
  globals: {
    'ts-jest': {
      diagnostics: false,
      skipBabel: true
    },
    isolatedModules: true
  }
};
