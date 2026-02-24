# WCAG 2.1 AA Accessibility Testing Plan

## 1. Executive Summary

### Purpose
This testing plan defines a comprehensive automated accessibility testing strategy for the **Pizza Palace** web application. The goal is to verify compliance with WCAG 2.1 Level AA success criteria using automated testing tools integrated into the development workflow.

### Scope
The tests cover all publicly accessible pages of the Pizza Palace application:
- **Home page** (`/`) — Pizza menu listing, category filters, hero section
- **Cart page** (`/cart`) — Shopping cart with item management and order summary

All WCAG 2.1 Level A and Level AA success criteria are addressed across four categories: **Perceivable**, **Operable**, **Understandable**, and **Robust**.

### Tools Used
| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev/) | Browser automation and end-to-end testing |
| [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) | Automated WCAG accessibility rule evaluation |
| Custom DOM assertions | Manual checks for criteria not covered by axe-core |

---

## 2. Testing Approach

### Automated Testing with Playwright + axe-core
- **axe-core integration**: Each test page is scanned using `@axe-core/playwright`'s `AxeBuilder` to detect violations of WCAG 2.1 A/AA rules. axe-core covers ~57% of WCAG criteria automatically.
- **Custom DOM assertions**: Criteria that axe-core cannot fully test (e.g., reading order, hover/focus content behavior, reflow) are validated through manual Playwright DOM queries, attribute checks, and interaction simulations.
- **Failure reporting**: Every test captures detailed failure information including the page URL, failing element selectors, specific violation reasons, and actionable remediation suggestions.

### Test Organization
Tests are organized into four spec files matching the WCAG principle categories:
1. `01-perceivable.spec.ts` — Criteria 1.x.x
2. `02-operable.spec.ts` — Criteria 2.x.x
3. `03-understandable.spec.ts` — Criteria 3.x.x
4. `04-robust.spec.ts` — Criteria 4.x.x

### Parallelization
- All tests are stateless and parallelizable (no shared state between test files or individual tests).
- Each test navigates to the required page independently.

### Configuration
- A dedicated `playwright.config.ts` is scoped to the `WCAG-2.1-AA/tests/` directory.
- The dev server is started automatically before tests run via Playwright's `webServer` configuration.

---

## 3. Detailed Test Plan

### 3.1 Perceivable (Criteria 1.x.x)

| # | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---|---------------|------------------|---------------|---------------|
| P1 | 1.1.1 Non-text Content | All images have appropriate alternative text | Every `<img>` has a non-empty `alt` attribute (or `alt=""` for decorative) | Any `<img>` lacks `alt` attribute |
| P2 | 1.1.1 Non-text Content | Form inputs have accessible names | Every form input has an associated label, `aria-label`, or `aria-labelledby` | Any input lacks an accessible name |
| P3 | 1.1.1 Non-text Content | Buttons have accessible names | Every `<button>` has discernible text, `aria-label`, or `aria-labelledby` | Any button has no accessible name |
| P4 | 1.3.1 Info and Relationships | Semantic heading structure is valid | Headings are properly nested (no skipped levels), at least one `<h1>` exists | Heading levels are skipped or missing |
| P5 | 1.3.1 Info and Relationships | Landmark regions are present | Page uses `<main>`, `<nav>`, or ARIA landmark roles | No landmarks defined |
| P6 | 1.3.1 Info and Relationships | Form labels are properly associated | Every form control has a programmatic label association | Form controls lack labels |
| P7 | 1.3.2 Meaningful Sequence | DOM order matches visual presentation | Content in DOM flows logically top-to-bottom, left-to-right | DOM order contradicts visual layout |
| P8 | 1.3.4 Orientation | No orientation lock is present | No CSS or meta restricts viewport orientation | `orientation` is locked via CSS or meta |
| P9 | 1.3.5 Identify Input Purpose | Inputs have autocomplete attributes | User-info inputs (name, email, phone, address) have correct `autocomplete` values | Inputs collecting user data lack `autocomplete` |
| P10 | 1.4.1 Use of Color | Color is not sole conveyor of information | Interactive elements have non-color differentiation (underline, icon, border) | Information conveyed only by color |
| P11 | 1.4.3 Contrast (Minimum) | Text has sufficient contrast ratio | All text meets 4.5:1 ratio (3:1 for large text) | Any text fails minimum contrast |
| P12 | 1.4.4 Resize Text | Page is functional at 200% zoom | No content is clipped or lost at 200% zoom, page remains operable | Content overflows or is hidden at 200% zoom |
| P13 | 1.4.5 Images of Text | Text is not rendered as images | No `<img>` elements contain text that could be rendered as HTML text | Images used to display readable text |
| P14 | 1.4.10 Reflow | Content reflows at 320px width | No horizontal scrollbar at 320px viewport width | Horizontal scrolling required at 320px |
| P15 | 1.4.11 Non-text Contrast | UI components have sufficient contrast | Interactive components and their states have ≥3:1 contrast | Buttons, icons, or form controls lack contrast |
| P16 | 1.4.12 Text Spacing | Content intact with modified text spacing | No overflow or clipping when line-height, letter-spacing, word-spacing are increased | Text is clipped or containers overflow |
| P17 | 1.4.13 Content on Hover/Focus | Hover/focus content is dismissible | Tooltips/popovers can be dismissed via Esc, persist on pointer hover | Hover content cannot be dismissed or vanishes |
| P18 | axe-core Full Scan | Comprehensive axe-core perceivable scan | Zero axe-core violations for perceivable WCAG rules | Any axe-core perceivable violation detected |

### 3.2 Operable (Criteria 2.x.x)

| # | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---|---------------|------------------|---------------|---------------|
| O1 | 2.1.1 Keyboard | All interactive elements are keyboard accessible | Every button, link, and control is reachable and activatable via Tab/Enter/Space | Any interactive element cannot receive keyboard focus |
| O2 | 2.1.2 No Keyboard Trap | No keyboard traps exist | Tab key moves focus forward through all elements; Shift+Tab moves backward; focus never gets stuck | Focus becomes trapped in any element |
| O3 | 2.2.1 Timing Adjustable | No unexpected timeouts | No session/content timeouts without user notification | Content disappears or session expires without warning |
| O4 | 2.3.1 Three Flashes | No content flashes excessively | No elements use CSS animations that flash >3 times/second | Flashing content detected |
| O5 | 2.4.1 Bypass Blocks | Skip navigation link is present | A "Skip to main content" link exists and is visible on focus | No skip-nav link found |
| O6 | 2.4.2 Page Titled | Pages have descriptive titles | Every page has a non-empty, descriptive `<title>` | Page title is missing or generic (e.g., "Untitled") |
| O7 | 2.4.3 Focus Order | Focus order is logical | Tab order follows visual reading order | Focus jumps to unrelated elements out of sequence |
| O8 | 2.4.4 Link Purpose | Links have descriptive text | No links with generic text like "click here" or "read more" without context | Links have ambiguous purpose |
| O9 | 2.4.5 Multiple Ways | Multiple navigation methods exist | Site provides at least 2 ways to find pages (nav menu, links, etc.) | Only one navigation method available |
| O10 | 2.4.6 Headings and Labels | Headings and labels are informative | All headings and form labels are descriptive and non-empty | Empty or ambiguous headings/labels found |
| O11 | 2.4.7 Focus Visible | Focus indicators are visible | All focusable elements show a visible outline/ring on `:focus` | Any focusable element lacks visible focus indicator |
| O12 | 2.5.3 Label in Name | Visible label matches accessible name | Button/link visible text is contained in the accessible name | Accessible name doesn't include visible text |
| O13 | 2.5.8 Target Size | Touch targets meet minimum size | All interactive targets are at least 24×24 pixels | Any target is smaller than 24×24 pixels |
| O14 | axe-core Full Scan | Comprehensive axe-core operable scan | Zero axe-core violations for operable WCAG rules | Any axe-core operable violation detected |

### 3.3 Understandable (Criteria 3.x.x)

| # | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---|---------------|------------------|---------------|---------------|
| U1 | 3.1.1 Language of Page | Page language is defined | `<html>` has a valid `lang` attribute | `lang` attribute is missing or empty |
| U2 | 3.1.2 Language of Parts | Content parts in other languages are marked | Elements in a different language have appropriate `lang` attributes | Foreign language text lacks `lang` attribute |
| U3 | 3.2.1 On Focus | Focus does not trigger context changes | Tabbing to an element does not cause navigation, popup, or form submission | Focus causes unexpected page changes |
| U4 | 3.2.2 On Input | Input does not trigger unexpected changes | Changing a form control doesn't cause navigation without prior warning | Selecting a dropdown option causes unexpected navigation |
| U5 | 3.2.3 Consistent Navigation | Navigation is consistent across pages | Nav links appear in the same order on home and cart pages | Navigation order differs between pages |
| U6 | 3.2.4 Consistent Identification | Elements are consistently identified | Same-function elements have consistent labels across pages | Same functionality has different labels on different pages |
| U7 | 3.3.1 Error Identification | Form errors are clearly identified | Error messages identify the field and describe the error | Errors are vague or not associated with specific fields |
| U8 | 3.3.2 Labels or Instructions | Form inputs have clear labels | All form inputs have visible labels or instructions | Inputs rely only on placeholder text for labels |
| U9 | 3.3.3 Error Suggestion | Error suggestions are provided | When input errors are detected, suggestions for correction are offered | Error messages don't suggest corrections |
| U10 | axe-core Full Scan | Comprehensive axe-core understandable scan | Zero axe-core violations for understandable WCAG rules | Any axe-core understandable violation detected |

### 3.4 Robust (Criteria 4.x.x)

| # | WCAG Criterion | Test Description | Pass Criteria | Fail Criteria |
|---|---------------|------------------|---------------|---------------|
| R1 | 4.1.2 Name, Role, Value | Custom controls have ARIA roles | Custom interactive elements have appropriate ARIA roles and states | Custom controls lack roles or states |
| R2 | 4.1.2 Name, Role, Value | ARIA attributes are valid | All ARIA attributes used are valid per WAI-ARIA spec | Invalid or misspelled ARIA attributes found |
| R3 | 4.1.2 Name, Role, Value | Required ARIA properties are present | Elements with ARIA roles include all required properties | Required ARIA properties are missing |
| R4 | 4.1.3 Status Messages | Status messages use ARIA live regions | Dynamic status messages (cart updates, errors) use `role="alert"` or `aria-live` | Status messages are not announced to screen readers |
| R5 | 4.1.2 Name, Role, Value | HTML is valid and well-formed | No duplicate IDs, all IDs are unique, elements are properly nested | Duplicate IDs or malformed HTML found |
| R6 | axe-core Full Scan | Comprehensive axe-core robust scan | Zero axe-core violations for robust WCAG rules | Any axe-core robust violation detected |

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

### Viewing Reports
```bash
npx playwright show-report
```
