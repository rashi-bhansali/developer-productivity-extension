module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/performance/',
  ],
};
