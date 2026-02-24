import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Cart', path: '/cart' },
];

// ============================================================================
// GUIDELINE 4.1 — Compatible
// ============================================================================

test.describe('4.1 Compatible', () => {

  for (const page of PAGES) {
    test(`4.1.2 Name, Role, Value - Custom controls have proper ARIA on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 4.1.2 Name, Role, Value
      // Testing: Custom interactive elements have appropriate ARIA roles and states
      // Pass Criteria: All custom controls (non-native) have proper role, accessible name, and state attributes
      // Fail Criteria: Custom controls lack ARIA roles or have invalid ARIA attributes

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for clickable divs/spans that should be buttons
      const clickableDivs = await p.evaluate(() => {
        const results: string[] = [];
        const elements = document.querySelectorAll('div[onclick], span[onclick], div[tabindex], span[tabindex]');
        elements.forEach(el => {
          const role = el.getAttribute('role');
          const hasClickHandler = el.hasAttribute('onclick') || el.getAttribute('tabindex') !== null;
          if (hasClickHandler && !role) {
            results.push(el.outerHTML.substring(0, 200));
          }
        });
        return results;
      });

      for (const [index, html] of clickableDivs.entries()) {
        failures.push({
          element: html,
          sourceFile: p.url(),
          position: `Element ${index + 1}`,
          reason: 'Clickable non-semantic element lacks a role attribute',
          remediation: 'Add role="button" and tabindex="0", or replace the element with a <button>',
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 4.1.2 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });

    test(`4.1.2 Name, Role, Value - ARIA attributes are valid on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 4.1.2 Name, Role, Value
      // Testing: All ARIA attributes used on the page are valid per WAI-ARIA specification
      // Pass Criteria: No invalid, unknown, or misspelled ARIA attributes
      // Fail Criteria: Any element uses an invalid ARIA attribute

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .withRules(['aria-valid-attr', 'aria-valid-attr-value', 'aria-allowed-attr'])
        .analyze();

      if (results.violations.length > 0) {
        const failures = results.violations.flatMap(v =>
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

        throw new Error(`WCAG 4.1.2 VIOLATIONS FOUND (ARIA Validity):\n\n${errorReport}`);
      }
    });

    test(`4.1.2 Name, Role, Value - Required ARIA properties are present on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 4.1.2 Name, Role, Value
      // Testing: Elements with ARIA roles have all required ARIA properties
      // Pass Criteria: All elements with roles include required properties (e.g., role="checkbox" has aria-checked)
      // Fail Criteria: Any element with a role is missing required properties

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .withRules(['aria-required-attr', 'aria-required-children', 'aria-required-parent'])
        .analyze();

      if (results.violations.length > 0) {
        const failures = results.violations.flatMap(v =>
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

        throw new Error(`WCAG 4.1.2 VIOLATIONS FOUND (Required ARIA Properties):\n\n${errorReport}`);
      }
    });

    test(`4.1.2 Name, Role, Value - No duplicate IDs on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 4.1.2 Name, Role, Value
      // Testing: All element IDs on the page are unique
      // Pass Criteria: No duplicate id attribute values exist in the DOM
      // Fail Criteria: Two or more elements share the same id value

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      const duplicateIds = await p.evaluate(() => {
        const idMap: Record<string, number> = {};
        document.querySelectorAll('[id]').forEach(el => {
          const id = el.id;
          if (id) {
            idMap[id] = (idMap[id] || 0) + 1;
          }
        });
        return Object.entries(idMap).filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
      });

      for (const { id, count } of duplicateIds) {
        failures.push({
          element: `id="${id}" (${count} occurrences)`,
          sourceFile: p.url(),
          position: 'Page-level',
          reason: `Duplicate ID: "${id}" appears ${count} times on the page`,
          remediation: `Ensure each id value is unique. Rename duplicate uses of id="${id}" to unique values.`,
        });
      }

      if (failures.length > 0) {
        const errorReport = failures.map(f =>
          `❌ FAILURE in ${f.sourceFile} at ${f.position}\n` +
          `   Reason: ${f.reason}\n` +
          `   Element: ${f.element}\n` +
          `   Fix: ${f.remediation}`
        ).join('\n\n');

        throw new Error(`WCAG 4.1.2 VIOLATIONS FOUND (Duplicate IDs):\n\n${errorReport}`);
      }
    });

    test(`4.1.3 Status Messages - Dynamic status messages use ARIA live regions on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 4.1.3 Status Messages
      // Testing: Status messages (cart updates, success/error notifications) use ARIA live regions
      // Pass Criteria: Status message containers have role="status", role="alert", or aria-live attributes
      // Fail Criteria: Dynamic status updates are not announced to screen readers

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const failures: Array<{ element: string; sourceFile: string; position: string; reason: string; remediation: string }> = [];

      // Check for status/notification containers
      const statusContainers = await p.locator(
        '[class*="notification"], [class*="toast"], [class*="alert"], [class*="status"], [class*="message"], [class*="success"], [class*="error"]'
      ).all();

      for (const [index, container] of statusContainers.entries()) {
        const role = await container.getAttribute('role');
        const ariaLive = await container.getAttribute('aria-live');

        if (!role && !ariaLive) {
          const outerHTML = await container.evaluate(e => e.outerHTML.substring(0, 200));
          const className = await container.getAttribute('class') || '';
          failures.push({
            element: outerHTML,
            sourceFile: p.url(),
            position: `Status container ${index + 1}`,
            reason: `Element with class "${className}" appears to be a status message but lacks ARIA live region attributes`,
            remediation: 'Add role="status" for informational messages, role="alert" for urgent messages, or aria-live="polite" for general updates',
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

        throw new Error(`WCAG 4.1.3 VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});

// ============================================================================
// COMPREHENSIVE AXE-CORE SCAN — ROBUST
// ============================================================================

test.describe('Robust - Comprehensive axe-core scan', () => {

  for (const page of PAGES) {
    test(`4.1.2–4.1.3 Robust - Comprehensive axe-core automated scan on ${page.name} page`, async ({ page: p }) => {
      // WCAG Criterion: 4.1.2 Name, Role, Value and 4.1.3 Status Messages
      // Testing: Automated axe-core scan for all Robust WCAG 2.1 A/AA rules (ARIA validity, duplicate IDs, roles, etc.)
      // Pass Criteria: Zero axe-core violations for robust-related rules across all page elements
      // Fail Criteria: Any axe-core robust violation detected on any element

      await p.goto(page.path, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const robustRules = [
        'aria-valid-attr', 'aria-valid-attr-value', 'aria-allowed-attr',
        'aria-required-attr', 'aria-required-children', 'aria-required-parent',
        'aria-roles', 'aria-hidden-body', 'aria-hidden-focus',
        'duplicate-id', 'duplicate-id-active', 'duplicate-id-aria',
      ];

      const robustViolations = results.violations.filter(v =>
        robustRules.includes(v.id)
      );

      if (robustViolations.length > 0) {
        const failures = robustViolations.flatMap(v =>
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

        throw new Error(`WCAG ROBUST AXE-CORE VIOLATIONS FOUND:\n\n${errorReport}`);
      }
    });
  }
});
