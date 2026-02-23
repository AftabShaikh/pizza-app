---
agent: agent
description: Generate a WCAG 2.1 AA compliance testing suite using Playwright
---

## 🚨 CRITICAL REQUIREMENTS - READ FIRST

**This prompt contains MANDATORY requirements that CANNOT be skipped, modified, or simplified.** 

Pay special attention to:
- **Step 4: MANDATORY VALIDATION CHECKLIST** - These are non-negotiable requirements
- **REQUIRED TEST STRUCTURE TEMPLATE** - Must be followed exactly
- **Failure reporting specifications** - Every test must include comprehensive error details

**DO NOT PROCEED** with implementation unless you can guarantee compliance with all mandatory requirements.

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
  
## MANDATORY TEST CASE REQUIREMENTS (NON-NEGOTIABLE)

**Every single test case MUST include ALL of the following components or the implementation will be considered incomplete:**

1. **WCAG Criterion Reference** (REQUIRED)
   - Format: `X.X.X Criterion Name` (e.g., "1.1.1 Non-text Content")
   - Must be included in test name and description

2. **Test Description** (REQUIRED)
   - Clearly state what specific element/functionality is being tested
   - Example: "Testing alt text presence on all images"

3. **Pass/Fail Criteria** (REQUIRED)
   - Define exact conditions for pass/fail
   - Example: "PASS: All images have non-empty alt attributes. FAIL: Any image lacks alt text"

4. **Failure Reporting** (REQUIRED)
   - When a test fails, it MUST report:
     - Source file path where the issue was found
     - Line number (if applicable)
     - Specific failure reason
     - Actionable remediation suggestion

**VALIDATION REQUIREMENT**: After implementation, review that each test file contains all four components above.

## Step 3: Implement the Tests

- Implement the test plan from `wcagtesting.md` as Playwright test files under `WCAG-2.1-AA/tests/`
- Use `@axe-core/playwright` for automated accessibility scanning where applicable
- Tests must be parallelizable (no shared state between tests)
- Include a Playwright config scoped to this folder if needed

### REQUIRED TEST STRUCTURE TEMPLATE

Each test MUST follow this exact structure:

```javascript
test('1.1.1 Non-text Content - Images have appropriate alternative text', async ({ page }) => {
  // WCAG Criterion: 1.1.1 Non-text Content
  // Testing: All images have appropriate alt text
  // Pass Criteria: Every img element has a non-empty alt attribute
  // Fail Criteria: Any img element lacks alt text or has empty alt=""
  
  await page.goto('/your-page');
  
  const images = await page.locator('img').all();
  const failures = [];
  
  for (const [index, img] of images.entries()) {
    const alt = await img.getAttribute('alt');
    const src = await img.getAttribute('src');
    
    if (!alt || alt.trim() === '') {
      // FAILURE REPORTING (REQUIRED)
      const boundingBox = await img.boundingBox();
      failures.push({
        element: `img[src="${src}"]`,
        sourceFile: await page.url(), // or extract from DOM if possible
        position: `Element ${index + 1}`,
        reason: 'Image lacks alternative text',
        remediation: `Add meaningful alt attribute: <img src="${src}" alt="descriptive text here">`
      });
    }
  }
  
  // Report failures with required details
  if (failures.length > 0) {
    const errorReport = failures.map(f => 
      `❌ FAILURE in ${f.sourceFile} at ${f.position}
         Reason: ${f.reason}
         Element: ${f.element}
         Fix: ${f.remediation}`
    ).join('\n\n');
    
    throw new Error(`WCAG 1.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
  }
});
```

**ENFORCEMENT**: Every test must include the comment block with WCAG criterion, testing description, and pass/fail criteria. Every test must have comprehensive failure reporting as shown above.

## Step 4: MANDATORY VALIDATION CHECKLIST

Before considering the task complete, verify EVERY test meets these criteria:

### ✅ Required Checklist (Review each test file):

1. **WCAG Reference Check**
   - [ ] Test name includes WCAG criterion (e.g., "1.1.1 Non-text Content")
   - [ ] Comment block clearly states the WCAG criterion being tested

2. **Test Description Check**  
   - [ ] Comment block explains what specific functionality is being tested
   - [ ] Description is clear and actionable

3. **Pass/Fail Criteria Check**
   - [ ] Comment block defines exact pass conditions
   - [ ] Comment block defines exact fail conditions

4. **Failure Reporting Check**
   - [ ] Test captures source file/URL information
   - [ ] Test identifies specific failing elements
   - [ ] Test provides detailed failure reason
   - [ ] Test includes actionable remediation steps
   - [ ] Error messages are formatted for easy reading

### ❌ REJECTION CRITERIA
If ANY test lacks the above components, the implementation is INCOMPLETE and must be revised.

### 📋 FINAL DELIVERABLE VERIFICATION
After implementation, provide a summary showing:
- Total number of WCAG criteria covered
- Confirmation that each test includes all 4 mandatory components
- Sample of 2-3 test names demonstrating proper format

## Step 5: Execute Perceivable Category Tests

**SCOPE**: Run tests ONLY for WCAG "Perceivable" category (criteria 1.1.x, 1.2.x, 1.3.x, 1.4.x)

### Pre-execution Setup
1. **Check Dependencies**:
   - Verify `@playwright/test` and `@axe-core/playwright` are already installed in the project
   - Check `package.json` dependencies - DO NOT install if already present
   - Only install if dependencies are missing:
   ```bash
   # Only run if dependencies are missing
   npm install @playwright/test @axe-core/playwright
   ```

2. **Verify Playwright Configuration**:
   - Ensure `WCAG-2.1-AA/playwright.config.js` exists and is properly configured
   - Verify test directory paths point to `WCAG-2.1-AA/tests/`

### Test Execution Commands

**Execute Perceivable tests only:**
```bash
# Navigate to WCAG test directory
cd WCAG-2.1-AA

# Run only Perceivable category tests
npx playwright test tests/perceivable.spec.js --reporter=html

# Alternative: Run with specific grep pattern if tests are mixed
npx playwright test --grep "1\.[1-4]\..*" --reporter=html
```

### Required Execution Output

After running tests, provide:

1. **Test Results Summary**:
   - Total Perceivable tests executed
   - Number of passing tests
   - Number of failing tests
   - Execution time

2. **Failure Details** (if any):
   - Which specific WCAG criteria failed
   - Detailed failure reasons with file/line references
   - Suggested remediation steps

3. **HTML Report Location**:
   - Path to generated Playwright HTML report
   - Instructions for viewing detailed results

### Success Criteria
- [ ] All Perceivable category tests execute successfully
- [ ] Test failures (if any) include all required reporting components
- [ ] HTML report is generated and accessible
- [ ] Execution summary is provided with actionable next steps