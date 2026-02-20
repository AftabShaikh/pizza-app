---
agent: agent
description: Generate a WCAG 2.1 AA compliance testing suite using Playwright
---

## Step 1: Gather the WCAG 2.1 AA Checklist

- Fetch the WCAG 2.1 AA checklist from https://webaim.org/standards/wcag/checklist
- Save it as a Markdown file at `WCAG-2.1-AA/checklist.md`
- Preserve the original grouping structure (Perceivable, Operable, Understandable, Robust)
- If the URL is unreachable, ask me to provide the checklist content

## Step 2: Build the Testing Plan

- Create `WCAG-2.1-AA/wcagtesting.md` with the following sections:
  1. **Executive Summary** — purpose, scope, and tools used
  2. **Testing Approach** — how Playwright will be used to automate WCAG checks (e.g., axe-core integration, manual DOM assertions)
  3. **Detailed Test Plan** — individual test cases grouped by WCAG checklist category (Perceivable, Operable, Understandable, Robust)
- Each test case must include:
  - WCAG criterion reference (e.g., 1.1.1 Non-text Content)
  - What is being tested
  - Pass/fail criteria
- On failure, tests must report: source file, line number, failure reason, and suggested remediation

## Step 3: Implement the Tests

- Implement the test plan from `wcagtesting.md` as Playwright test files under `WCAG-2.1-AA/tests/`
- Use `@axe-core/playwright` for automated accessibility scanning where applicable
- Tests must be parallelizable (no shared state between tests)
- Include a Playwright config scoped to this folder if needed