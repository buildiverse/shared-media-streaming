import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
	js.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: typescriptParser,
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'no-unused-vars': 'off', // Let TypeScript handle this
			'no-console': 'warn',
			'no-undef': 'off', // TypeScript handles this
			'object-curly-newline': [
				'error',
				{
					ObjectExpression: { consistent: true, multiline: true },
					ObjectPattern: { consistent: true, multiline: true },
					ImportDeclaration: 'never',
					ExportDeclaration: { multiline: true, minProperties: 3 },
				},
			],
		},
	},
];
