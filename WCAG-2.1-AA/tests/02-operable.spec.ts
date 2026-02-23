import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA — Operable Tests
 * Criteria: 2.1.x, 2.2.x, 2.3.x, 2.4.x, 2.5.x
 *
 * Interface forms, controls, and navigation are operable.
 */

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

test.describe('Operable — Guideline 2.1: Keyboard Accessible', () => {
  test('2.1.1 Keyboard — All interactive elements are keyboard accessible', async ({ page }) => {
    // WCAG Criterion: 2.1.1 Keyboard
    // Testing: All buttons, links, and controls are reachable via Tab and activatable via Enter/Space
    // Pass Criteria: Every interactive element can receive keyboard focus via Tab
    // Fail Criteria: Any interactive element cannot be reached by keyboard navigation

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

      const interactiveElements = await page
        .locator('a[href], button, input, select, textarea, [role="button"], [role="link"], [tabindex]')
        .all();

      for (const [index, el] of interactiveElements.entries()) {
        const tagName = await el.evaluate((e) => e.tagName.toLowerCase());
        const tabindex = await el.getAttribute('tabindex');
        const isHidden = !(await el.isVisible());

        // Skip hidden elements
        if (isHidden) continue;

        // Check if tabindex is negative (explicitly removed from tab order)
        if (tabindex && parseInt(tabindex, 10) < 0) {
          const outerHTML = await el.evaluate((e) => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Interactive element ${index + 1} (${tagName})`,
            reason: `Element has tabindex="${tabindex}" which removes it from keyboard navigation`,
            remediation: 'Remove negative tabindex or provide an alternative keyboard-accessible mechanism',
          });
        }

        // Check that clickable divs/spans have tabindex="0" and keyboard handlers
        if (['div', 'span'].includes(tagName)) {
          const role = await el.getAttribute('role');
          const hasClickHandler = await el.evaluate((e) => {
            return e.hasAttribute('onclick') || e.hasAttribute('onkeydown') || e.hasAttribute('onkeyup');
          });

          if (!role && !tabindex) {
            const outerHTML = await el.evaluate((e) => e.outerHTML.substring(0, 200));
            failures.push({
              element: outerHTML,
              sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
              position: `Interactive element ${index + 1} (${tagName})`,
              reason: 'Non-semantic element used for interaction without role or tabindex',
              remediation: 'Use <button> or <a> instead, or add role="button" and tabindex="0"',
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

      throw new Error(`WCAG 2.1.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.1.2 No Keyboard Trap — Focus is never trapped', async ({ page }) => {
    // WCAG Criterion: 2.1.2 No Keyboard Trap
    // Testing: Tab key can move focus through and out of all page sections without getting stuck
    // Pass Criteria: After tabbing through 100 elements, focus returns to the browser chrome or cycles
    // Fail Criteria: Focus gets stuck on the same element after repeated Tab presses

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

      const focusedElements: string[] = [];
      let stuckCount = 0;
      let lastFocused = '';

      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('Tab');
        const currentFocused = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? `${el.tagName}.${el.className}#${el.id}` : 'none';
        });

        if (currentFocused === lastFocused) {
          stuckCount++;
        } else {
          stuckCount = 0;
        }

        if (stuckCount > 5) {
          failures.push({
            element: currentFocused,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Tab stop ${i + 1}`,
            reason: `Keyboard focus appears trapped on element: ${currentFocused}`,
            remediation: 'Ensure Tab can move focus away from all interactive elements. Check for focus traps in modals or custom widgets.',
          });
          break;
        }

        lastFocused = currentFocused;
      }
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 2.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Operable — Guideline 2.4: Navigable', () => {
  test('2.4.1 Bypass Blocks — Skip navigation link exists', async ({ page }) => {
    // WCAG Criterion: 2.4.1 Bypass Blocks
    // Testing: A "Skip to content" link exists to bypass repeated navigation blocks
    // Pass Criteria: A skip link is present (visible or becomes visible on focus) and links to main content
    // Fail Criteria: No skip navigation mechanism exists

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

      // Look for a skip link
      const skipLinks = await page
        .locator(
          'a[href="#main"], a[href="#content"], a[href="#main-content"], a:text-matches("skip", "i")'
        )
        .all();

      // Also check if there are landmark regions as an alternative
      const hasMain = (await page.locator('main, [role="main"]').count()) > 0;
      const hasNav = (await page.locator('nav, [role="navigation"]').count()) > 0;
      const hasLandmarks = hasMain && hasNav;

      if (skipLinks.length === 0 && !hasLandmarks) {
        failures.push({
          element: 'N/A',
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Page level',
          reason: 'No skip navigation link found and no landmark regions to serve as alternative',
          remediation:
            'Add <a href="#main-content" class="skip-link">Skip to main content</a> as the first focusable element',
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

      throw new Error(`WCAG 2.4.1 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.4.2 Page Titled — Each page has a descriptive title', async ({ page }) => {
    // WCAG Criterion: 2.4.2 Page Titled
    // Testing: Each page has a descriptive and informative <title>
    // Pass Criteria: Page title is present, non-empty, and descriptive of the page content
    // Fail Criteria: Page title is missing, empty, or generic (e.g., "Untitled")

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

      const title = await page.title();
      const genericTitles = ['', 'untitled', 'home', 'page', 'document', 'index', 'undefined', 'null'];

      if (!title || genericTitles.includes(title.toLowerCase().trim())) {
        failures.push({
          element: `<title>${title || ''}</title>`,
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: 'Document head',
          reason: title ? `Page title "${title}" is too generic` : 'Page title is missing',
          remediation: `Add a descriptive <title> that identifies the page content, e.g., "Pizza Palace - ${pageInfo.name}"`,
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

      throw new Error(`WCAG 2.4.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.4.3 Focus Order — Tab order is logical and intuitive', async ({ page }) => {
    // WCAG Criterion: 2.4.3 Focus Order
    // Testing: Keyboard Tab order follows the visual layout logically
    // Pass Criteria: Tab moves left-to-right, top-to-bottom following visual flow
    // Fail Criteria: Focus jumps to unexpected locations that don't match visual order

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const focusPositions: Array<{ tag: string; top: number; left: number; text: string }> = [];

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const rect = el.getBoundingClientRect();
        return {
          tag: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`,
          top: rect.top,
          left: rect.left,
          text: (el.textContent || '').trim().substring(0, 50),
        };
      });

      if (info) {
        focusPositions.push(info);
      }
    }

    // Check for large backwards jumps in vertical position (suggesting illogical order)
    for (let i = 1; i < focusPositions.length; i++) {
      const prev = focusPositions[i - 1];
      const curr = focusPositions[i];

      // Allow some tolerance for items on the same row
      if (curr.top < prev.top - 200) {
        // This is a large backwards jump — might be a focus order issue
        // Only flag if it's clearly wrong (skipping back more than 200px vertically)
        failures.push({
          element: `${curr.tag} ("${curr.text}")`,
          sourceFile: 'Home page (/)',
          position: `Tab stop ${i + 1}`,
          reason: `Focus jumped backwards from (top:${Math.round(prev.top)}) to (top:${Math.round(curr.top)}), potentially illogical focus order`,
          remediation: 'Review source order of elements to match visual layout. Avoid positive tabindex values.',
        });
      }
    }

    // Check for positive tabindex values (generally discouraged)
    const positiveTabindex = await page.locator('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').all();
    for (const [index, el] of positiveTabindex.entries()) {
      const tabindex = await el.getAttribute('tabindex');
      if (tabindex && parseInt(tabindex, 10) > 0) {
        const outerHTML = await el.evaluate((e) => e.outerHTML.substring(0, 200));
        failures.push({
          element: outerHTML,
          sourceFile: 'Home page (/)',
          position: `Element with tabindex="${tabindex}"`,
          reason: `Positive tabindex="${tabindex}" can create confusing focus order`,
          remediation: 'Remove positive tabindex and rely on DOM order for focus sequence',
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

      throw new Error(`WCAG 2.4.3 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.4.4 Link Purpose (In Context) — Links have descriptive text', async ({ page }) => {
    // WCAG Criterion: 2.4.4 Link Purpose (In Context)
    // Testing: Every link has text that describes its purpose, either alone or with context
    // Pass Criteria: All links have descriptive text or aria-label
    // Fail Criteria: Any link has ambiguous text like "click here", "read more", or empty text

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    const ambiguousTexts = ['click here', 'here', 'read more', 'more', 'learn more', 'link', 'click'];

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const links = await page.locator('a[href]').all();

      for (const [index, link] of links.entries()) {
        const text = (await link.textContent())?.trim() || '';
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        const href = await link.getAttribute('href');
        const hasImage = (await link.locator('img[alt]').count()) > 0;

        const accessibleName = ariaLabel || text;

        if (!accessibleName && !hasImage && !title) {
          failures.push({
            element: `a[href="${href}"]`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Link element ${index + 1}`,
            reason: 'Link has no accessible name (empty text, no aria-label, no title, no alt on inner image)',
            remediation: `Add descriptive text or aria-label to <a href="${href}">`,
          });
        } else if (accessibleName && ambiguousTexts.includes(accessibleName.toLowerCase())) {
          failures.push({
            element: `a[href="${href}"] with text "${accessibleName}"`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Link element ${index + 1}`,
            reason: `Link text "${accessibleName}" is ambiguous and does not describe the link purpose`,
            remediation: `Change link text to describe the destination, e.g., "View our pizza menu" instead of "${accessibleName}"`,
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

      throw new Error(`WCAG 2.4.4 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.4.5 Multiple Ways — Multiple navigation methods exist', async ({ page }) => {
    // WCAG Criterion: 2.4.5 Multiple Ways
    // Testing: At least two navigation mechanisms are available (nav links, search, sitemap, etc.)
    // Pass Criteria: Page has at least two of: navigation menu, search, sitemap, breadcrumbs
    // Fail Criteria: Only one way to find other pages

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    let navigationMethods = 0;

    // Check for navigation menu
    const hasNav = (await page.locator('nav, [role="navigation"]').count()) > 0;
    if (hasNav) navigationMethods++;

    // Check for search functionality
    const hasSearch =
      (await page.locator('input[type="search"], [role="search"], form[role="search"]').count()) > 0;
    if (hasSearch) navigationMethods++;

    // Check for sitemap link
    const hasSitemap = (await page.locator('a[href*="sitemap"], a:text-matches("site ?map", "i")').count()) > 0;
    if (hasSitemap) navigationMethods++;

    // Check for breadcrumbs
    const hasBreadcrumbs = (await page.locator('[aria-label="breadcrumb"], nav.breadcrumb, .breadcrumbs').count()) > 0;
    if (hasBreadcrumbs) navigationMethods++;

    // Check for links to other pages (which serves as a linked list)
    const hasMultipleLinks = (await page.locator('nav a[href]').count()) >= 2;
    if (hasMultipleLinks) navigationMethods++;

    if (navigationMethods < 2) {
      failures.push({
        element: 'Navigation system',
        sourceFile: 'Home page (/)',
        position: 'Page level',
        reason: `Only ${navigationMethods} navigation method(s) found. WCAG requires at least 2.`,
        remediation:
          'Add additional navigation methods such as a search bar, sitemap, breadcrumbs, or table of contents',
      });
    }

    if (failures.length > 0) {
      const errorReport = failures
        .map(
          (f) =>
            `❌ FAILURE in ${f.sourceFile} at ${f.position}\n         Reason: ${f.reason}\n         Element: ${f.element}\n         Fix: ${f.remediation}`
        )
        .join('\n\n');

      throw new Error(`WCAG 2.4.5 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.4.6 Headings and Labels — Headings and labels are informative', async ({ page }) => {
    // WCAG Criterion: 2.4.6 Headings and Labels
    // Testing: All headings and form labels meaningfully describe their sections/controls
    // Pass Criteria: All headings have non-empty, descriptive text
    // Fail Criteria: Any heading is empty or has generic text

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

      for (const [index, heading] of headings.entries()) {
        const text = (await heading.textContent())?.trim() || '';
        const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());

        if (!text) {
          const outerHTML = await heading.evaluate((el) => el.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `${tagName} element ${index + 1}`,
            reason: 'Heading element has empty text content',
            remediation: `Add descriptive text to the <${tagName}> element`,
          });
        }
      }

      // Check labels
      const labels = await page.locator('label').all();
      for (const [index, label] of labels.entries()) {
        const text = (await label.textContent())?.trim() || '';
        const forAttr = await label.getAttribute('for');

        if (!text) {
          failures.push({
            element: `<label for="${forAttr}">`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Label element ${index + 1}`,
            reason: 'Label element has empty text content',
            remediation: 'Add descriptive text to the label that identifies the associated input',
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

      throw new Error(`WCAG 2.4.6 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.4.7 Focus Visible — All focusable elements have visible focus indicators', async ({ page }) => {
    // WCAG Criterion: 2.4.7 Focus Visible
    // Testing: Elements show a visible focus indicator (outline, border, etc.) when focused via keyboard
    // Pass Criteria: All focusable elements have a distinguishable focus ring/outline
    // Fail Criteria: Any element lacks a visible focus indicator

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focusInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;

        const styles = window.getComputedStyle(el);
        const outlineStyle = styles.outline;
        const outlineWidth = styles.outlineWidth;
        const boxShadow = styles.boxShadow;
        const borderColor = styles.borderColor;

        const hasOutline = outlineStyle !== 'none' && outlineWidth !== '0px';
        const hasBoxShadow = boxShadow !== 'none';

        return {
          tag: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`,
          text: (el.textContent || '').trim().substring(0, 50),
          html: el.outerHTML.substring(0, 200),
          hasOutline,
          hasBoxShadow,
          outlineStyle: outlineStyle,
        };
      });

      if (focusInfo && !focusInfo.hasOutline && !focusInfo.hasBoxShadow) {
        failures.push({
          element: focusInfo.html,
          sourceFile: 'Home page (/)',
          position: `Tab stop ${i + 1} (${focusInfo.tag})`,
          reason: `No visible focus indicator detected (outline: ${focusInfo.outlineStyle})`,
          remediation:
            'Add a visible focus style, e.g., :focus-visible { outline: 2px solid #4A90D9; outline-offset: 2px; }',
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

      throw new Error(`WCAG 2.4.7 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Operable — Guideline 2.5: Input Modalities', () => {
  test('2.5.3 Label in Name — Accessible names include visible text', async ({ page }) => {
    // WCAG Criterion: 2.5.3 Label in Name
    // Testing: Components with visible text have accessible names that include that text
    // Pass Criteria: aria-label or aria-labelledby values contain the visible text
    // Fail Criteria: Accessible name differs completely from visible text

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

      // Check elements with aria-label
      const ariaLabelElements = await page.locator('[aria-label]').all();

      for (const [index, el] of ariaLabelElements.entries()) {
        const ariaLabel = (await el.getAttribute('aria-label'))?.toLowerCase() || '';
        const visibleText = ((await el.textContent())?.trim() || '').toLowerCase();

        if (visibleText && visibleText.length > 1 && !ariaLabel.includes(visibleText)) {
          const outerHTML = await el.evaluate((e) => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${index + 1}`,
            reason: `Accessible name "${ariaLabel}" does not include visible text "${visibleText}"`,
            remediation: `Update aria-label to include the visible text: aria-label="${visibleText}..."`,
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

      throw new Error(`WCAG 2.5.3 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('2.5.8 Target Size (Minimum) — Interactive targets are at least 24x24px', async ({ page }) => {
    // WCAG Criterion: 2.5.8 Target Size (Minimum)
    // Testing: All clickable targets meet the minimum 24x24 pixel size requirement
    // Pass Criteria: All interactive elements have bounding boxes of at least 24x24 pixels
    // Fail Criteria: Any interactive target is smaller than 24x24 pixels without exemptions

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

      const targets = await page.locator('button, a[href], input, select, [role="button"]').all();

      for (const [index, target] of targets.entries()) {
        const isVisible = await target.isVisible();
        if (!isVisible) continue;

        const box = await target.boundingBox();
        if (!box) continue;

        // Check for inline links (exempted if within a sentence)
        const tagName = await target.evaluate((el) => el.tagName.toLowerCase());
        const isInlineLinkInText = tagName === 'a' && (await target.evaluate((el) => {
          const parent = el.parentElement;
          if (!parent) return false;
          const parentText = parent.textContent || '';
          const linkText = el.textContent || '';
          // If the link text is a small portion of the parent and parent has text around it
          return parentText.length > linkText.length + 10;
        }));

        if (isInlineLinkInText) continue; // Inline text links are exempt

        if (box.width < 24 || box.height < 24) {
          const text = ((await target.textContent()) || '').trim().substring(0, 50);
          failures.push({
            element: `${tagName}${text ? ` ("${text}")` : ''}`,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${index + 1}`,
            reason: `Target size is ${Math.round(box.width)}x${Math.round(box.height)}px (minimum is 24x24px)`,
            remediation:
              'Increase the element size with min-width/min-height: 24px, or add padding to meet the target size',
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

      throw new Error(`WCAG 2.5.8 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Operable — axe-core Full Scan', () => {
  test('2.x.x Operable — Full axe-core keyboard and navigation scan', async ({ page }) => {
    // WCAG Criterion: All Operable criteria (2.1.x through 2.5.x)
    // Testing: Comprehensive axe-core scan for keyboard, navigation, and input-related rules
    // Pass Criteria: Zero axe-core violations for operable rules
    // Fail Criteria: Any axe-core violation detected in operable category

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

      const operableRules = [
        'bypass',
        'tabindex',
        'focus-order-semantics',
        'skip-link',
        'page-has-heading-one',
        'accesskeys',
        'frame-title',
        'server-side-image-map',
        'scrollable-region-focusable',
      ];

      const operableViolations = results.violations.filter(
        (v) =>
          operableRules.includes(v.id) ||
          v.tags.some((t) => t.startsWith('cat.keyboard') || t.startsWith('cat.navigation') || t.startsWith('cat.time-and-media'))
      );

      for (const violation of operableViolations) {
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
        `WCAG OPERABLE VIOLATIONS FOUND (${allFailures.length} total):\n\n${errorReport}`
      );
    }
  });
});
