# 🔍 Accessibility Testing Guide

## 📋 Overview

This project includes comprehensive WCAG 2.1 AA accessibility testing using Playwright and axe-core. This guide shows you how to run accessibility tests, generate reports, and interpret the results.

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers
npm run test:install
```

### Run Basic Accessibility Test
```bash
# Quick accessibility check
npm run test:a11y:chromium
```

## 🧪 Available Test Commands

### Core Test Suites

| Command | Description | Output |
|---------|-------------|--------|
| `npm run test:a11y` | Run all accessibility tests across all browsers | Terminal + HTML |
| `npm run test:a11y:chromium` | Run tests in Chromium only | Terminal |
| `npm run test:a11y:firefox` | Run tests in Firefox only | Terminal |
| `npm run test:a11y:webkit` | Run tests in WebKit/Safari | Terminal |
| `npm run test:a11y:mobile` | Run tests on mobile devices | Terminal |

### Specific Test Files

| Command | Purpose | WCAG Coverage |
|---------|---------|---------------|
| `npx playwright test tests/accessibility/basic-wcag.spec.js` | Core WCAG 2.1 AA compliance | All principles |
| `npx playwright test tests/accessibility/wcag-unit-tests.spec.js` | Individual criterion tests | Specific criteria |
| `npx playwright test tests/accessibility/understandable.spec.js` | Understandable principle | 3.x criteria |
| `npx playwright test tests/accessibility/perceivable.spec.js` | Perceivable principle | 1.x criteria |
| `npx playwright test tests/accessibility/operable.spec.js` | Operable principle | 2.x criteria |
| `npx playwright test tests/accessibility/robust.spec.js` | Robust principle | 4.x criteria |

### Development Workflow

```bash
# Quick check during development
npx playwright test tests/accessibility/basic-wcag.spec.js --project chromium

# Run with live updates (headed mode)
npm run test:a11y:headed

# Run specific test by name
npx playwright test --grep "color contrast" --project chromium
```

## 📊 Generate Reports

### 1. HTML Report (Recommended)
```bash
# Generate interactive HTML report
npm run test:a11y -- --reporter=html

# Open the report automatically
npx playwright show-report
```

**Output Location**: `playwright-report/index.html`

### 2. Custom Accessibility Report
```bash
# Generate comprehensive accessibility report
npx playwright test tests/accessibility/basic-wcag.spec.js --reporter=html --project chromium
```

**Output Location**: `accessibility-report.html` (in project root)

### 3. JSON Report (for CI/CD)
```bash
# Generate machine-readable report
npm run test:a11y:ci
```

**Output Location**: `test-results/accessibility-results.json`

### 4. Multiple Report Formats
```bash
# Generate HTML + JSON + JUnit reports
npm run test:a11y -- --reporter=html,json,junit
```

## 🌐 Access Reports

### Method 1: Browser (Recommended)
```bash
# Generate and auto-open HTML report
npm run test:a11y -- --reporter=html
npx playwright show-report
```

### Method 2: Direct File Access
1. Navigate to project folder
2. Double-click `playwright-report/index.html`
3. View in your preferred browser

### Method 3: VS Code
1. Open `playwright-report/index.html` in VS Code
2. Right-click → "Open with Live Server" (if extension installed)
3. Or right-click → "Open with Default Application"

### Method 4: Command Line
```bash
# Windows
start playwright-report/index.html

# macOS
open playwright-report/index.html

# Linux
xdg-open playwright-report/index.html
```

## 📋 Understanding Test Results

### Compliance Scores
- **95-100%**: AAA Compliance (Excellent)
- **80-94%**: AA Compliance (Good)
- **60-79%**: A Compliance (Needs Work)
- **<60%**: Non-Compliant (Critical Issues)

### Test Categories
- **✅ Passed**: Criteria fully met
- **❌ Failed**: Violations found, needs fixing
- **⚠️ Incomplete**: Needs manual verification
- **➖ Not Applicable**: Criteria not relevant to current page

### Common Issues & Fixes

| Issue | WCAG Criterion | Quick Fix |
|-------|----------------|-----------|
| Missing alt text | 1.1.1 | Add `alt=""` for decorative or descriptive text for informative images |
| Poor color contrast | 1.4.3 | Use darker colors or ensure 4.5:1 contrast ratio |
| Missing skip links | 2.4.1 | Add `<a href="#main">Skip to main content</a>` |
| No page language | 3.1.1 | Add `lang="en"` to `<html>` element |
| Unlabeled inputs | 3.3.2 | Add `<label>` elements or `aria-label` attributes |

## 🔧 CI/CD Integration

### GitHub Actions
```yaml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:install
      - run: npm run test:a11y:ci
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: accessibility-report
          path: test-results/
```

### Pre-commit Hook
```bash
# Add to package.json scripts
"precommit": "npx playwright test tests/accessibility/basic-wcag.spec.js --project chromium"
```

## 📁 Project Structure

```
tests/
├── accessibility/
│   ├── basic-wcag.spec.js          # Core WCAG 2.1 AA tests
│   ├── wcag-unit-tests.spec.js     # Individual criterion tests
│   ├── understandable.spec.js      # Principle 3 tests
│   ├── perceivable.spec.js         # Principle 1 tests
│   ├── operable.spec.js           # Principle 2 tests
│   ├── robust.spec.js             # Principle 4 tests
│   ├── master-accessibility-suite.spec.js  # Comprehensive audit
│   └── test-config.js             # WCAG configuration
└── utils/
    └── accessibility-helpers.js    # Testing utilities

playwright-report/                  # HTML reports
test-results/                      # JSON/JUnit reports
accessibility-report.html          # Custom accessibility report
ACCESSIBILITY_REPORT.md            # Detailed assessment
```

## 🎯 Testing Checklist

### Before Running Tests
- [ ] Development server is running (`npm run dev`)
- [ ] All dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npm run test:install`)

### During Development
- [ ] Run quick accessibility check: `npm run test:a11y:chromium`
- [ ] Fix any critical issues (contrast, alt text, labels)
- [ ] Test keyboard navigation manually

### Before Deployment
- [ ] Run full accessibility suite: `npm run test:a11y`
- [ ] Generate HTML report: `npm run test:a11y -- --reporter=html`
- [ ] Review all violations and fix critical issues
- [ ] Ensure compliance score ≥ 80% for AA compliance

## 🆘 Troubleshooting

### Common Issues

**Test fails to start:**
```bash
# Reinstall Playwright browsers
npx playwright install --force
```

**Server not running:**
```bash
# Start development server first
npm run dev
# Then run tests in another terminal
npm run test:a11y
```

**Report not opening:**
```bash
# Check if report exists
ls playwright-report/
# Force regenerate
npm run test:a11y -- --reporter=html --force
```

### Getting Help
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Playwright Docs**: https://playwright.dev/docs/accessibility-testing
- **axe-core Rules**: https://github.com/dequelabs/axe-core/tree/develop/doc

## 📊 Current Status

**Last Test Results**: 88% WCAG 2.1 AA Compliance

**Key Issues to Fix**:
1. 🔴 ARIA grid structure needs correction
2. 🔴 Orange button color contrast (3.59:1 → 4.5:1 required)
3. ⚠️ Some incomplete items need manual verification

**Next Steps**:
1. Fix critical ARIA and contrast issues
2. Re-run tests to verify improvements
3. Implement automated testing in CI/CD pipeline

---

*For detailed assessment results, see [`ACCESSIBILITY_REPORT.md`](ACCESSIBILITY_REPORT.md)*