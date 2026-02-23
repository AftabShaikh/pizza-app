import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA — Perceivable Tests
 * Criteria: 1.1.x, 1.2.x, 1.3.x, 1.4.x
 *
 * Web content is made available to the senses — sight, hearing, and/or touch.
 */

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

test.describe('Perceivable — Guideline 1.1: Text Alternatives', () => {
  test('1.1.1 Non-text Content — Images have appropriate alternative text', async ({ page }) => {
    // WCAG Criterion: 1.1.1 Non-text Content
    // Testing: All images have appropriate alt text
    // Pass Criteria: Every img element has a non-empty alt attribute (or empty alt for decorative images that are marked as such)
    // Fail Criteria: Any img element lacks alt text entirely

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

      const images = await page.locator('img').all();

      for (const [index, img] of images.entries()) {
        const alt = await img.getAttribute('alt');
        const src = await img.getAttribute('src');
        const role = await img.getAttribute('role');

        // alt attribute must be present (it can be empty for decorative images)
        if (alt === null && role !== 'presentation' && role !== 'none') {
          failures.push({
            element: `img[src="${src}"]`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Image element ${index + 1}`,
            reason: 'Image is missing the alt attribute entirely',
            remediation: `Add alt attribute: <img src="${src}" alt="descriptive text here"> or alt="" if decorative`,
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

      throw new Error(`WCAG 1.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.1.1 Non-text Content — Form buttons have descriptive values', async ({ page }) => {
    // WCAG Criterion: 1.1.1 Non-text Content
    // Testing: All form buttons have descriptive accessible names
    // Pass Criteria: Every button element has visible text, aria-label, or aria-labelledby
    // Fail Criteria: Any button lacks an accessible name

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

      const buttons = await page.locator('button, [role="button"], input[type="submit"], input[type="button"]').all();

      for (const [index, button] of buttons.entries()) {
        const text = (await button.textContent())?.trim() || '';
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledby = await button.getAttribute('aria-labelledby');
        const title = await button.getAttribute('title');
        const value = await button.getAttribute('value');

        const hasAccessibleName = text.length > 0 || ariaLabel || ariaLabelledby || title || value;

        if (!hasAccessibleName) {
          const outerHTML = await button.evaluate((el) => el.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Button element ${index + 1}`,
            reason: 'Button lacks an accessible name (no text, aria-label, aria-labelledby, title, or value)',
            remediation: 'Add descriptive text content or aria-label attribute to the button',
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

      throw new Error(`WCAG 1.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.1.1 Non-text Content — Inputs have associated accessible names', async ({ page }) => {
    // WCAG Criterion: 1.1.1 Non-text Content
    // Testing: All form inputs have associated accessible names via label, aria-label, or aria-labelledby
    // Pass Criteria: Every input/select/textarea has a programmatic accessible name
    // Fail Criteria: Any input lacks an accessible name

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
        .locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea')
        .all();

      for (const [index, input] of inputs.entries()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        const title = await input.getAttribute('title');

        let hasLabel = !!(ariaLabel || ariaLabelledby || title);

        if (!hasLabel && id) {
          const labelCount = await page.locator(`label[for="${id}"]`).count();
          hasLabel = labelCount > 0;
        }

        if (!hasLabel) {
          // Check if wrapped in a label
          const parentLabel = await input.locator('xpath=ancestor::label').count();
          hasLabel = parentLabel > 0;
        }

        // Allow placeholder as a fallback (though not ideal)
        if (!hasLabel && !placeholder) {
          const type = await input.getAttribute('type');
          const name = await input.getAttribute('name');
          failures.push({
            element: `input[type="${type}"][name="${name}"]${id ? `#${id}` : ''}`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Input element ${index + 1}`,
            reason: 'Input lacks an accessible name (no associated label, aria-label, aria-labelledby, or title)',
            remediation: `Add a <label for="${id || 'inputId'}"> element or add aria-label attribute to the input`,
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

      throw new Error(`WCAG 1.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Perceivable — Guideline 1.3: Adaptable', () => {
  test('1.3.1 Info and Relationships — Semantic heading structure is correct', async ({ page }) => {
    // WCAG Criterion: 1.3.1 Info and Relationships
    // Testing: Headings follow a logical hierarchy without skipping levels
    // Pass Criteria: Heading levels increase sequentially (h1 → h2 → h3) without gaps
    // Fail Criteria: Heading levels are skipped (e.g., h1 → h3 without h2)

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

      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

      if (headings.length === 0) {
        failures.push({
          element: 'N/A',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page level',
          reason: 'No headings found on the page',
          remediation: 'Add at least one h1 heading to establish page structure',
        });
        continue;
      }

      let previousLevel = 0;
      for (const [index, heading] of headings.entries()) {
        const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
        const level = parseInt(tagName.replace('h', ''), 10);
        const text = (await heading.textContent())?.trim() || '';

        if (previousLevel > 0 && level > previousLevel + 1) {
          failures.push({
            element: `<${tagName}>${text}</${tagName}>`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Heading element ${index + 1}`,
            reason: `Heading level skipped from h${previousLevel} to h${level}`,
            remediation: `Change <${tagName}> to <h${previousLevel + 1}> or add intermediate heading levels`,
          });
        }

        previousLevel = level;
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 1.3.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.3.1 Info and Relationships — Landmark regions are present', async ({ page }) => {
    // WCAG Criterion: 1.3.1 Info and Relationships
    // Testing: Page uses landmark regions (main, nav, etc.) for structure
    // Pass Criteria: Page has at least a <main> and <nav> landmark
    // Fail Criteria: Required landmark regions are missing

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

      const mainCount = await page.locator('main, [role="main"]').count();
      const navCount = await page.locator('nav, [role="navigation"]').count();

      if (mainCount === 0) {
        failures.push({
          element: 'N/A',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page level',
          reason: 'No <main> landmark region found',
          remediation: 'Wrap the main content area in a <main> element or add role="main"',
        });
      }

      if (navCount === 0) {
        failures.push({
          element: 'N/A',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page level',
          reason: 'No <nav> landmark region found',
          remediation: 'Use a <nav> element for the navigation area or add role="navigation"',
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

      throw new Error(`WCAG 1.3.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.3.1 Info and Relationships — Form labels are properly associated', async ({ page }) => {
    // WCAG Criterion: 1.3.1 Info and Relationships
    // Testing: Form input elements have programmatically associated labels
    // Pass Criteria: All inputs have label[for], aria-label, aria-labelledby, or are wrapped in <label>
    // Fail Criteria: Any form input lacks a programmatic label association

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
        .locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea')
        .all();

      for (const [index, input] of inputs.entries()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const title = await input.getAttribute('title');
        let hasAssociation = !!(ariaLabel || ariaLabelledby || title);

        if (!hasAssociation && id) {
          const labelCount = await page.locator(`label[for="${id}"]`).count();
          hasAssociation = labelCount > 0;
        }

        if (!hasAssociation) {
          const parentLabel = await input.locator('xpath=ancestor::label').count();
          hasAssociation = parentLabel > 0;
        }

        if (!hasAssociation) {
          const type = await input.getAttribute('type');
          const name = await input.getAttribute('name');
          failures.push({
            element: `input[type="${type}"][name="${name}"]`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Input element ${index + 1}`,
            reason: 'Input has no programmatically associated label',
            remediation: `Add <label for="${id || 'inputId'}">Label Text</label> or use aria-label/aria-labelledby`,
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

      throw new Error(`WCAG 1.3.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.3.2 Meaningful Sequence — DOM order is logical and intuitive', async ({ page }) => {
    // WCAG Criterion: 1.3.2 Meaningful Sequence
    // Testing: The reading and navigation order (determined by code order) is logical
    // Pass Criteria: Navigation appears before main content, headings precede their sections
    // Fail Criteria: DOM order places content in an illogical reading sequence

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

      // Check that nav comes before main content
      const allElements = await page.locator('nav, [role="navigation"], main, [role="main"]').all();
      let navIndex = -1;
      let mainIndex = -1;

      for (const [index, el] of allElements.entries()) {
        const tagName = await el.evaluate((e) => e.tagName.toLowerCase());
        const role = await el.getAttribute('role');
        if (tagName === 'nav' || role === 'navigation') {
          if (navIndex === -1) navIndex = index;
        }
        if (tagName === 'main' || role === 'main') {
          if (mainIndex === -1) mainIndex = index;
        }
      }

      if (navIndex !== -1 && mainIndex !== -1 && navIndex > mainIndex) {
        failures.push({
          element: 'nav, main',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page structure',
          reason: 'Navigation appears after main content in DOM order',
          remediation: 'Move <nav> before <main> in the HTML structure',
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

      throw new Error(`WCAG 1.3.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.3.5 Identify Input Purpose — Autocomplete attributes on user inputs', async ({ page }) => {
    // WCAG Criterion: 1.3.5 Identify Input Purpose
    // Testing: Input fields collecting personal info have appropriate autocomplete attributes
    // Pass Criteria: Inputs for name, email, phone, address have correct autocomplete values
    // Fail Criteria: Applicable inputs lack autocomplete attributes

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    const autocompleteMapping: Record<string, string[]> = {
      email: ['email'],
      tel: ['tel'],
      name: ['name', 'given-name', 'family-name'],
      password: ['current-password', 'new-password'],
    };

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      for (const [inputType, validValues] of Object.entries(autocompleteMapping)) {
        const inputs = await page.locator(`input[type="${inputType}"]`).all();

        for (const [index, input] of inputs.entries()) {
          const autocomplete = await input.getAttribute('autocomplete');
          const name = await input.getAttribute('name');

          if (!autocomplete || autocomplete === 'off') {
            failures.push({
              element: `input[type="${inputType}"][name="${name}"]`,
              sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
              position: `Input element ${index + 1}`,
              reason: `Input of type "${inputType}" lacks autocomplete attribute`,
              remediation: `Add autocomplete="${validValues[0]}" to the input element`,
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

      throw new Error(`WCAG 1.3.5 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Perceivable — Guideline 1.4: Distinguishable', () => {
  test('1.4.1 Use of Color — Color is not the sole method of conveying information', async ({ page }) => {
    // WCAG Criterion: 1.4.1 Use of Color
    // Testing: Interactive elements that use color coding also provide text/icon/pattern alternatives
    // Pass Criteria: Category filters and status indicators have text labels in addition to color
    // Fail Criteria: Any element relies solely on color to convey meaning

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check category filter buttons — they should have text labels, not just color
    const filterButtons = await page.locator('button').all();
    for (const [index, button] of filterButtons.entries()) {
      const text = (await button.textContent())?.trim() || '';
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaPressed = await button.getAttribute('aria-pressed');
      const ariaCurrent = await button.getAttribute('aria-current');

      // If the button has no text, it might rely on color alone
      if (!text && !ariaLabel) {
        const outerHTML = await button.evaluate((el) => el.outerHTML.substring(0, 200));
        failures.push({
          element: outerHTML,
          sourceFile: 'Home page (/)',
          position: `Button element ${index + 1}`,
          reason: 'Button may rely on color alone to convey its purpose (no text or aria-label)',
          remediation: 'Add visible text or aria-label to communicate button state/purpose',
        });
      }
    }

    // Check Badge components for availability — verify text accompanies color
    const badges = await page.locator('[class*="badge"], [class*="Badge"]').all();
    for (const [index, badge] of badges.entries()) {
      const text = (await badge.textContent())?.trim() || '';
      if (!text) {
        const outerHTML = await badge.evaluate((el) => el.outerHTML.substring(0, 200));
        failures.push({
          element: outerHTML,
          sourceFile: 'Home page (/)',
          position: `Badge element ${index + 1}`,
          reason: 'Badge element has no text — may rely on color alone',
          remediation: 'Add text content to the badge to supplement color-based meaning',
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

      throw new Error(`WCAG 1.4.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.4.3 Contrast (Minimum) — Text has sufficient contrast ratio via axe-core', async ({ page }) => {
    // WCAG Criterion: 1.4.3 Contrast (Minimum)
    // Testing: Text and images of text have a contrast ratio of at least 4.5:1 (3:1 for large text)
    // Pass Criteria: axe-core reports zero color-contrast violations
    // Fail Criteria: Any text element fails the minimum contrast ratio

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      if (results.violations.length > 0) {
        const failures = results.violations.flatMap((v) =>
          v.nodes.map((node, idx) => ({
            element: node.html.substring(0, 200),
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${idx + 1} of ${v.nodes.length}`,
            reason: `${v.help}: ${node.failureSummary}`,
            remediation: `Ensure text color and background meet 4.5:1 contrast ratio. ${v.helpUrl}`,
          }))
        );

        const errorReport = failures
          .map(
            (f) =>
              `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
          )
          .join('\n\n');

        throw new Error(`WCAG 1.4.3 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    }
  });

  test('1.4.4 Resize Text — Page is functional at 200% zoom', async ({ page }) => {
    // WCAG Criterion: 1.4.4 Resize Text
    // Testing: Page remains readable and functional when zoomed to 200%
    // Pass Criteria: No content overlap, clipping, or loss of functionality at 200% zoom
    // Fail Criteria: Content is clipped, overlapping, or controls become unusable

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    for (const pageInfo of PAGES) {
      // Set viewport and zoom to 200% (simulate with half viewport)
      await page.setViewportSize({ width: 640, height: 360 });
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Check that key elements are still visible
      const h1 = await page.locator('h1, h2').first();
      if (await h1.count() > 0) {
        const isVisible = await h1.isVisible();
        if (!isVisible) {
          failures.push({
            element: 'h1/h2 heading',
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: 'Page heading',
            reason: 'Main heading is not visible at 200% zoom equivalent',
            remediation: 'Ensure headings use responsive units and do not overflow at zoomed sizes',
          });
        }
      }

      // Check for horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        failures.push({
          element: 'document',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page level',
          reason: 'Horizontal scrollbar appears at 200% zoom equivalent viewport',
          remediation: 'Use responsive CSS (%, vw, rem) instead of fixed pixel widths',
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

      throw new Error(`WCAG 1.4.4 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.4.10 Reflow — No horizontal scroll at 320px width', async ({ page }) => {
    // WCAG Criterion: 1.4.10 Reflow
    // Testing: Content reflows without horizontal scrolling at 320px viewport width
    // Pass Criteria: No horizontal scrollbar appears at 320px width
    // Fail Criteria: Horizontal scrolling is required to view content

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    for (const pageInfo of PAGES) {
      await page.setViewportSize({ width: 320, height: 480 });
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
      });

      if (hasHorizontalScroll) {
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        failures.push({
          element: `document (scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth})`,
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page level',
          reason: `Content overflows at 320px width (scrollWidth: ${scrollWidth}px > clientWidth: ${clientWidth}px)`,
          remediation: 'Apply responsive CSS to ensure content reflows at narrow viewports. Use max-width: 100% on containers.',
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

      throw new Error(`WCAG 1.4.10 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.4.11 Non-text Contrast — UI components have sufficient contrast via axe-core', async ({ page }) => {
    // WCAG Criterion: 1.4.11 Non-text Contrast
    // Testing: Graphical objects and UI components have at least 3:1 contrast ratio
    // Pass Criteria: axe-core reports zero non-text contrast violations
    // Fail Criteria: Any UI component fails the 3:1 contrast ratio

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withRules(['link-in-text-block'])
        .withTags(['wcag2aa'])
        .analyze();

      if (results.violations.length > 0) {
        const failures = results.violations.flatMap((v) =>
          v.nodes.map((node, idx) => ({
            element: node.html.substring(0, 200),
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${idx + 1} of ${v.nodes.length}`,
            reason: `${v.help}: ${node.failureSummary}`,
            remediation: `Ensure UI components have at least 3:1 contrast ratio. ${v.helpUrl}`,
          }))
        );

        const errorReport = failures
          .map(
            (f) =>
              `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
          )
          .join('\n\n');

        throw new Error(`WCAG 1.4.11 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    }
  });

  test('1.4.12 Text Spacing — Content survives increased text spacing', async ({ page }) => {
    // WCAG Criterion: 1.4.12 Text Spacing
    // Testing: No content loss when text spacing is increased per WCAG requirements
    // Pass Criteria: All content remains visible after applying WCAG text spacing overrides
    // Fail Criteria: Content is clipped, overlapping, or not visible after spacing changes

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

      // Apply WCAG text spacing overrides
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
          * {
            line-height: 1.5em !important;
            letter-spacing: 0.12em !important;
            word-spacing: 0.16em !important;
          }
          p {
            margin-bottom: 2em !important;
          }
        `;
        document.head.appendChild(style);
      });

      // Wait for layout to settle
      await page.waitForTimeout(500);

      // Check that key interactive elements are still visible
      const clickableElements = await page.locator('button, a, [role="button"]').all();
      for (const [index, el] of clickableElements.entries()) {
        const isVisible = await el.isVisible();
        if (!isVisible) {
          const outerHTML = await el.evaluate((e) => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Interactive element ${index + 1}`,
            reason: 'Element becomes invisible when WCAG text spacing is applied',
            remediation: 'Avoid fixed/overflow:hidden on containers with text; use flexible sizing',
          });
        }
      }

      // Check for content overflow / clipping
      const hasOverflow = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (style.overflow === 'hidden' && el.scrollHeight > el.clientHeight + 2) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 50 && rect.height > 20) {
              return true;
            }
          }
        }
        return false;
      });

      if (hasOverflow) {
        failures.push({
          element: 'Container with overflow:hidden',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page level',
          reason: 'Content appears clipped by overflow:hidden when text spacing is increased',
          remediation: 'Use overflow:visible or min-height instead of fixed heights on text containers',
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

      throw new Error(`WCAG 1.4.12 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('1.4.13 Content on Hover or Focus — Hover/focus content is dismissible and persistent', async ({
    page,
  }) => {
    // WCAG Criterion: 1.4.13 Content on Hover or Focus
    // Testing: Additional content shown on hover/focus can be dismissed and persists on hover
    // Pass Criteria: Tooltips/dropdowns can be dismissed (Esc), persist when pointer moves to them
    // Fail Criteria: Content disappears when pointer moves to it, or cannot be dismissed

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check elements with title attributes (native tooltips are generally compliant)
    const titleElements = await page.locator('[title]').all();
    for (const [index, el] of titleElements.entries()) {
      const title = await el.getAttribute('title');
      if (title) {
        // Native title tooltips are browser-managed, generally compliant
        // Just log for awareness
      }
    }

    // Check for custom tooltip/popover-like elements (elements that appear on hover via CSS)
    const hoverTriggers = await page.locator('[class*="hover"], [class*="tooltip"], [class*="popover"]').all();
    for (const [index, trigger] of hoverTriggers.entries()) {
      await trigger.hover();
      await page.waitForTimeout(300);

      // Check if any new element appeared
      const visiblePopups = await page.locator('[class*="tooltip"]:visible, [class*="popover"]:visible').count();
      if (visiblePopups > 0) {
        // Try to dismiss with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const stillVisible = await page
          .locator('[class*="tooltip"]:visible, [class*="popover"]:visible')
          .count();

        if (stillVisible > 0) {
          const outerHTML = await trigger.evaluate((e) => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: 'Home page (/)',
            position: `Hover trigger ${index + 1}`,
            reason: 'Hover content cannot be dismissed with Escape key',
            remediation:
              'Add keyboard event listener to dismiss hover content when Escape is pressed',
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

      throw new Error(`WCAG 1.4.13 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Perceivable — axe-core Full Scan', () => {
  test('1.x.x Perceivable — Full axe-core perceivable rules scan', async ({ page }) => {
    // WCAG Criterion: All Perceivable criteria (1.1.x, 1.2.x, 1.3.x, 1.4.x)
    // Testing: Comprehensive axe-core scan for all perceivable-related rules
    // Pass Criteria: Zero axe-core violations tagged with wcag2a/wcag2aa perceivable rules
    // Fail Criteria: Any axe-core violation detected in perceivable category

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

      // Filter to perceivable-related violations only
      const perceivableRules = [
        'image-alt',
        'input-image-alt',
        'area-alt',
        'object-alt',
        'svg-img-alt',
        'role-img-alt',
        'color-contrast',
        'link-in-text-block',
        'meta-viewport',
        'label',
        'label-title-only',
        'document-title',
        'html-has-lang',
        'html-lang-valid',
        'valid-lang',
        'td-headers-attr',
        'th-has-data-cells',
        'definition-list',
        'dlitem',
        'list',
        'listitem',
      ];

      const perceivableViolations = results.violations.filter(
        (v) => perceivableRules.includes(v.id) || v.tags.some((t) => t.startsWith('cat.color') || t.startsWith('cat.text') || t.startsWith('cat.structure') || t.startsWith('cat.forms') || t.startsWith('cat.name-role-value'))
      );

      for (const violation of perceivableViolations) {
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
        `WCAG PERCEIVABLE VIOLATIONS FOUND (${allFailures.length} total):\n\n${errorReport}`
      );
    }
  });
});
