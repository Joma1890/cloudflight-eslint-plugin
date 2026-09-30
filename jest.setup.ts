// GitHub Actions sets CI=true, which makes typescript-eslint treat the process as a one-shot CLI run.
// The specs lint the same fixture with several ESLint instances in one process; in that mode the second
// parse of a file with parserOptions.project gets an isolated program without type information, because
// typescript-estree assumes an autofix cycle. Turn the inference off for the test processes.
process.env['TSESTREE_SINGLE_RUN'] = 'false';
