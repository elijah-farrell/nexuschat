import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                React: 'readonly',
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                navigator: 'readonly',
                Event: 'readonly',
                FileReader: 'readonly',
                FormData: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'error',
            'no-console': 'warn',
            'no-debugger': 'error'
        }
    }
]; 