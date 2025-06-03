/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        babelConfig: true, // Instructs ts-jest to use babel.config.js
      },
    ],
  },
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts", // Exclude type definition files
    "!src/**/index.ts", // Exclude index files if they only export modules
    "!src/ai/ai-instance.ts", // Exclude specific files if needed
    // Add more exclusions if necessary, e.g., generated files, main app setup
    "!src/app/layout.tsx",
    "!src/app/page.tsx",
    "!src/components/ui/**", // Assuming UI components from a library like shadcn/ui might not need unit testing here
  ],
  // The minimum percentage of statement, branch, function, and line coverage for the project
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10, // -10 means "at least 10 uncovered statements are allowed"
  //   },
  // },
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "json",
    "text",
    "lcov",
    "clover"
  ],
};
