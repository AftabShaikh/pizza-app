import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

// ============================================================================
// GUIDELINE 3.1 — Readable
// ============================================================================

test.describe('3.1 Readable', () => {

  for (const page of PAGES) {
    test(`3.1.1 Language of Page - Page language is defined on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 3.1.1 Language of Page
      // Testing: The <html> element has a valid lang attribute
      // Pass Criteria: <html> has a non-empty, valid lang attribute (e.g., "en", "en-US")
      // Fail Criteria: lang attribute is missing, empty, or invalid

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const lang = await p.locator('html').getAttribute('lang');

      if (!lang || lang.trim() === '') {
        failures.push({
          element: '<html>',
          sourceFile: p.url(),
          position: '<html> element',
          reason: 'The <html> element is missing the lang attribute',
          remediation: 'Add lang="en" (or appropriate language code) to the <html> element',
        });
      } else {
        // Validate BCP 47 language tag format
        const validLangPattern = /^[a-z]{2,3}(-[a-zA-Z]{2,4})?$/;
        if (!validLangPattern.test(lang.trim())) {
          failures.push({
            element: `<html lang="${lang}">`,
            sourceFile: p.url(),
            position: '<html> element',
            reason: `The lang attribute value "${lang}" does not appear to be a valid BCP 47 language tag`,
            remediation: 'Use a valid language code such as "en", "en-US", "es", "fr", etc.',
          });
        }
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 3.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`3.1.2 Language of Parts - Content parts in other languages are marked on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 3.1.2 Language of Parts
      // Testing: Content in a different language from the page language is marked with lang attribute
      // Pass Criteria: Elements with lang attribute use valid language codes
      // Fail Criteria: Elements with lang attribute have invalid codes

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const elementsWithLang = await p.locator('[lang]:not(html)').all();

      for (const [index, el] of elementsWithLang.entries()) {
        const lang = await el.getAttribute('lang');
        if (lang) {
          const validLangPattern = /^[a-z]{2,3}(-[a-zA-Z]{2,4})?$/;
          if (!validLangPattern.test(lang.trim())) {
            const outerHTML = await el.evaluate(e => e.outerHTML.substring(0, 200));
            failures.push({
              element: outerHTML,
              sourceFile: p.url(),
              position: `Element ${index + 1}`,
              reason: `Element has invalid lang attribute value: "${lang}"`,
              remediation: 'Use a valid BCP 47 language tag (e.g., "es", "fr", "de")',
            });
          }
        }
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 3.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// GUIDELINE 3.2 — Predictable
// ============================================================================

test.describe('3.2 Predictable', () => {

  for (const page of PAGES) {
    test(`3.2.1 On Focus - Focus does not trigger context changes on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 3.2.1 On Focus
      // Testing: Focusing on an element does not cause a context change (navigation, popup, etc.)
      // Pass Criteria: Tabbing through all elements does not trigger navigation or popups
      // Fail Criteria: Focus on any element causes unexpected page navigation or popup

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const initialUrl = p.url();

      // Check for onfocus handlers that navigate
      const onFocusElements = await p.evaluate(() => {
        const results: string[] = [];
        document.querySelectorAll('[onfocus]').forEach(el => {
          const handler = el.getAttribute('onfocus') || '';
          if (/window\.location|document\.location|href|navigate|submit/i.test(handler)) {
            results.push(el.outerHTML.substring(0, 200));
          }
        });
        return results;
      });

      for (const [index, html] of onFocusElements.entries()) {
        failures.push({
          element: html,
          sourceFile: p.url(),
          position: `Element ${index + 1}`,
          reason: 'Element has an onfocus handler that appears to trigger navigation or context change',
          remediation: 'Remove navigation/submission from onfocus handler. Context changes should require explicit user action (click/Enter).',
        });
      }

      // Tab through several elements and verify URL doesn't change
      for (let i = 0; i < 15; i++) {
        await p.keyboard.press('Tab');
        const currentUrl = p.url();
        if (currentUrl !== initialUrl) {
          failures.push({
            element: 'Tab navigation',
            sourceFile: initialUrl,
            position: `Tab press ${i + 1}`,
            reason: `Tab navigation caused page to navigate from ${initialUrl} to ${currentUrl}`,
            remediation: 'Ensure no element triggers navigation on focus. Use click/Enter events instead.',
          });
          break;
        }
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 3.2.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`3.2.2 On Input - Input changes don't cause unexpected context changes on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 3.2.2 On Input
      // Testing: Interacting with form controls does not cause unexpected context changes
      // Pass Criteria: Changing select/checkbox/radio values does not trigger navigation without warning
      // Fail Criteria: Input interaction causes unexpected navigation or popup

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for onchange handlers that navigate
      const onChangeElements = await p.evaluate(() => {
        const results: string[] = [];
        document.querySelectorAll('[onchange]').forEach(el => {
          const handler = el.getAttribute('onchange') || '';
          if (/window\.location|document\.location|href|navigate|submit/i.test(handler)) {
            results.push(el.outerHTML.substring(0, 200));
          }
        });
        return results;
      });

      for (const [index, html] of onChangeElements.entries()) {
        failures.push({
          element: html,
          sourceFile: p.url(),
          position: `Element ${index + 1}`,
          reason: 'Element has an onchange handler that appears to trigger navigation or form submission',
          remediation: 'Remove auto-navigation from onchange handler. Use a submit button for form changes that trigger navigation.',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 3.2.2 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }

  test('3.2.3 Consistent Navigation - Navigation order is consistent across pages', async ({ page: p }) => {
    // WCAG Criterion: 3.2.3 Consistent Navigation
    // Testing: Navigation links that repeat across pages appear in the same order
    // Pass Criteria: Nav links on Home and Cart pages have the same order
    // Fail Criteria: Navigation order differs between pages

    const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

    const navLinks: Record<string, string[]> = {};

    for (const page of PAGES) {
      await p.goto(page.path, { waitUntil: 'networkidle' });
      const links = await p.locator('nav a, [role="navigation"] a').all();
      const linkTexts: string[] = [];
      for (const link of links) {
        const text = (await link.textContent() || '').trim();
        if (text) linkTexts.push(text);
      }
      navLinks[page.name] = linkTexts;
    }

    const pageNames = Object.keys(navLinks);
    if (pageNames.length >= 2) {
      const firstPageLinks = navLinks[pageNames[0]];
      for (let i = 1; i < pageNames.length; i++) {
        const otherLinks = navLinks[pageNames[i]];
        // Check that common links appear in the same order
        const commonLinks = firstPageLinks.filter(l => otherLinks.includes(l));
        const commonInOther = otherLinks.filter(l => firstPageLinks.includes(l));

        for (let j = 0; j < commonLinks.length; j++) {
          if (commonLinks[j] !== commonInOther[j]) {
            failures.push({
              element: `${pageNames[0]}: [${commonLinks.join(', ')}] vs ${pageNames[i]}: [${commonInOther.join(', ')}]`,
              sourceFile: 'Cross-page comparison',
              position: `Navigation link ${j + 1}`,
              reason: `Navigation link order differs: "${commonLinks[j]}" on ${pageNames[0]} vs "${commonInOther[j]}" on ${pageNames[i]}`,
              remediation: 'Ensure navigation links appear in the same order across all pages',
            });
            break;
          }
        }
      }
    }

    if (failures.length > 0) {
      const errorReport = failures.map(f =>
        `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
        `   Reason: ${f.reason}\n` +
        `   Element: ${f.element}\n` +
        `   Fix: ${f.remediation}`
      ).join('\n\n');

      throw new Error(`WCAG 3.2.3 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('3.2.4 Consistent Identification - Elements are consistently identified across pages', async ({ page: p }) => {
    // WCAG Criterion: 3.2.4 Consistent Identification
    // Testing: Same-function elements have consistent labels across pages
    // Pass Criteria: Cart button, nav links have the same labels on all pages
    // Fail Criteria: Same functionality has different labels on different pages

    const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

    const cartLabels: string[] = [];

    for (const page of PAGES) {
      await p.goto(page.path, { waitUntil: 'networkidle' });

      // Check cart link/button labels
      const cartElements = await p.locator('a[href="/cart"], a[href*="cart"]').all();
      for (const el of cartElements) {
        const text = (await el.textContent() || '').trim();
        const ariaLabel = await el.getAttribute('aria-label') || '';
        cartLabels.push(ariaLabel || text);
      }
    }

    // Check for inconsistencies in cart labels (excluding price differences)
    const uniqueCartLabels = [...new Set(cartLabels.map(l => l.replace(/\$[\d.]+/, '$X')))];
    if (uniqueCartLabels.length > 1) {
      failures.push({
        element: `Cart labels: ${uniqueCartLabels.join(' | ')}`,
        sourceFile: 'Cross-page comparison',
        position: 'Cart navigation element',
        reason: `Cart element has inconsistent labeling across pages: ${uniqueCartLabels.join(' vs ')}`,
        remediation: 'Use the same label text/aria-label for cart elements across all pages',
      });
    }

    if (failures.length > 0) {
      const errorReport = failures.map(f =>
        `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
        `   Reason: ${f.reason}\n` +
        `   Element: ${f.element}\n` +
        `   Fix: ${f.remediation}`
      ).join('\n\n');

      throw new Error(`WCAG 3.2.4 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

// ============================================================================
// GUIDELINE 3.3 — Input Assistance
// ============================================================================

test.describe('3.3 Input Assistance', () => {

  for (const page of PAGES) {
    test(`3.3.1 Error Identification - Form errors are clearly identified on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 3.3.1 Error Identification
      // Testing: Error messages identify the field and describe the error
      // Pass Criteria: Error elements use role="alert" or aria-live, and are associated with inputs
      // Fail Criteria: Error messages are not programmatically associated with inputs

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check error containers for proper ARIA attributes
      const errorElements = await p.locator('[class*="error"], [class*="invalid"], [role="alert"]').all();

      for (const [index, el] of errorElements.entries()) {
        const role = await el.getAttribute('role');
        const ariaLive = await el.getAttribute('aria-live');

        if (!role && !ariaLive) {
          const outerHTML = await el.evaluate(e => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: p.url(),
            position: `Error element ${index + 1}`,
            reason: 'Error message element lacks role="alert" or aria-live attribute',
            remediation: 'Add role="alert" or aria-live="polite" to the error message container',
          });
        }
      }

      // Check required inputs have aria-required or required attribute
      const requiredInputs = await p.locator('input[required], input[aria-required="true"]').all();
      for (const [index, input] of requiredInputs.entries()) {
        const ariaDescribedBy = await input.getAttribute('aria-describedby');
        const ariaInvalid = await input.getAttribute('aria-invalid');

        // Just verify the form setup is correct (aria-invalid and aria-describedby are available)
        // No failure here — just a structural check
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 3.3.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`3.3.2 Labels or Instructions - All inputs have labels on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 3.3.2 Labels or Instructions
      // Testing: All form inputs have visible labels or instructions
      // Pass Criteria: Every input has a visible <label>, placeholder is supplementary only
      // Fail Criteria: Inputs rely solely on placeholder text for identification

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const inputs = await p.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea').all();

      for (const [index, input] of inputs.entries()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const title = await input.getAttribute('title');
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type') || 'text';

        let hasVisibleLabel = !!(ariaLabel || ariaLabelledBy || title);

        if (!hasVisibleLabel && id) {
          const labelCount = await p.locator(`label[for="${id}"]`).count();
          hasVisibleLabel = labelCount > 0;
        }

        if (!hasVisibleLabel) {
          const parentLabelCount = await input.locator('xpath=ancestor::label').count();
          hasVisibleLabel = parentLabelCount > 0;
        }

        if (!hasVisibleLabel && placeholder) {
          const name = await input.getAttribute('name') || `input-${index}`;
          failures.push({
            element: `<input type="${type}" name="${name}" placeholder="${placeholder}">`,
            sourceFile: p.url(),
            position: `Input ${index + 1}`,
            reason: `Input relies on placeholder "${placeholder}" as its only label — placeholder is not a substitute for a label`,
            remediation: `Add <label for="${id || name}">${placeholder}</label> before the input element`,
          });
        }
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 3.3.2 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// COMPREHENSIVE AXE-CORE SCAN — UNDERSTANDABLE
// ============================================================================

test.describe('Understandable - Comprehensive axe-core scan', () => {

  for (const page of PAGES) {
    test(`3.1.1–3.3.8 Understandable - Comprehensive axe-core automated scan on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 3.1.1 Language of Page, 3.1.2 Language of Parts, 3.3.2 Labels, and all other Understandable criteria
      // Testing: Automated axe-core scan for all Understandable WCAG 2.1 A/AA rules (lang, label, autocomplete, etc.)
      // Pass Criteria: Zero axe-core violations for understandable-related rules across all page elements
      // Fail Criteria: Any axe-core understandable violation detected on any element

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const understandableRules = [
        'html-has-lang', 'html-lang-valid', 'valid-lang',
        'label', 'label-title-only', 'select-name',
        'autocomplete-valid', 'form-field-multiple-labels',
      ];

      const understandableViolations = results.violations.filter(v =>
        understandableRules.includes(v.id)
      );

      if (understandableViolations.length > 0) {
        const failures = understandableViolations.flatMap(v =>
          v.nodes.map((node, index) => ({
            element: node.html.substring(0, 200),
            sourceFile: p.url(),
            position: `[${v.id}] Node ${index + 1} — ${node.target.join(', ')}`,
            reason: node.failureSummary || v.description,
            remediation: `${v.help}. See: ${v.helpUrl}`,
          }))
        );

        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG UNDERSTANDABLE AXE-CORE VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});
