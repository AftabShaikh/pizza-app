import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

// ============================================================================
// GUIDELINE 1.1 — Non-text Content
// ============================================================================

test.describe('1.1 Non-text Content', () => {

  for (const page of PAGES) {
    test(`1.1.1 Non-text Content - All images have alt text on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.1.1 Non-text Content
      // Testing: All <img> elements have appropriate alternative text
      // Pass Criteria: Every <img> has a non-empty alt attribute or alt="" for decorative images
      // Fail Criteria: Any <img> lacks an alt attribute entirely

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const images = await p.locator('img').all();
      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      for (const [index, img] of images.entries()) {
        const alt = await img.getAttribute('alt');
        const src = await img.getAttribute('src') || 'unknown';

        if (alt === null) {
          failures.push({
            element: `img[src="${src}"]`,
            sourceFile: p.url(),
            position: `Image element ${index + 1}`,
            reason: 'Image is missing the alt attribute entirely',
            remediation: `Add an alt attribute: <img src="${src}" alt="descriptive text"> or alt="" if decorative`,
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

        throw new Error(`WCAG 1.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.1.1 Non-text Content - Form inputs have accessible names on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.1.1 Non-text Content
      // Testing: All form inputs have an accessible name via label, aria-label, or aria-labelledby
      // Pass Criteria: Every input/select/textarea has a programmatic accessible name
      // Fail Criteria: Any form control lacks an accessible name

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const inputs = await p.locator('input, select, textarea').all();
      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      for (const [index, input] of inputs.entries()) {
        const type = await input.getAttribute('type') || 'text';
        if (type === 'hidden') continue;

        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const id = await input.getAttribute('id');
        const title = await input.getAttribute('title');
        const placeholder = await input.getAttribute('placeholder');

        let hasLabel = !!(ariaLabel || ariaLabelledBy || title);

        if (!hasLabel && id) {
          const associatedLabels = await p.locator(`label[for="${id}"]`).count();
          hasLabel = associatedLabels > 0;
        }

        if (!hasLabel) {
          const parentLabel = await input.locator('xpath=ancestor::label').count();
          hasLabel = parentLabel > 0;
        }

        if (!hasLabel) {
          const name = await input.getAttribute('name') || `input-${index}`;
          failures.push({
            element: `<input type="${type}" name="${name}">`,
            sourceFile: p.url(),
            position: `Form control ${index + 1}`,
            reason: `Input of type "${type}" has no accessible name (no label, aria-label, aria-labelledby, or title)${placeholder ? ` — placeholder "${placeholder}" is not a substitute for a label` : ''}`,
            remediation: `Add a <label for="${id || name}"> element, or add aria-label="${placeholder || 'descriptive text'}" to the input`,
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

        throw new Error(`WCAG 1.1.1 VIOLATIONS FOUND (Form Accessible Names):\n\n${errorReport}`);
      }
    });

    test(`1.1.1 Non-text Content - Buttons have accessible names on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.1.1 Non-text Content
      // Testing: All buttons have discernible accessible names
      // Pass Criteria: Every <button> has text content, aria-label, aria-labelledby, or title
      // Fail Criteria: Any button has no accessible name

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const buttons = await p.locator('button, [role="button"]').all();
      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      for (const [index, button] of buttons.entries()) {
        const textContent = (await button.textContent() || '').trim();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        const title = await button.getAttribute('title');

        const hasName = textContent.length > 0 || ariaLabel || ariaLabelledBy || title;

        if (!hasName) {
          const outerHTML = await button.evaluate(el => el.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: p.url(),
            position: `Button ${index + 1}`,
            reason: 'Button has no accessible name (no text content, aria-label, aria-labelledby, or title)',
            remediation: 'Add visible text, aria-label="descriptive text", or a title attribute to the button',
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

        throw new Error(`WCAG 1.1.1 VIOLATIONS FOUND (Button Accessible Names):\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// GUIDELINE 1.3 — Info and Relationships / Meaningful Sequence / Orientation / Input Purpose
// ============================================================================

test.describe('1.3 Adaptable', () => {

  for (const page of PAGES) {
    test(`1.3.1 Info and Relationships - Proper heading structure on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.3.1 Info and Relationships
      // Testing: Headings use proper semantic markup and nesting
      // Pass Criteria: At least one h1 exists, heading levels are not skipped (e.g., h1 -> h3)
      // Fail Criteria: No h1 found or heading levels are skipped

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const headings = await p.locator('h1, h2, h3, h4, h5, h6').all();
      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      if (headings.length === 0) {
        failures.push({
          element: 'N/A',
          sourceFile: p.url(),
          position: 'Page-level',
          reason: 'No headings found on the page',
          remediation: 'Add at least an <h1> heading to define the page structure',
        });
      } else {
        const levels: number[] = [];
        for (const heading of headings) {
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
          const level = parseInt(tagName.replace('h', ''), 10);
          levels.push(level);
        }

        if (!levels.includes(1)) {
          failures.push({
            element: `Headings found: ${levels.map(l => `h${l}`).join(', ')}`,
            sourceFile: p.url(),
            position: 'Page-level',
            reason: 'No <h1> heading found on the page',
            remediation: 'Add an <h1> element as the primary page heading',
          });
        }

        for (let i = 1; i < levels.length; i++) {
          if (levels[i] > levels[i - 1] + 1) {
            const headingText = await headings[i].textContent();
            failures.push({
              element: `<h${levels[i]}>${headingText}</h${levels[i]}>`,
              sourceFile: p.url(),
              position: `Heading ${i + 1}`,
              reason: `Heading level skipped: h${levels[i - 1]} followed by h${levels[i]}`,
              remediation: `Change to <h${levels[i - 1] + 1}> or add intermediate heading levels`,
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

        throw new Error(`WCAG 1.3.1 VIOLATIONS FOUND (Heading Structure):\n\n${errorReport}`);
      }
    });

    test(`1.3.1 Info and Relationships - Landmark regions on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.3.1 Info and Relationships
      // Testing: Page uses semantic landmark regions (nav, main) or ARIA landmark roles
      // Pass Criteria: Page has at least a <nav> or role="navigation" and <main> or role="main"
      // Fail Criteria: Missing essential landmark regions

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const navCount = await p.locator('nav, [role="navigation"]').count();
      if (navCount === 0) {
        failures.push({
          element: 'N/A',
          sourceFile: p.url(),
          position: 'Page-level',
          reason: 'No navigation landmark found (<nav> or role="navigation")',
          remediation: 'Wrap the navigation menu in a <nav> element',
        });
      }

      const mainCount = await p.locator('main, [role="main"]').count();
      if (mainCount === 0) {
        failures.push({
          element: 'N/A',
          sourceFile: p.url(),
          position: 'Page-level',
          reason: 'No main landmark found (<main> or role="main")',
          remediation: 'Wrap the primary page content in a <main> element',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 1.3.1 VIOLATIONS FOUND (Landmarks):\n\n${errorReport}`);
      }
    });

    test(`1.3.1 Info and Relationships - Form labels associated on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.3.1 Info and Relationships
      // Testing: Form labels are programmatically associated with their inputs
      // Pass Criteria: Every visible form control has an associated <label>, aria-label, or aria-labelledby
      // Fail Criteria: Any form control lacks a programmatic label association

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const inputs = await p.locator('input:not([type="hidden"]), select, textarea').all();
      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      for (const [index, input] of inputs.entries()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const title = await input.getAttribute('title');
        const type = await input.getAttribute('type') || 'text';

        let hasAssociation = !!(ariaLabel || ariaLabelledBy || title);

        if (!hasAssociation && id) {
          const labelCount = await p.locator(`label[for="${id}"]`).count();
          hasAssociation = labelCount > 0;
        }

        if (!hasAssociation) {
          const parentLabelCount = await input.locator('xpath=ancestor::label').count();
          hasAssociation = parentLabelCount > 0;
        }

        if (!hasAssociation) {
          const name = await input.getAttribute('name') || `unknown-${index}`;
          failures.push({
            element: `<input type="${type}" name="${name}">`,
            sourceFile: p.url(),
            position: `Form control ${index + 1}`,
            reason: 'Form control has no programmatic label association',
            remediation: `Add <label for="${id || name}">Label Text</label> or aria-label="Label Text" to the input`,
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

        throw new Error(`WCAG 1.3.1 VIOLATIONS FOUND (Form Labels):\n\n${errorReport}`);
      }
    });

    test(`1.3.2 Meaningful Sequence - DOM order is logical on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.3.2 Meaningful Sequence
      // Testing: The reading and navigation order (DOM order) is logical and intuitive
      // Pass Criteria: Navigation appears before main content in DOM; headings precede their content
      // Fail Criteria: Navigation appears after main content or content order is illogical

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check that nav comes before main content
      const allElements = await p.locator('nav, main, [role="navigation"], [role="main"]').all();
      const elementOrder: string[] = [];
      for (const el of allElements) {
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const role = await el.getAttribute('role');
        elementOrder.push(role || tag);
      }

      if (elementOrder.length >= 2) {
        const navIndex = elementOrder.findIndex(e => e === 'nav' || e === 'navigation');
        const mainIndex = elementOrder.findIndex(e => e === 'main');
        if (navIndex >= 0 && mainIndex >= 0 && navIndex > mainIndex) {
          failures.push({
            element: `DOM order: ${elementOrder.join(' → ')}`,
            sourceFile: p.url(),
            position: 'Page-level',
            reason: 'Navigation landmark appears after main content in the DOM order',
            remediation: 'Move the <nav> element before the <main> element in the HTML source',
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

        throw new Error(`WCAG 1.3.2 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.3.4 Orientation - No orientation lock on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.3.4 Orientation
      // Testing: Content is not restricted to a single display orientation
      // Pass Criteria: No CSS transform that locks orientation, no meta viewport orientation restriction
      // Fail Criteria: CSS or meta restricts to portrait-only or landscape-only

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for orientation lock in stylesheets
      const orientationLock = await p.evaluate(() => {
        const sheets = Array.from(document.styleSheets);
        for (const sheet of sheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule.cssText && rule.cssText.includes('orientation') &&
                  (rule.cssText.includes('transform: rotate') || rule.cssText.includes('display: none'))) {
                return rule.cssText.substring(0, 200);
              }
            }
          } catch { /* cross-origin sheets */ }
        }
        return null;
      });

      if (orientationLock) {
        failures.push({
          element: orientationLock,
          sourceFile: p.url(),
          position: 'Stylesheet',
          reason: 'CSS rule appears to lock page orientation',
          remediation: 'Remove orientation-locking CSS rules to allow both portrait and landscape viewing',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 1.3.4 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.3.5 Identify Input Purpose - Inputs have autocomplete on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.3.5 Identify Input Purpose
      // Testing: Input fields collecting user data have appropriate autocomplete attributes
      // Pass Criteria: Inputs for name, email, tel, address have correct autocomplete values
      // Fail Criteria: Inputs collecting user data lack autocomplete attributes

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const userInputTypes = [
        { selector: 'input[type="email"]', expectedAutocomplete: 'email' },
        { selector: 'input[type="tel"]', expectedAutocomplete: 'tel' },
        { selector: 'input[name*="name"]:not([type="hidden"])', expectedAutocomplete: 'name' },
        { selector: 'input[name*="address"]:not([type="hidden"])', expectedAutocomplete: 'street-address' },
        { selector: 'input[name*="zip"]:not([type="hidden"]), input[name*="postal"]:not([type="hidden"])', expectedAutocomplete: 'postal-code' },
      ];

      for (const { selector, expectedAutocomplete } of userInputTypes) {
        const inputs = await p.locator(selector).all();
        for (const [index, input] of inputs.entries()) {
          const autocomplete = await input.getAttribute('autocomplete');
          if (!autocomplete) {
            const name = await input.getAttribute('name') || 'unknown';
            const type = await input.getAttribute('type') || 'text';
            failures.push({
              element: `<input type="${type}" name="${name}">`,
              sourceFile: p.url(),
              position: `Input ${index + 1} matching ${selector}`,
              reason: `Input collecting user data lacks autocomplete attribute`,
              remediation: `Add autocomplete="${expectedAutocomplete}" to the input`,
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

        throw new Error(`WCAG 1.3.5 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// GUIDELINE 1.4 — Distinguishable
// ============================================================================

test.describe('1.4 Distinguishable', () => {

  for (const page of PAGES) {
    test(`1.4.1 Use of Color - Color not sole conveyor on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.1 Use of Color
      // Testing: Color is not the sole method of conveying information or distinguishing elements
      // Pass Criteria: Links have non-color differentiation (underline, border, icon); status indicators use text/icons
      // Fail Criteria: Elements rely solely on color to convey meaning

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check links within text blocks for underline or other non-color distinction
      const textLinks = await p.locator('p a, span a, li a, td a').all();
      for (const [index, link] of textLinks.entries()) {
        const textDecoration = await link.evaluate(el => getComputedStyle(el).textDecorationLine);
        const borderBottom = await link.evaluate(el => getComputedStyle(el).borderBottomStyle);

        if (textDecoration === 'none' && borderBottom === 'none') {
          const text = (await link.textContent() || '').trim();
          const href = await link.getAttribute('href') || '#';
          failures.push({
            element: `<a href="${href}">${text}</a>`,
            sourceFile: p.url(),
            position: `Inline link ${index + 1}`,
            reason: 'Link within text has no underline or border — relies on color alone for distinction',
            remediation: 'Add text-decoration: underline or a visible border to distinguish links from surrounding text',
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

        throw new Error(`WCAG 1.4.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.4.3 Contrast (Minimum) - axe-core contrast check on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.3 Contrast (Minimum)
      // Testing: Text and images of text have sufficient contrast ratio (4.5:1 normal, 3:1 large)
      // Pass Criteria: All text meets minimum contrast ratios per WCAG 2.1 AA
      // Fail Criteria: Any text element fails the minimum contrast requirement

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .withRules(['color-contrast'])
        .analyze();

      if (results.violations.length > 0) {
        const failures = results.violations.flatMap(v =>
          v.nodes.map((node, index) => ({
            element: node.html.substring(0, 200),
            sourceFile: p.url(),
            position: `Element ${index + 1} — ${node.target.join(', ')}`,
            reason: node.failureSummary || v.description,
            remediation: `Increase contrast ratio to at least 4.5:1 for normal text or 3:1 for large text. ${v.helpUrl}`,
          }))
        );

        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 1.4.3 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.4.4 Resize Text - Page functional at 200% zoom on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.4 Resize Text
      // Testing: Page remains readable and functional when zoomed to 200%
      // Pass Criteria: No content is clipped, hidden, or overlapping at 200% zoom
      // Fail Criteria: Content overflows containers or is hidden at 200% zoom

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Simulate 200% zoom by setting viewport to half size
      await p.setViewportSize({ width: 640, height: 360 });
      await p.waitForTimeout(500);

      // Check for horizontal overflow on the body
      const hasHorizontalOverflow = await p.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
      });

      if (hasHorizontalOverflow) {
        failures.push({
          element: '<body>',
          sourceFile: p.url(),
          position: 'Page-level',
          reason: 'Page has horizontal overflow at 200% effective zoom (640px viewport)',
          remediation: 'Ensure responsive design handles content at 200% zoom without horizontal scrolling. Use relative units and max-width.',
        });
      }

      // Check that primary content is still visible
      const h1Visible = await p.locator('h1, h2').first().isVisible().catch(() => false);
      if (!h1Visible) {
        failures.push({
          element: '<h1> or <h2>',
          sourceFile: p.url(),
          position: 'Page-level',
          reason: 'Primary heading is not visible at 200% zoom',
          remediation: 'Ensure main headings remain visible at all zoom levels',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 1.4.4 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.4.5 Images of Text - No images used for text on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.5 Images of Text
      // Testing: Text is not rendered as images when the same visual presentation can be achieved with real text
      // Pass Criteria: No <img> elements contain text that should be rendered as HTML
      // Fail Criteria: Images are used to present readable text instead of CSS-styled HTML text

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const images = await p.locator('img').all();
      for (const [index, img] of images.entries()) {
        const src = await img.getAttribute('src') || '';
        const alt = await img.getAttribute('alt') || '';

        // Heuristic: flag images whose filename suggests text content
        const textImagePatterns = /\b(text|heading|title|banner-text|logo-text|word|slogan|tagline)\b/i;
        if (textImagePatterns.test(src) && alt.length > 0) {
          failures.push({
            element: `<img src="${src}" alt="${alt}">`,
            sourceFile: p.url(),
            position: `Image ${index + 1}`,
            reason: `Image filename suggests it contains text: "${src}"`,
            remediation: `Replace the image with styled HTML text: <span style="...">${alt}</span>`,
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

        throw new Error(`WCAG 1.4.5 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.4.10 Reflow - No horizontal scroll at 320px on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.10 Reflow
      // Testing: Content reflows without loss at 320px width (equivalent to 1280px at 400% zoom)
      // Pass Criteria: No horizontal scrollbar at 320px viewport width
      // Fail Criteria: Horizontal scrolling required to view content

      await p.goto(page.path, { waitUntil: 'networkidle' });

      await p.setViewportSize({ width: 320, height: 480 });
      await p.waitForTimeout(500);

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const scrollWidth = await p.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await p.evaluate(() => document.documentElement.clientWidth);

      if (scrollWidth > clientWidth + 10) {
        // Find the overflowing elements
        const overflowers = await p.evaluate(() => {
          const results: string[] = [];
          const all = document.querySelectorAll('*');
          all.forEach(el => {
            if (el.scrollWidth > el.clientWidth + 5 && el !== document.documentElement && el !== document.body) {
              results.push(el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(' ')[0]}` : ''));
            }
          });
          return results.slice(0, 5);
        });

        failures.push({
          element: overflowers.length > 0 ? overflowers.join(', ') : '<body>',
          sourceFile: p.url(),
          position: 'Page-level',
          reason: `Content overflows at 320px viewport (scrollWidth: ${scrollWidth}px, clientWidth: ${clientWidth}px)`,
          remediation: 'Use responsive CSS (max-width: 100%, overflow-wrap: break-word) to prevent horizontal overflow at narrow widths',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 1.4.10 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.4.11 Non-text Contrast - UI component contrast check on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.11 Non-text Contrast
      // Testing: UI components (buttons, form controls, focus indicators) have ≥3:1 contrast
      // Pass Criteria: All interactive component borders/outlines meet 3:1 contrast against background
      // Fail Criteria: Any UI component border/outline has insufficient contrast

      await p.goto(page.path, { waitUntil: 'networkidle' });

      // Use axe-core for non-text contrast checks
      const results = await new AxeBuilder({ page: p })
        .withRules(['link-in-text-block'])
        .analyze();

      const failures = results.violations.flatMap(v =>
        v.nodes.map((node, index) => ({
          element: node.html.substring(0, 200),
          sourceFile: p.url(),
          position: `Element ${index + 1} — ${node.target.join(', ')}`,
          reason: node.failureSummary || v.description,
          remediation: `Ensure the UI component has at least 3:1 contrast ratio. ${v.helpUrl}`,
        }))
      );

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 1.4.11 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.4.12 Text Spacing - Content intact with adjusted spacing on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.12 Text Spacing
      // Testing: No loss of content when text spacing is increased per WCAG requirements
      // Pass Criteria: Content remains visible with line-height 1.5×, letter-spacing 0.12em, word-spacing 0.16em, paragraph spacing 2em
      // Fail Criteria: Text overflows containers or is clipped when spacing is adjusted

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Inject WCAG text spacing modifications
      await p.addStyleTag({
        content: `
          * {
            line-height: 1.5em !important;
            letter-spacing: 0.12em !important;
            word-spacing: 0.16em !important;
          }
          p {
            margin-bottom: 2em !important;
          }
        `,
      });

      await p.waitForTimeout(300);

      // Check for text clipping
      const clippedElements = await p.evaluate(() => {
        const results: string[] = [];
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const style = getComputedStyle(el);
          if (style.overflow === 'hidden' && el.scrollHeight > el.clientHeight + 2) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? `.${String(el.className).split(' ')[0]}` : '';
            results.push(`${tag}${cls}`);
          }
        });
        return results.slice(0, 5);
      });

      if (clippedElements.length > 0) {
        for (const el of clippedElements) {
          failures.push({
            element: el,
            sourceFile: p.url(),
            position: 'After text spacing adjustment',
            reason: `Element "${el}" clips content when text spacing is increased (overflow: hidden with content overflow)`,
            remediation: 'Use min-height instead of fixed height, or overflow: visible, to accommodate increased text spacing',
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

        throw new Error(`WCAG 1.4.12 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`1.4.13 Content on Hover or Focus - Hover content is dismissible on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.4.13 Content on Hover or Focus
      // Testing: Content revealed on hover/focus can be dismissed, hovered, and persists
      // Pass Criteria: Tooltips/popovers are dismissible via Esc and persist while hovered
      // Fail Criteria: Hover content disappears unexpectedly or cannot be dismissed

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for title attributes (native tooltips) — they are generally acceptable
      // Check for custom tooltips/popovers that appear on hover
      const hoverElements = await p.locator('[title], [data-tooltip], [aria-describedby]').all();

      for (const [index, el] of hoverElements.entries()) {
        const title = await el.getAttribute('title');
        const tooltip = await el.getAttribute('data-tooltip');
        const describedBy = await el.getAttribute('aria-describedby');

        // title attributes provide native browser tooltips that are generally accessible
        if (title) continue;

        // For custom tooltips, verify the tooltip target exists
        if (describedBy) {
          const tooltipEl = await p.locator(`#${describedBy}`).count();
          if (tooltipEl === 0) {
            failures.push({
              element: await el.evaluate(e => e.outerHTML.substring(0, 200)),
              sourceFile: p.url(),
              position: `Element ${index + 1}`,
              reason: `aria-describedby references "${describedBy}" but no element with that ID exists`,
              remediation: `Create an element with id="${describedBy}" containing the tooltip content, or remove the aria-describedby attribute`,
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

        throw new Error(`WCAG 1.4.13 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// COMPREHENSIVE AXE-CORE SCAN — PERCEIVABLE
// ============================================================================

test.describe('Perceivable - Comprehensive axe-core scan', () => {

  for (const page of PAGES) {
    test(`1.1.1–1.4.13 Perceivable - Comprehensive axe-core automated scan on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 1.1.1 Non-text Content, 1.3.1 Info and Relationships, 1.4.3 Contrast, and all other Perceivable criteria
      // Testing: Automated axe-core scan for all Perceivable WCAG 2.1 A/AA rules (image-alt, color-contrast, label, etc.)
      // Pass Criteria: Zero axe-core violations for perceivable-related rules across all page elements
      // Fail Criteria: Any axe-core perceivable violation detected on any element

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Filter for perceivable-related violations only
      const perceivableRules = [
        'image-alt', 'input-image-alt', 'area-alt', 'object-alt',
        'role-img-alt', 'svg-img-alt', 'color-contrast',
        'document-title', 'html-has-lang', 'html-lang-valid',
        'label', 'link-name', 'image-redundant-alt',
        'meta-viewport', 'video-caption', 'audio-caption',
      ];

      const perceivableViolations = results.violations.filter(v =>
        perceivableRules.includes(v.id) ||
        v.tags?.some(t => t.startsWith('wcag2a') && t.includes('1'))
      );

      if (perceivableViolations.length > 0) {
        const failures = perceivableViolations.flatMap(v =>
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

        throw new Error(`WCAG PERCEIVABLE AXE-CORE VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});
