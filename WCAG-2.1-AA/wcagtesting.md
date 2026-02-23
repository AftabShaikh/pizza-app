# WCAG 2.1 AA Accessibility Testing Plan

## 1. Executive Summary

### Purpose
This testing plan defines automated accessibility testing for the **Pizza Palace** web application against the [WCAG 2.1 Level AA](https://www.w3.org/TR/WCAG21/) success criteria. The goal is to identify and report accessibility barriers so they can be remediated, ensuring the application is usable by people with disabilities.

### Scope
The tests cover the following pages of the Pizza Palace Next.js application:
- **Home page** (`/`) — Hero section, category filters, pizza grid
- **Cart page** (`/cart`) — Cart items, order summary, checkout flow

All four WCAG principles are tested:
1. **Perceivable** — Content is available to the senses
2. **Operable** — Interface controls are usable
3. **Understandable** — Content and UI are comprehensible
4. **Robust** — Content works with assistive technologies

### Tools Used
| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev/) | Browser automation and E2E testing framework |
| [@axe-core/playwright](https://www.npmjs.com/package/@axe-core/playwright) | Automated WCAG accessibility scanning via axe-core engine |
| Custom DOM assertions | Manual checks for criteria that axe-core cannot fully automate |

---

## 2. Testing Approach

### Automated Testing with axe-core
- **axe-core** is integrated via `@axe-core/playwright` to run automated WCAG 2.1 AA scans on each page.
- axe-core detects violations for many WCAG criteria including color contrast, missing alt text, form labels, ARIA attributes, heading hierarchy, and more.
- Each axe-core scan is configured with `wcag2a` and `wcag2aa` tags to focus on Level A and AA criteria only.

### Manual DOM Assertions
For criteria that axe-core cannot fully verify (e.g., logical focus order, keyboard operability, meaningful sequence), Playwright DOM queries and keyboard simulation are used to:
- Tab through interactive elements and verify focus order
- Check for skip navigation links
- Verify that hover/focus content can be dismissed
- Ensure consistent navigation across pages
- Test viewport reflow at 320px width

### Test Organization
Tests are organized into four spec files matching the WCAG principle categories:
- `01-perceivable.spec.ts` — Criteria 1.1.x through 1.4.x
- `02-operable.spec.ts` — Criteria 2.1.x through 2.5.x
- `03-understandable.spec.ts` — Criteria 3.1.x through 3.3.x
- `04-robust.spec.ts` — Criteria 4.1.x

### Test Isolation & Parallelization
- Each test is fully independent with no shared state.
- Tests use `test.describe` blocks for logical grouping but do not depend on execution order.
- Playwright's built-in parallel execution is enabled.

### Failure Reporting Standard
Every test failure includes:
1. **Source file/URL** where the issue was found
2. **Element identification** (selector, position, or index)
3. **Specific failure reason** with WCAG criterion reference
4. **Actionable remediation suggestion**

---

## 3. Detailed Test Plan

### 3.1 Perceivable (File: `01-perceivable.spec.ts`)

| Test ID | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---------|---------------|------------------|---------------|---------------|
| P-01 | 1.1.1 Non-text Content | Verify all images have appropriate alt text | Every `<img>` has a non-empty `alt` attribute | Any image lacks alt text or has empty `alt=""` without being decorative |
| P-02 | 1.1.1 Non-text Content | Verify form buttons have descriptive values | All buttons have visible text or `aria-label` | Any button lacks accessible name |
| P-03 | 1.1.1 Non-text Content | Verify inputs have accessible names | All form inputs have associated labels or `aria-label` | Any input lacks accessible name |
| P-04 | 1.3.1 Info and Relationships | Verify semantic heading structure | Headings follow logical hierarchy (h1→h2→h3) without skipping levels | Heading levels are skipped or out of order |
| P-05 | 1.3.1 Info and Relationships | Verify landmark regions are present | Page has `main`, `nav`, and other appropriate landmarks | Missing required landmark regions |
| P-06 | 1.3.1 Info and Relationships | Verify form labels are associated with inputs | Every input has a programmatically associated label | Any input lacks label association |
| P-07 | 1.3.2 Meaningful Sequence | Verify DOM order matches visual order | Content reads logically when CSS is disabled | DOM order is illogical |
| P-08 | 1.3.5 Identify Input Purpose | Verify autocomplete attributes on user info inputs | Inputs collecting personal info have correct `autocomplete` values | Missing `autocomplete` on applicable inputs |
| P-09 | 1.4.1 Use of Color | Verify color is not sole method of conveying info | Information conveyed by color also uses text/icons/patterns | Color is the only distinguishing factor |
| P-10 | 1.4.3 Contrast (Minimum) | Verify text contrast ratios meet 4.5:1 minimum | All text meets contrast requirements via axe-core | Any text fails contrast ratio check |
| P-11 | 1.4.4 Resize Text | Verify page is functional at 200% zoom | No content overlap or loss of functionality at 200% | Content is clipped, overlapping, or non-functional |
| P-12 | 1.4.10 Reflow | Verify no horizontal scroll at 320px width | Content reflows without horizontal scrolling | Horizontal scrollbar appears at 320px |
| P-13 | 1.4.11 Non-text Contrast | Verify UI component contrast ratios | Buttons, form controls, and icons have ≥3:1 contrast | Any UI component fails contrast check |
| P-14 | 1.4.12 Text Spacing | Verify content survives increased text spacing | No content loss when text spacing is increased per WCAG | Content is clipped or overlapping |
| P-15 | 1.4.13 Content on Hover/Focus | Verify hover/focus content is dismissible | Tooltips/dropdowns can be dismissed and persist on hover | Content disappears unexpectedly or cannot be dismissed |
| P-16 | 1.1.1 Non-text Content | Run axe-core full perceivable scan | Zero axe-core violations for perceivable rules | Any axe-core violation detected |

### 3.2 Operable (File: `02-operable.spec.ts`)

| Test ID | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---------|---------------|------------------|---------------|---------------|
| O-01 | 2.1.1 Keyboard | Verify all interactive elements are keyboard accessible | Every button, link, and control is reachable via Tab and activatable via Enter/Space | Any interactive element is not keyboard accessible |
| O-02 | 2.1.2 No Keyboard Trap | Verify no keyboard traps exist | Tab moves through and out of all page sections | Focus gets stuck in any component |
| O-03 | 2.4.1 Bypass Blocks | Verify skip navigation link exists | A "Skip to content" link is present and functional | No skip navigation mechanism exists |
| O-04 | 2.4.2 Page Titled | Verify each page has a descriptive title | `<title>` is present and descriptive | Page title is missing or generic |
| O-05 | 2.4.3 Focus Order | Verify focus order is logical | Tab order follows visual layout logically | Focus jumps to unexpected locations |
| O-06 | 2.4.4 Link Purpose (In Context) | Verify link text is descriptive | Links have descriptive text or `aria-label` | Any link has ambiguous text like "click here" |
| O-07 | 2.4.5 Multiple Ways | Verify multiple navigation methods exist | At least two navigation mechanisms are available | Only one way to find pages |
| O-08 | 2.4.6 Headings and Labels | Verify headings and labels are informative | Headings and labels clearly describe their sections/controls | Any heading/label is vague or missing |
| O-09 | 2.4.7 Focus Visible | Verify visible focus indicators exist | All focusable elements show a visible focus ring/outline | Any element lacks visible focus indication |
| O-10 | 2.5.3 Label in Name | Verify accessible names include visible text | Accessible name contains the visible text label | Accessible name differs from visible text |
| O-11 | 2.5.8 Target Size (Minimum) | Verify interactive targets are at least 24x24px | All clickable targets meet minimum size or have adequate spacing | Any target is too small without exceptions |
| O-12 | 2.1.1 Keyboard | Run axe-core operable scan | Zero axe-core violations for operable rules | Any axe-core violation detected |

### 3.3 Understandable (File: `03-understandable.spec.ts`)

| Test ID | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---------|---------------|------------------|---------------|---------------|
| U-01 | 3.1.1 Language of Page | Verify `<html>` has a `lang` attribute | `lang` attribute is present and valid | Missing or invalid `lang` attribute |
| U-02 | 3.1.2 Language of Parts | Verify content in other languages has `lang` | Foreign-language content has appropriate `lang` attribute | Foreign content missing `lang` attribute |
| U-03 | 3.2.1 On Focus | Verify no unexpected changes on focus | Focusing any element does not cause context changes | Focus triggers page navigation or popup |
| U-04 | 3.2.2 On Input | Verify no unexpected changes on input | Interacting with controls does not cause unexpected changes | Input triggers unexpected navigation/popup |
| U-05 | 3.2.3 Consistent Navigation | Verify navigation is consistent across pages | Nav links appear in same order on all pages | Navigation order changes between pages |
| U-06 | 3.2.4 Consistent Identification | Verify consistent component identification | Same-function elements use same labels/icons | Same function has different labels across pages |
| U-07 | 3.3.1 Error Identification | Verify form errors are identified | Errors are clearly described in text | Errors are only indicated by color |
| U-08 | 3.3.2 Labels or Instructions | Verify form inputs have labels/instructions | All inputs have visible labels or instructions | Any input lacks guidance |
| U-09 | 3.1.1 Language of Page | Run axe-core understandable scan | Zero axe-core violations for understandable rules | Any axe-core violation detected |

### 3.4 Robust (File: `04-robust.spec.ts`)

| Test ID | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---------|---------------|------------------|---------------|---------------|
| R-01 | 4.1.2 Name, Role, Value | Verify ARIA attributes are valid | All ARIA roles, states, and properties are valid | Invalid or misused ARIA attributes |
| R-02 | 4.1.2 Name, Role, Value | Verify custom controls have proper roles | Custom UI components have appropriate ARIA roles | Custom components lack semantic meaning |
| R-03 | 4.1.2 Name, Role, Value | Verify all interactive elements have accessible names | Every interactive element has a computed accessible name | Any interactive element lacks a name |
| R-04 | 4.1.3 Status Messages | Verify status messages use ARIA live regions | Dynamic status updates use `role="alert"` or `aria-live` | Status changes are not announced |
| R-05 | 4.1.2 Name, Role, Value | Run axe-core robust scan | Zero axe-core violations for robust rules | Any axe-core violation detected |

---

## 4. Test Execution

### Running All Tests
```bash
npx playwright test WCAG-2.1-AA/tests/ --reporter=html
```

### Running by Category
```bash
# Perceivable only
npx playwright test WCAG-2.1-AA/tests/01-perceivable.spec.ts

# Operable only
npx playwright test WCAG-2.1-AA/tests/02-operable.spec.ts

# Understandable only
npx playwright test WCAG-2.1-AA/tests/03-understandable.spec.ts

# Robust only
npx playwright test WCAG-2.1-AA/tests/04-robust.spec.ts
```

### HTML Report
After execution, view the detailed report:
```bash
npx playwright show-report
```
