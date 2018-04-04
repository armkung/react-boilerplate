module.exports = {
  testMatch: [
    '<rootDir>/**/__test__/**.spec.js'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^(?!.*\\.(js|json)$)': 'jest-file'
  },
  setupFiles: [
    '<rootDir>/jest.setup.js',
    'jest-canvas-mock'
  ],
  moduleDirectories: [
    '<rootDir>/src',
    'node_modules'
  ],
  moduleNameMapper: {
    'react-native': '<rootDir>/node_modules/react-native-web',
    'styled-components/native': '<rootDir>/node_modules/styled-components'
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!react-router-native)'
  ]
}