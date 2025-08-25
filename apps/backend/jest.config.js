const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: 'node',
	transform: {
		...tsJestTransformCfg,
	},
	testMatch: ['**/?(*.)+(tests).[tj]s'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	roots: ['<rootDir>/tests', '<rootDir>/src'],
	modulePaths: ['<rootDir>'],
	// Performance optimizations
	maxWorkers: '50%',
	workerIdleMemoryLimit: '512MB',
	// Force exit to handle any lingering async operations
	detectOpenHandles: false,
	forceExit: true,
	// Skip slow operations
	collectCoverage: false,
	verbose: false,
};
