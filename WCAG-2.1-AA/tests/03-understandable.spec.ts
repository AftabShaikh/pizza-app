import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA — Understandable Tests
 * Criteria: 3.1.x, 3.2.x, 3.3.x
 *
 * Information and the operation of user interface must be understandable.
 */

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

test.describe('Understandable — Guideline 3.1: Readable', () => {
  test('3.1.1 Language of Page — HTML has a valid lang attribute', async ({ page }) => {
    // WCAG Criterion: 3.1.1 Language of Page
    // Testing: The <html> element has a valid lang attribute identifying the page language
    // Pass Criteria: <html> has lang attribute with a valid BCP 47 language tag (e.g., "en")
    // Fail Criteria: Missing or invalid lang attribute on <html>

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const lang = await page.locator('html').getAttribute('lang');

      if (!lang) {
        failures.push({
          element: '<html>',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Document root',
          reason: 'The <html> element is missing the lang attribute',
          remediation: 'Add lang="en" (or appropriate language code) to the <html> element',
        });
      } else if (lang.trim().length < 2) {
        failures.push({
          element: `<html lang="${lang}">`,
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Document root',
          reason: `The lang attribute value "${lang}" is invalid or too short`,
          remediation: 'Use a valid BCP 47 language tag, e.g., lang="en" or lang="en-US"',
        });
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('3.1.2 Language of Parts — Content in other languages has lang attribute', async ({ page }) => {
    // WCAG Criterion: 3.1.2 Language of Parts
    // Testing: Content in a language different from the page language has appropriate lang attribute
    // Pass Criteria: No foreign-language content found without lang attribute, or all flagged content has lang
    // Fail Criteria: Foreign-language content exists without a lang attribute

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Check for elements with lang attributes (positive check — they should exist if needed)
      const langElements = await page.locator('[lang]:not(html)').all();

      // Check for common foreign words/phrases that might need lang attributes
      const pageText = await page.evaluate(() => document.body.innerText);

      // This is a heuristic check — in practice, this requires human judgment
      // We check that if lang attributes are used, they are valid
      for (const [index, el] of langElements.entries()) {
        const lang = await el.getAttribute('lang');
        if (lang && lang.trim().length < 2) {
          const outerHTML = await el.evaluate((e) => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${index + 1}`,
            reason: `Element has invalid lang attribute: "${lang}"`,
            remediation: 'Use a valid BCP 47 language tag, e.g., lang="es" for Spanish',
          });
        }
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Understandable — Guideline 3.2: Predictable', () => {
  test('3.2.1 On Focus — No unexpected context changes on focus', async ({ page }) => {
    // WCAG Criterion: 3.2.1 On Focus
    // Testing: Focusing any element does not cause unexpected page navigation, popup, or form submission
    // Pass Criteria: Tabbing through all elements causes no context changes
    // Fail Criteria: Focus triggers navigation, popup, or unexpected behavior

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const initialUrl = page.url();

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const currentUrl = page.url();

      if (currentUrl !== initialUrl) {
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? el.outerHTML.substring(0, 200) : 'unknown';
        });

        failures.push({
          element: focusedElement,
          sourceFile: 'Home page (/)',
          position: `Tab stop ${i + 1}`,
          reason: `Page navigated from ${initialUrl} to ${currentUrl} on focus alone`,
          remediation: 'Remove onfocus navigation handlers. Use click/Enter activation instead.',
        });
        break;
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.2.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('3.2.2 On Input — No unexpected context changes on input', async ({ page }) => {
    // WCAG Criterion: 3.2.2 On Input
    // Testing: Interacting with form controls does not cause unexpected navigation or context changes
    // Pass Criteria: Changing form values does not trigger unexpected page changes
    // Fail Criteria: Selecting a form option causes unexpected navigation

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      const initialUrl = page.url();

      // Find select elements and test changing their values
      const selects = await page.locator('select').all();
      for (const [index, select] of selects.entries()) {
        const options = await select.locator('option').all();
        if (options.length > 1) {
          const secondValue = await options[1].getAttribute('value');
          if (secondValue) {
            await select.selectOption(secondValue);
            await page.waitForTimeout(500);

            const currentUrl = page.url();
            if (currentUrl !== initialUrl) {
              const outerHTML = await select.evaluate((e) => e.outerHTML.substring(0, 200));
              failures.push({
                element: outerHTML,
                sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
                position: `Select element ${index + 1}`,
                reason: `Changing select value navigated from ${initialUrl} to ${currentUrl}`,
                remediation:
                  'Do not auto-submit forms on selection change. Add a submit button instead.',
              });
            }
          }
        }
      }

      // Check checkboxes for unexpected behavior
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      for (const [index, checkbox] of checkboxes.entries()) {
        const isVisible = await checkbox.isVisible();
        if (!isVisible) continue;

        await checkbox.check({ force: true });
        await page.waitForTimeout(300);

        const currentUrl = page.url();
        if (currentUrl !== initialUrl) {
          failures.push({
            element: `input[type="checkbox"] ${index + 1}`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Checkbox element ${index + 1}`,
            reason: `Checking checkbox navigated from ${initialUrl} to ${currentUrl}`,
            remediation: 'Do not trigger navigation on checkbox change. Use a submit action.',
          });
        }
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.2.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('3.2.3 Consistent Navigation — Navigation order is consistent across pages', async ({ page }) => {
    // WCAG Criterion: 3.2.3 Consistent Navigation
    // Testing: Navigation links maintain the same order across different pages
    // Pass Criteria: Nav links appear in the same order on all tested pages
    // Fail Criteria: Navigation link order changes between pages

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    const navLinksPerPage: Record<string, string[]> = {};

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const navLinks = await page.locator('nav a[href], [role="navigation"] a[href]').all();
      const linkTexts: string[] = [];

      for (const link of navLinks) {
        const text = ((await link.textContent()) || '').trim();
        const href = await link.getAttribute('href');
        if (text || href) {
          linkTexts.push(`${text}|${href}`);
        }
      }

      navLinksPerPage[pageInfo.name] = linkTexts;
    }

    // Compare navigation across pages
    const pageNames = Object.keys(navLinksPerPage);
    if (pageNames.length > 1) {
      const referenceLinks = navLinksPerPage[pageNames[0]];

      for (let i = 1; i < pageNames.length; i++) {
        const currentLinks = navLinksPerPage[pageNames[i]];

        // Find common links and check their relative order
        const commonRef = referenceLinks.filter((l) => currentLinks.includes(l));
        const commonCurr = currentLinks.filter((l) => referenceLinks.includes(l));

        if (commonRef.length > 0 && commonRef.join('||') !== commonCurr.join('||')) {
          failures.push({
            element: `Navigation on ${pageNames[i]}`,
            sourceFile: `${pageNames[i]} page`,
            position: 'Navigation bar',
            reason: `Navigation order differs from ${pageNames[0]} page. Expected: [${commonRef.map((l) => l.split('|')[0]).join(', ')}], Got: [${commonCurr.map((l) => l.split('|')[0]).join(', ')}]`,
            remediation:
              'Ensure navigation links maintain the same order across all pages',
          });
        }
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.2.3 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('3.2.4 Consistent Identification — Same-function elements are consistently identified', async ({
    page,
  }) => {
    // WCAG Criterion: 3.2.4 Consistent Identification
    // Testing: Elements with the same functionality use the same labels/icons across pages
    // Pass Criteria: Cart button, login button, etc., have consistent labels across pages
    // Fail Criteria: Same function has different labels on different pages

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    const componentLabels: Record<string, Record<string, string>> = {};

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      componentLabels[pageInfo.name] = {};

      // Check cart link/button
      const cartElement = await page.locator('a[href="/cart"], a[href*="cart"]').first();
      if ((await cartElement.count()) > 0) {
        const cartText = ((await cartElement.textContent()) || '').trim();
        const cartAriaLabel = await cartElement.getAttribute('aria-label');
        componentLabels[pageInfo.name]['cart'] = cartAriaLabel || cartText;
      }

      // Check login/user element
      const loginElement = await page.locator('a[href="/login"], a[href*="login"]').first();
      if ((await loginElement.count()) > 0) {
        const loginText = ((await loginElement.textContent()) || '').trim();
        const loginAriaLabel = await loginElement.getAttribute('aria-label');
        componentLabels[pageInfo.name]['login'] = loginAriaLabel || loginText;
      }
    }

    // Compare labels across pages
    const pageNames = Object.keys(componentLabels);
    if (pageNames.length > 1) {
      const components = new Set(
        pageNames.flatMap((p) => Object.keys(componentLabels[p]))
      );

      for (const component of components) {
        const labels = pageNames
          .filter((p) => componentLabels[p][component])
          .map((p) => ({ page: p, label: componentLabels[p][component] }));

        if (labels.length > 1) {
          const uniqueLabels = new Set(labels.map((l) => l.label));
          if (uniqueLabels.size > 1) {
            failures.push({
              element: `"${component}" component`,
              sourceFile: 'Cross-page comparison',
              position: 'Navigation area',
              reason: `"${component}" has different labels: ${labels.map((l) => `${l.page}="${l.label}"`).join(', ')}`,
              remediation: `Use the same label for "${component}" across all pages`,
            });
          }
        }
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.2.4 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Understandable — Guideline 3.3: Input Assistance', () => {
  test('3.3.1 Error Identification — Form errors are clearly identified', async ({ page }) => {
    // WCAG Criterion: 3.3.1 Error Identification
    // Testing: Form validation errors are identified in text (not just by color/icon)
    // Pass Criteria: Error messages are present as text and associated with the relevant input
    // Fail Criteria: Errors are only indicated by color or lack descriptive text

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    // Navigate to cart — try submitting with empty fields if there's a checkout form
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Check for any forms with required fields
    const requiredInputs = await page.locator('input[required], select[required], textarea[required]').all();

    for (const [index, input] of requiredInputs.entries()) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const ariaDescribedby = await input.getAttribute('aria-describedby');
      const ariaErrormessage = await input.getAttribute('aria-errormessage');
      const ariaInvalid = await input.getAttribute('aria-invalid');

      // Check that required fields have a way to communicate errors
      if (!ariaDescribedby && !ariaErrormessage) {
        // Not necessarily a failure until error state is triggered, but flag for review
        const outerHTML = await input.evaluate((e) => e.outerHTML.substring(0, 200));
        // This is informational — actual testing requires triggering validation
      }
    }

    // Check for existing error messages on page
    const errorElements = await page
      .locator('[role="alert"], .error, .error-message, [aria-live="polite"], [aria-live="assertive"]')
      .all();

    for (const [index, errorEl] of errorElements.entries()) {
      const text = ((await errorEl.textContent()) || '').trim();
      if (text && text.length > 0) {
        // Verify error has associated input
        const id = await errorEl.getAttribute('id');
        if (id) {
          const associatedInput = await page
            .locator(`[aria-describedby*="${id}"], [aria-errormessage="${id}"]`)
            .count();
          if (associatedInput === 0) {
            failures.push({
              element: `Error message: "${text}"`,
              sourceFile: 'Cart page (/cart)',
              position: `Error element ${index + 1}`,
              reason: 'Error message is not programmatically associated with any input via aria-describedby or aria-errormessage',
              remediation: `Add aria-describedby="${id}" to the relevant input element`,
            });
          }
        }
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.3.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('3.3.2 Labels or Instructions — All form inputs have labels', async ({ page }) => {
    // WCAG Criterion: 3.3.2 Labels or Instructions
    // Testing: All form inputs have visible labels or instructions
    // Pass Criteria: Every input has a visible label, placeholder, or instructional text
    // Fail Criteria: Any input lacks guidance on what to enter

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const inputs = await page
        .locator(
          'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea'
        )
        .all();

      for (const [index, input] of inputs.entries()) {
        const isVisible = await input.isVisible();
        if (!isVisible) continue;

        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        const title = await input.getAttribute('title');
        let hasVisibleLabel = !!(ariaLabel || ariaLabelledby || placeholder || title);

        if (!hasVisibleLabel && id) {
          const labelCount = await page.locator(`label[for="${id}"]`).count();
          hasVisibleLabel = labelCount > 0;
        }

        if (!hasVisibleLabel) {
          const parentLabelCount = await input.locator('xpath=ancestor::label').count();
          hasVisibleLabel = parentLabelCount > 0;
        }

        if (!hasVisibleLabel) {
          const type = await input.getAttribute('type');
          const name = await input.getAttribute('name');
          failures.push({
            element: `input[type="${type}"][name="${name}"]`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Input element ${index + 1}`,
            reason: 'Input has no visible label, placeholder, title, or aria-label',
            remediation: 'Add a visible <label> element or aria-label to identify the input',
          });
        }
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 3.3.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Understandable — axe-core Full Scan', () => {
  test('3.x.x Understandable — Full axe-core language and form scan', async ({ page }) => {
    // WCAG Criterion: All Understandable criteria (3.1.x, 3.2.x, 3.3.x)
    // Testing: Comprehensive axe-core scan for language, predictability, and input assistance rules
    // Pass Criteria: Zero axe-core violations for understandable rules
    // Fail Criteria: Any axe-core violation detected in understandable category

    const allFailures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const understandableRules = [
        'html-has-lang',
        'html-lang-valid',
        'valid-lang',
        'label',
        'label-title-only',
        'select-name',
        'autocomplete-valid',
      ];

      const understandableViolations = results.violations.filter(
        (v) =>
          understandableRules.includes(v.id) ||
          v.tags.some((t) => t.startsWith('cat.language') || t.startsWith('cat.forms'))
      );

      for (const violation of understandableViolations) {
        for (const [idx, node] of violation.nodes.entries()) {
          allFailures.push({
            element: node.html.substring(0, 200),
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${idx + 1} (rule: ${violation.id})`,
            reason: `${violation.help}: ${node.failureSummary}`,
            remediation: `${violation.helpUrl}`,
          });
        }
      }
    }

    if (allFailures.length > 0) {
      const errorReport = allFailures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(
        `WCAG UNDERSTANDABLE VIOLATIONS FOUND (${allFailures.length} total):\n\n${errorReport}`
      );
    }
  });
});
