module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  rules: {
    // Security-focused ESLint rules
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
    
    // Additional security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // React security rules
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    
    // Next.js security rules
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'error'
  },
  env: {
    browser: true,
    node: true,
    es6: true
  }
};