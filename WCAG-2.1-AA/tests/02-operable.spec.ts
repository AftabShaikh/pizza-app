import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

// ============================================================================
// GUIDELINE 2.1 — Keyboard Accessible
// ============================================================================

test.describe('2.1 Keyboard Accessible', () => {

  for (const page of PAGES) {
    test(`2.1.1 Keyboard - Interactive elements are keyboard accessible on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.1.1 Keyboard
      // Testing: All interactive elements (buttons, links, form controls) are reachable via keyboard
      // Pass Criteria: Every button, link, and input can receive keyboard focus via Tab
      // Fail Criteria: Any interactive element cannot be reached with keyboard navigation

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const interactiveElements = await p.locator('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]').all();

      for (const [index, el] of interactiveElements.entries()) {
        const tagName = await el.evaluate(e => e.tagName.toLowerCase());
        const tabindex = await el.getAttribute('tabindex');
        const disabled = await el.getAttribute('disabled');
        const ariaHidden = await el.getAttribute('aria-hidden');

        if (disabled !== null) continue;
        if (ariaHidden === 'true') continue;

        // Check for negative tabindex making element unreachable
        if (tabindex !== null && parseInt(tabindex, 10) < 0) {
          const outerHTML = await el.evaluate(e => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: p.url(),
            position: `Interactive element ${index + 1} (${tagName})`,
            reason: `Element has tabindex="${tabindex}" making it unreachable via Tab key`,
            remediation: 'Remove the negative tabindex or set tabindex="0" to include element in tab order',
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

        throw new Error(`WCAG 2.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`2.1.2 No Keyboard Trap - No focus traps on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.1.2 No Keyboard Trap
      // Testing: Keyboard focus is never trapped — user can Tab away from all elements
      // Pass Criteria: After tabbing through all elements, focus returns to browser chrome or cycles
      // Fail Criteria: Focus becomes stuck on any element and Tab key stops working

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Tab through the page and check for focus traps
      const maxTabs = 80;
      const visitedElements: string[] = [];
      let trapDetected = false;

      for (let i = 0; i < maxTabs; i++) {
        await p.keyboard.press('Tab');
        const activeElement = await p.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return 'body';
          return `${el.tagName}#${el.id || ''}.${el.className || ''}`;
        });

        // If we see the same element stuck for 3+ successive tabs, it's a trap
        if (visitedElements.length >= 2 &&
            visitedElements[visitedElements.length - 1] === activeElement &&
            visitedElements[visitedElements.length - 2] === activeElement) {
          trapDetected = true;
          failures.push({
            element: activeElement,
            sourceFile: p.url(),
            position: `Tab press ${i + 1}`,
            reason: `Focus appears trapped on element: ${activeElement}. Tab key pressed 3 times with no focus movement.`,
            remediation: 'Ensure the element does not prevent focus from moving. Remove focus-trapping event handlers or add a mechanism to close/exit the component.',
          });
          break;
        }

        visitedElements.push(activeElement);
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 2.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// GUIDELINE 2.3 — Seizures and Physical Reactions
// ============================================================================

test.describe('2.3 Seizures', () => {

  for (const page of PAGES) {
    test(`2.3.1 Three Flashes - No excessive flashing on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.3.1 Three Flashes or Below Threshold
      // Testing: No content flashes more than 3 times per second
      // Pass Criteria: No CSS animations or elements produce rapid flashing effects
      // Fail Criteria: Any animation or element flashes more than 3 times per second

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for potentially dangerous animation durations
      const flashingElements = await p.evaluate(() => {
        const dangerous: string[] = [];
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const style = getComputedStyle(el);
          const animDuration = parseFloat(style.animationDuration) || 0;
          const animName = style.animationName;

          if (animName && animName !== 'none' && animDuration > 0 && animDuration < 0.333) {
            dangerous.push(`${el.tagName.toLowerCase()}.${el.className || ''} — animation: ${animName} ${animDuration}s`);
          }
        });
        return dangerous;
      });

      for (const el of flashingElements) {
        failures.push({
          element: el,
          sourceFile: p.url(),
          position: 'CSS Animation',
          reason: `Element has animation faster than 333ms (>3 flashes/second): ${el}`,
          remediation: 'Slow down the animation to ensure it does not flash more than 3 times per second, or remove it',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 2.3.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// GUIDELINE 2.4 — Navigable
// ============================================================================

test.describe('2.4 Navigable', () => {

  for (const page of PAGES) {
    test(`2.4.1 Bypass Blocks - Skip navigation link on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.4.1 Bypass Blocks
      // Testing: A "Skip to main content" link is present to bypass repeated navigation
      // Pass Criteria: A skip-nav link exists (visible on focus) that targets the main content area
      // Fail Criteria: No skip navigation link found

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const skipLinks = await p.locator('a[href="#main"], a[href="#main-content"], a[href="#content"], a.skip-nav, a.skip-link, [class*="skip"]').all();

      if (skipLinks.length === 0) {
        // Also check for landmark regions as alternative
        const mainLandmark = await p.locator('main, [role="main"]').count();
        const headings = await p.locator('h1').count();

        if (mainLandmark === 0 && headings === 0) {
          failures.push({
            element: 'N/A',
            sourceFile: p.url(),
            position: 'Page-level',
            reason: 'No skip navigation link, main landmark, or h1 heading found',
            remediation: 'Add a "Skip to main content" link as the first focusable element: <a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>',
          });
        } else if (skipLinks.length === 0) {
          failures.push({
            element: 'N/A',
            sourceFile: p.url(),
            position: 'Page-level',
            reason: 'No "Skip to main content" link found (landmarks/headings present but skip link recommended)',
            remediation: 'Add a "Skip to main content" link: <a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>',
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

        throw new Error(`WCAG 2.4.1 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`2.4.2 Page Titled - Descriptive page title on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.4.2 Page Titled
      // Testing: The page has a descriptive and informative <title>
      // Pass Criteria: <title> exists, is non-empty, and is descriptive (not generic)
      // Fail Criteria: Title is missing, empty, or generic (e.g., "Untitled", "Home")

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const title = await p.title();

      if (!title || title.trim() === '') {
        failures.push({
          element: '<title></title>',
          sourceFile: p.url(),
          position: '<head>',
          reason: 'Page title is missing or empty',
          remediation: 'Add a descriptive <title> element in the <head>',
        });
      } else {
        const genericTitles = ['untitled', 'home', 'page', 'document', 'website', 'index'];
        if (genericTitles.includes(title.trim().toLowerCase())) {
          failures.push({
            element: `<title>${title}</title>`,
            sourceFile: p.url(),
            position: '<head>',
            reason: `Page title "${title}" is too generic`,
            remediation: 'Use a descriptive title that identifies the page content, e.g., "Pizza Palace - Menu"',
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

        throw new Error(`WCAG 2.4.2 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`2.4.3 Focus Order - Logical tab order on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.4.3 Focus Order
      // Testing: The navigation order of links, form controls, etc. is logical and intuitive
      // Pass Criteria: Tab order follows visual reading order (top-to-bottom, left-to-right)
      // Fail Criteria: Tab order jumps to visually unrelated elements

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for positive tabindex values that disrupt natural order
      const positiveTabindex = await p.evaluate(() => {
        const elements = document.querySelectorAll('[tabindex]');
        const issues: Array<{ tag: string; tabindex: string; html: string }> = [];
        elements.forEach(el => {
          const ti = el.getAttribute('tabindex');
          if (ti && parseInt(ti, 10) > 0) {
            issues.push({
              tag: el.tagName.toLowerCase(),
              tabindex: ti,
              html: el.outerHTML.substring(0, 200),
            });
          }
        });
        return issues;
      });

      for (const [index, issue] of positiveTabindex.entries()) {
        failures.push({
          element: issue.html,
          sourceFile: p.url(),
          position: `Element ${index + 1} (${issue.tag})`,
          reason: `Element has tabindex="${issue.tabindex}" which disrupts the natural DOM tab order`,
          remediation: 'Use tabindex="0" to follow natural DOM order, or restructure the HTML so the source order matches the intended reading order',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 2.4.3 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`2.4.4 Link Purpose - Links have descriptive text on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.4.4 Link Purpose (In Context)
      // Testing: The purpose of each link can be determined from text or context
      // Pass Criteria: No links use generic text like "click here", "read more" without context
      // Fail Criteria: Links have ambiguous or empty link text

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const links = await p.locator('a[href]').all();

      for (const [index, link] of links.entries()) {
        const text = (await link.textContent() || '').trim();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        const href = await link.getAttribute('href') || '#';

        const effectiveName = ariaLabel || text || title || '';

        if (effectiveName === '') {
          // Check if link contains an image with alt text
          const imgWithAlt = await link.locator('img[alt]').count();
          const svgTitle = await link.locator('svg title').count();
          if (imgWithAlt === 0 && svgTitle === 0) {
            failures.push({
              element: `<a href="${href}">${text || '(empty)'}</a>`,
              sourceFile: p.url(),
              position: `Link ${index + 1}`,
              reason: 'Link has no accessible name (no text, aria-label, title, or image alt text)',
              remediation: `Add descriptive text inside the link or add aria-label="description" to <a href="${href}">`,
            });
          }
        }

        const genericTexts = ['click here', 'here', 'read more', 'more', 'link', 'learn more'];
        if (genericTexts.includes(effectiveName.toLowerCase())) {
          failures.push({
            element: `<a href="${href}">${effectiveName}</a>`,
            sourceFile: p.url(),
            position: `Link ${index + 1}`,
            reason: `Link text "${effectiveName}" is generic and does not describe the link purpose`,
            remediation: `Replace with descriptive text, e.g., "View pizza menu" instead of "${effectiveName}"`,
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

        throw new Error(`WCAG 2.4.4 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`2.4.6 Headings and Labels - Headings and labels are informative on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.4.6 Headings and Labels
      // Testing: Page headings and labels are informative and descriptive
      // Pass Criteria: All headings have non-empty, descriptive text; form labels are clear
      // Fail Criteria: Empty or ambiguous headings/labels

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const headings = await p.locator('h1, h2, h3, h4, h5, h6').all();

      for (const [index, heading] of headings.entries()) {
        const text = (await heading.textContent() || '').trim();
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());

        if (text === '') {
          failures.push({
            element: `<${tagName}>(empty)</${tagName}>`,
            sourceFile: p.url(),
            position: `Heading ${index + 1}`,
            reason: `Heading <${tagName}> is empty`,
            remediation: `Add descriptive text to the <${tagName}> element`,
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

        throw new Error(`WCAG 2.4.6 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`2.4.7 Focus Visible - Focus indicators are visible on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.4.7 Focus Visible
      // Testing: All focusable elements display a visible focus indicator
      // Pass Criteria: Focusable elements show outline, ring, or border change on focus
      // Fail Criteria: Any focusable element has no visible focus indicator

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for global outline:none or outline:0 without replacement
      const outlineSuppressions = await p.evaluate(() => {
        const results: string[] = [];
        const focusable = document.querySelectorAll('a, button, input, select, textarea, [tabindex="0"]');
        focusable.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.focus();
          const style = getComputedStyle(el);
          const outline = style.outlineStyle;
          const outlineWidth = parseFloat(style.outlineWidth) || 0;
          const boxShadow = style.boxShadow;
          const borderColor = style.borderColor;

          if (outline === 'none' && outlineWidth === 0 && boxShadow === 'none') {
            results.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`);
          }
        });
        return results.slice(0, 5);
      });

      for (const [index, el] of outlineSuppressions.entries()) {
        failures.push({
          element: el,
          sourceFile: p.url(),
          position: `Element ${index + 1}`,
          reason: `Element "${el}" has no visible focus indicator (outline: none, no box-shadow replacement)`,
          remediation: 'Add a focus style: element:focus { outline: 2px solid #4A90D9; } or use focus:ring utilities',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 2.4.7 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// GUIDELINE 2.5 — Input Modalities
// ============================================================================

test.describe('2.5 Input Modalities', () => {

  for (const page of PAGES) {
    test(`2.5.3 Label in Name - Visible labels match accessible names on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.5.3 Label in Name
      // Testing: The accessible name of components includes the visible text
      // Pass Criteria: Every button/link's visible text is contained in its accessible name
      // Fail Criteria: Accessible name does not include the visible text

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const buttons = await p.locator('button[aria-label], a[aria-label]').all();

      for (const [index, btn] of buttons.entries()) {
        const visibleText = (await btn.textContent() || '').trim();
        const ariaLabel = (await btn.getAttribute('aria-label') || '').trim();

        if (visibleText && ariaLabel && !ariaLabel.toLowerCase().includes(visibleText.toLowerCase())) {
          failures.push({
            element: await btn.evaluate(e => e.outerHTML.substring(0, 200)),
            sourceFile: p.url(),
            position: `Element ${index + 1}`,
            reason: `Visible text "${visibleText}" is not included in aria-label "${ariaLabel}"`,
            remediation: `Change aria-label to include the visible text: aria-label="${visibleText} — additional context"`,
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

        throw new Error(`WCAG 2.5.3 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`2.5.8 Target Size - Interactive targets are at least 24x24px on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.5.8 Target Size (Minimum)
      // Testing: Pointer input targets are at least 24×24 pixels
      // Pass Criteria: All interactive elements have a bounding box of at least 24×24px
      // Fail Criteria: Any interactive target is smaller than 24×24 pixels

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const interactiveElements = await p.locator('a[href], button, input:not([type="hidden"]), select, textarea').all();

      for (const [index, el] of interactiveElements.entries()) {
        const isVisible = await el.isVisible().catch(() => false);
        if (!isVisible) continue;

        const box = await el.boundingBox();
        if (box && (box.width < 24 || box.height < 24)) {
          // Exempt inline links in sentences
          const isInline = await el.evaluate(e => {
            const style = getComputedStyle(e);
            return style.display === 'inline' && e.parentElement?.tagName.toLowerCase() === 'p';
          });
          if (isInline) continue;

          const outerHTML = await el.evaluate(e => e.outerHTML.substring(0, 150));
          failures.push({
            element: outerHTML,
            sourceFile: p.url(),
            position: `Element ${index + 1}`,
            reason: `Target size is ${Math.round(box.width)}×${Math.round(box.height)}px, below 24×24px minimum`,
            remediation: 'Increase the element size to at least 24×24px using min-width and min-height, or add padding',
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

        throw new Error(`WCAG 2.5.8 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// COMPREHENSIVE AXE-CORE SCAN — OPERABLE
// ============================================================================

test.describe('Operable - Comprehensive axe-core scan', () => {

  for (const page of PAGES) {
    test(`2.1.1–2.5.8 Operable - Comprehensive axe-core automated scan on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 2.1.1 Keyboard, 2.4.1 Bypass Blocks, 2.4.7 Focus Visible, and all other Operable criteria
      // Testing: Automated axe-core scan for all Operable WCAG 2.1 A/AA rules (keyboard, skip-link, tabindex, focus, etc.)
      // Pass Criteria: Zero axe-core violations for operable-related rules across all page elements
      // Fail Criteria: Any axe-core operable violation detected on any element

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const operableRules = [
        'accesskeys', 'focus-order-semantics', 'skip-link',
        'tabindex', 'bypass', 'link-name', 'frame-title',
        'page-has-heading-one', 'scrollable-region-focusable',
      ];

      const operableViolations = results.violations.filter(v =>
        operableRules.includes(v.id) ||
        v.tags?.some(t => t.includes('keyboard') || t.includes('focus'))
      );

      if (operableViolations.length > 0) {
        const failures = operableViolations.flatMap(v =>
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

        throw new Error(`WCAG OPERABLE AXE-CORE VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});
