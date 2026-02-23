import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA — Robust Tests
 * Criteria: 4.1.x
 *
 * Content must be robust enough that it can be interpreted reliably
 * by a wide variety of user agents, including assistive technologies.
 */

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

test.describe('Robust — Guideline 4.1: Compatible', () => {
  test('4.1.2 Name, Role, Value — ARIA attributes are valid', async ({ page }) => {
    // WCAG Criterion: 4.1.2 Name, Role, Value
    // Testing: All ARIA roles, states, and properties are valid and correctly used
    // Pass Criteria: No invalid ARIA attributes, roles are used on appropriate elements
    // Fail Criteria: Invalid or misused ARIA attributes found

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
      'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
      'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
      'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
      'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
      'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
      'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
      'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab',
      'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip',
      'tree', 'treegrid', 'treeitem',
    ];

    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Check for invalid role values
      const roleElements = await page.locator('[role]').all();
      for (const [index, el] of roleElements.entries()) {
        const role = await el.getAttribute('role');
        if (role && !validRoles.includes(role.trim().toLowerCase())) {
          const outerHTML = await el.evaluate((e) => e.outerHTML.substring(0, 200));
          failures.push({
            element: outerHTML,
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${index + 1}`,
            reason: `Invalid ARIA role: "${role}"`,
            remediation: `Use a valid ARIA role. See https://www.w3.org/TR/wai-aria-1.1/#role_definitions`,
          });
        }
      }

      // Check for aria-* attributes without valid ARIA prefixes
      const ariaElements = await page.evaluate(() => {
        const results: Array<{ html: string; invalidAttrs: string[] }> = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const invalidAttrs: string[] = [];
          for (const attr of el.attributes) {
            if (attr.name.startsWith('aria-')) {
              const validAriaAttrs = [
                'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy',
                'aria-checked', 'aria-colcount', 'aria-colindex', 'aria-colspan',
                'aria-controls', 'aria-current', 'aria-describedby', 'aria-details',
                'aria-disabled', 'aria-dropeffect', 'aria-errormessage', 'aria-expanded',
                'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden',
                'aria-invalid', 'aria-keyshortcuts', 'aria-label', 'aria-labelledby',
                'aria-level', 'aria-live', 'aria-modal', 'aria-multiline',
                'aria-multiselectable', 'aria-orientation', 'aria-owns', 'aria-placeholder',
                'aria-posinset', 'aria-pressed', 'aria-readonly', 'aria-relevant',
                'aria-required', 'aria-roledescription', 'aria-rowcount', 'aria-rowindex',
                'aria-rowspan', 'aria-selected', 'aria-setsize', 'aria-sort',
                'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext',
              ];
              if (!validAriaAttrs.includes(attr.name)) {
                invalidAttrs.push(attr.name);
              }
            }
          }
          if (invalidAttrs.length > 0) {
            results.push({
              html: el.outerHTML.substring(0, 200),
              invalidAttrs,
            });
          }
        }
        return results;
      });

      for (const [index, item] of ariaElements.entries()) {
        failures.push({
          element: item.html,
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: `Element ${index + 1}`,
          reason: `Invalid ARIA attribute(s): ${item.invalidAttrs.join(', ')}`,
          remediation: 'Remove or replace invalid ARIA attributes with valid ones from the WAI-ARIA specification',
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

      throw new Error(`WCAG 4.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('4.1.2 Name, Role, Value — Custom controls have proper semantic roles', async ({ page }) => {
    // WCAG Criterion: 4.1.2 Name, Role, Value
    // Testing: Custom UI components (non-standard HTML) have appropriate ARIA roles
    // Pass Criteria: All interactive custom components have roles that convey their purpose
    // Fail Criteria: Custom interactive components lack semantic meaning

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

      // Find div/span elements with click handlers or tabindex that lack roles
      const customInteractive = await page.evaluate(() => {
        const results: Array<{ html: string; tag: string; hasOnClick: boolean }> = [];
        const elements = document.querySelectorAll('div[onclick], span[onclick], div[tabindex="0"], span[tabindex="0"]');
        for (const el of elements) {
          if (!el.getAttribute('role')) {
            results.push({
              html: el.outerHTML.substring(0, 200),
              tag: el.tagName.toLowerCase(),
              hasOnClick: el.hasAttribute('onclick'),
            });
          }
        }
        return results;
      });

      for (const [index, item] of customInteractive.entries()) {
        failures.push({
          element: item.html,
          sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
          position: `Custom interactive element ${index + 1} (${item.tag})`,
          reason: `Interactive ${item.tag} element lacks an ARIA role`,
          remediation: 'Add role="button" (or appropriate role) and ensure keyboard accessibility',
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

      throw new Error(`WCAG 4.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('4.1.2 Name, Role, Value — All interactive elements have accessible names', async ({ page }) => {
    // WCAG Criterion: 4.1.2 Name, Role, Value
    // Testing: Every interactive element has a computed accessible name
    // Pass Criteria: Buttons, links, inputs, and custom controls all have accessible names
    // Fail Criteria: Any interactive element lacks a computed accessible name

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

      // Use axe-core's specific rules for this
      const results = await new AxeBuilder({ page })
        .withRules([
          'button-name',
          'link-name',
          'input-button-name',
          'input-image-alt',
          'select-name',
          'image-alt',
        ])
        .analyze();

      for (const violation of results.violations) {
        for (const [idx, node] of violation.nodes.entries()) {
          failures.push({
            element: node.html.substring(0, 200),
            sourceFile: `${pageInfo.name} page (${pageInfo.path})`,
            position: `Element ${idx + 1} (rule: ${violation.id})`,
            reason: `${violation.help}: ${node.failureSummary}`,
            remediation: `${violation.helpUrl}`,
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

      throw new Error(`WCAG 4.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });

  test('4.1.3 Status Messages — Dynamic updates use ARIA live regions', async ({ page }) => {
    // WCAG Criterion: 4.1.3 Status Messages
    // Testing: Dynamic status messages are announced to screen readers via ARIA live regions
    // Pass Criteria: Status updates use role="alert", role="status", or aria-live attributes
    // Fail Criteria: Dynamic status changes occur without ARIA live region announcements

    const failures: Array<{
      element: string;
      sourceFile: string;
      position: string;
      reason: string;
      remediation: string;
    }> = [];

    // Test on home page — add item to cart and check for status message
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if there are any ARIA live regions on the page
    const liveRegions = await page
      .locator('[aria-live], [role="alert"], [role="status"], [role="log"]')
      .all();

    // Check for cart badge — it should update dynamically and ideally announce
    const cartBadge = await page.locator('[class*="badge"], [class*="Badge"]').all();

    // Try clicking "Add to Cart" if available
    const addToCartButtons = await page.locator('button:has-text("Add to Cart"), button:has-text("add to cart")').all();

    if (addToCartButtons.length > 0) {
      // Record live regions before action
      const beforeLiveRegionCount = await page
        .locator('[aria-live], [role="alert"], [role="status"]')
        .count();

      await addToCartButtons[0].click();
      await page.waitForTimeout(1000);

      // Check if a live region announced the action
      const afterLiveRegions = await page
        .locator('[aria-live]:not([aria-live="off"]), [role="alert"], [role="status"]')
        .all();

      let hasStatusAnnouncement = false;
      for (const region of afterLiveRegions) {
        const text = ((await region.textContent()) || '').trim();
        if (text.length > 0) {
          hasStatusAnnouncement = true;
          break;
        }
      }

      if (!hasStatusAnnouncement && afterLiveRegions.length === 0) {
        failures.push({
          element: 'Add to Cart action',
          sourceFile: 'Home page (/)',
          position: 'Cart update area',
          reason: 'Adding item to cart does not trigger an ARIA live region announcement',
          remediation:
            'Add an aria-live="polite" region that announces cart updates, e.g., "Pizza added to cart"',
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

      throw new Error(`WCAG 4.1.3 VIOLATIONS FOUND:\n\n${errorReport}`);
    }
  });
});

test.describe('Robust — axe-core Full Scan', () => {
  test('4.x.x Robust — Full axe-core ARIA and parsing scan', async ({ page }) => {
    // WCAG Criterion: All Robust criteria (4.1.x)
    // Testing: Comprehensive axe-core scan for ARIA, parsing, and compatibility rules
    // Pass Criteria: Zero axe-core violations for robust rules
    // Fail Criteria: Any axe-core violation detected in robust category

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

      const robustRules = [
        'aria-allowed-attr',
        'aria-allowed-role',
        'aria-command-name',
        'aria-dialog-name',
        'aria-hidden-body',
        'aria-hidden-focus',
        'aria-input-field-name',
        'aria-meter-name',
        'aria-progressbar-name',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roledescription',
        'aria-roles',
        'aria-text',
        'aria-toggle-field-name',
        'aria-tooltip-name',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'button-name',
        'duplicate-id-aria',
        'link-name',
      ];

      const robustViolations = results.violations.filter(
        (v) =>
          robustRules.includes(v.id) ||
          v.tags.some((t) => t.startsWith('cat.aria') || t.startsWith('cat.parsing'))
      );

      for (const violation of robustViolations) {
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
        `WCAG ROBUST VIOLATIONS FOUND (${allFailures.length} total):\n\n${errorReport}`
      );
    }
  });
});
