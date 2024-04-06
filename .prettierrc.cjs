const packageJson = require('./package.json');

const sortedPackages = Object.keys(packageJson.dependencies)
  .concat(Object.keys(packageJson.devDependencies))
  .sort()
  .map((p) => `^${p.replace('/', '\\/')}.*`)
  .join('|');

module.exports = {
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  singleQuote: true,
  endOfLine: 'lf',
  trailingComma: 'es5',
  tabWidth: 2,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  /**
   * Splitting between 4 groups:
   * - 3rd party imports
   * - local decorated paths
   * - relative imports from other folders
   * - relative imports from the same folder
   */
  importOrder: [
    sortedPackages,
    '',
    '^@[\\w-]+\\/(.*)$',
    '',
    '^((\\.\\.\\/)|(\\.\\/\\.\\.\\/)|(\\.\\.))',
    '',
    '^\\./',
  ],
  overrides: [
    {
      files: '**/*.html',
      options: {
        parser: 'angular',
      },
    },
    {
      files: '**/*.tsx',
      options: {
        importOrderParserPlugins: ['typescript', 'decorators-legacy', 'jsx'],
      },
    },
  ],
};
