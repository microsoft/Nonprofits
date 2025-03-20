/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
	preset: 'ts-jest',
	silent: true,
	globalSetup: './jest-setup.js',
	testEnvironment: 'jsdom',
	testEnvironmentOptions: {},
	setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
	coverageReporters: ['cobertura', 'clover', 'json', 'lcov'],
	collectCoverageFrom: [
		'src/**/*.js',
		'src/**/*.ts',
		'!src/types/',
		'!/node_modules/'
	]
};
