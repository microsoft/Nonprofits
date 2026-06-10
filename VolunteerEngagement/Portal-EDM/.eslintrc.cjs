module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
	],
	ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['react-refresh'],
	rules: {
		// Formatting rules handled by Prettier — disabled here to avoid conflicts.
		// Prettier config enforces: tabs, single quotes, semicolons.
		'indent': 'off',
		'quotes': 'off',
		'semi': 'off',

		// Allow any (aligned with monorepo copilot-instructions)
		'@typescript-eslint/no-explicit-any': 'off',

		// React Refresh
		'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

		// Unused vars: allow underscore-prefixed
		'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

		// Allow empty catch blocks (common in graceful fallback patterns)
		'no-empty': ['error', { allowEmptyCatch: true }],
	},
};
