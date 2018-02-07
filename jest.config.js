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
  ],
  coverageReporters: [
    'text',
    'text-summary'
  ],
  coverageThreshold: {
    global: {
      'branches': 70,
      'functions': 70,
      'lines': 70,
      'statements': 70
    }
  }
}